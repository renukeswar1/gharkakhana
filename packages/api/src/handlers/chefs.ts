import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import ngeohash from 'ngeohash'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const TABLE_NAME = process.env.TABLE_NAME!

// Response helper
const response = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
  },
  body: JSON.stringify(body),
})

const getUserId = (event: APIGatewayProxyEvent): string => {
  return event.requestContext.authorizer?.claims?.sub || ''
}

// Chef registration schema
const chefRegistrationSchema = z.object({
  businessName: z.string().min(3),
  bio: z.string().optional(),
  specialties: z.array(z.string()),
  cuisines: z.array(z.string()).min(1),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  serviceRadius: z.number().min(1).max(20),
  workingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
  })).optional(),
})

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  const userId = getUserId(event)

  try {
    // POST /chefs/register - Register as a chef
    if (path === '/chefs/register' && method === 'POST') {
      const data = chefRegistrationSchema.parse(body)
      const chefId = uuidv4()
      const geohash = ngeohash.encode(data.address.latitude, data.address.longitude, 5)

      // Get user profile
      const userResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      }))
      const user = userResult.Item
      if (!user) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        })
      }

      const chef = {
        PK: `CHEF#${chefId}`,
        SK: 'PROFILE',
        entityType: 'CHEF',
        chefId,
        userId,
        email: user.email,
        phone: user.phone,
        name: user.name,
        businessName: data.businessName,
        bio: data.bio || '',
        specialties: data.specialties,
        cuisines: data.cuisines,
        address: {
          ...data.address,
          geohash,
        },
        serviceRadius: data.serviceRadius,
        rating: 0,
        totalReviews: 0,
        totalOrders: 0,
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isAvailable: false,
        workingHours: data.workingHours || {
          'monday': { open: '10:00', close: '20:00' },
          'tuesday': { open: '10:00', close: '20:00' },
          'wednesday': { open: '10:00', close: '20:00' },
          'thursday': { open: '10:00', close: '20:00' },
          'friday': { open: '10:00', close: '20:00' },
          'saturday': { open: '10:00', close: '20:00' },
          'sunday': { open: '10:00', close: '20:00' },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // GSI keys for geo search
        GSI1PK: `GEO#${geohash}`,
        GSI1SK: `CHEF#${chefId}`,
        GSI2PK: `USER#${userId}`,
        GSI2SK: `CHEF#${chefId}`,
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: chef,
      }))

      // Update user role
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET #role = :role, chefId = :chefId, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#role': 'role',
        },
        ExpressionAttributeValues: {
          ':role': 'CHEF',
          ':chefId': chefId,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(201, {
        success: true,
        data: {
          chefId,
          message: 'Registration successful! Please complete verification to start accepting orders.',
          nextSteps: [
            'Upload verification documents (Aadhaar, PAN)',
            'Upload kitchen photos',
            'Upload cooking video (optional)',
            'Wait for verification (usually 24-48 hours)',
          ],
        },
      })
    }

    // GET /chefs/me - Get own chef profile
    if (path === '/chefs/me' && method === 'GET') {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHEF#',
        },
      }))

      const chef = result.Items?.[0]
      if (!chef) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef profile not found' },
        })
      }

      return response(200, {
        success: true,
        data: chef,
      })
    }

    // PUT /chefs/me - Update chef profile
    if (path === '/chefs/me' && method === 'PUT') {
      // Get chef profile
      const chefResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHEF#',
        },
      }))

      const chef = chefResult.Items?.[0]
      if (!chef) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef profile not found' },
        })
      }

      const allowedFields = ['businessName', 'bio', 'specialties', 'cuisines', 'profileImage', 'coverImage', 'serviceRadius', 'workingHours']
      const updates: string[] = []
      const values: Record<string, any> = {}
      const names: Record<string, string> = {}

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates.push(`#${field} = :${field}`)
          names[`#${field}`] = field
          values[`:${field}`] = body[field]
        }
      }

      if (updates.length === 0) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' },
        })
      }

      updates.push('updatedAt = :updatedAt')
      values[':updatedAt'] = new Date().toISOString()

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: chef.PK,
          SK: chef.SK,
        },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: Object.keys(names).length > 0 ? names : undefined,
        ExpressionAttributeValues: values,
      }))

      return response(200, {
        success: true,
        data: { message: 'Profile updated successfully' },
      })
    }

    // PUT /chefs/me/availability - Update availability
    if (path === '/chefs/me/availability' && method === 'PUT') {
      const { isAvailable, workingHours } = body

      const chefResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHEF#',
        },
      }))

      const chef = chefResult.Items?.[0]
      if (!chef) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef profile not found' },
        })
      }

      // Check if chef is verified
      if (chef.verificationStatus !== 'VERIFIED') {
        return response(403, {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Complete verification to update availability' },
        })
      }

      const updateExpression = workingHours
        ? 'SET isAvailable = :isAvailable, workingHours = :workingHours, updatedAt = :updatedAt'
        : 'SET isAvailable = :isAvailable, updatedAt = :updatedAt'

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: chef.PK,
          SK: chef.SK,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ':isAvailable': isAvailable,
          ...(workingHours && { ':workingHours': workingHours }),
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: { 
          isAvailable,
          message: isAvailable ? 'You are now accepting orders!' : 'You are now offline' 
        },
      })
    }

    // POST /chefs/me/verification - Submit verification documents
    if (path === '/chefs/me/verification' && method === 'POST') {
      const { documents } = body

      const chefResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHEF#',
        },
      }))

      const chef = chefResult.Items?.[0]
      if (!chef) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef profile not found' },
        })
      }

      const verification = {
        PK: `CHEF#${chef.chefId}`,
        SK: 'VERIFICATION',
        entityType: 'VERIFICATION',
        chefId: chef.chefId,
        documents: documents.map((doc: any) => ({
          ...doc,
          status: 'PENDING',
          uploadedAt: new Date().toISOString(),
        })),
        overallStatus: 'IN_REVIEW',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: verification,
      }))

      // Update chef status
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: chef.PK,
          SK: chef.SK,
        },
        UpdateExpression: 'SET verificationStatus = :status, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':status': 'IN_REVIEW',
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(201, {
        success: true,
        data: { 
          message: 'Documents submitted for verification',
          status: 'IN_REVIEW',
          estimatedTime: '24-48 hours',
        },
      })
    }

    // GET /chefs/{chefId} - Get public chef profile
    if (path.match(/\/chefs\/[\w-]+$/) && method === 'GET' && !path.includes('/me')) {
      const chefId = event.pathParameters?.chefId

      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CHEF#${chefId}`,
          SK: 'PROFILE',
        },
      }))

      if (!result.Item || result.Item.status !== 'ACTIVE') {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef not found' },
        })
      }

      // Remove sensitive data
      const { email, phone, ...publicProfile } = result.Item

      return response(200, {
        success: true,
        data: publicProfile,
      })
    }

    // GET /chefs/{chefId}/menus - Get chef's menus
    if (path.match(/\/chefs\/[\w-]+\/menus$/) && method === 'GET') {
      const chefId = event.pathParameters?.chefId
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0]

      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':pk': `CHEF#${chefId}`,
          ':sk': `MENU#${date}`,
          ':status': 'ACTIVE',
        },
      }))

      return response(200, {
        success: true,
        data: {
          menus: result.Items || [],
          total: result.Items?.length || 0,
        },
      })
    }

    // GET /chefs/{chefId}/reviews - Get chef's reviews
    if (path.match(/\/chefs\/[\w-]+\/reviews$/) && method === 'GET') {
      const chefId = event.pathParameters?.chefId
      const limit = parseInt(event.queryStringParameters?.limit || '10')

      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI3',
        KeyConditionExpression: 'GSI3PK = :pk AND begins_with(GSI3SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CHEF#${chefId}`,
          ':sk': 'REVIEW#',
        },
        ScanIndexForward: false,
        Limit: limit,
      }))

      return response(200, {
        success: true,
        data: {
          reviews: result.Items || [],
          total: result.Items?.length || 0,
          hasMore: !!result.LastEvaluatedKey,
        },
      })
    }

    return response(404, {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    })
  } catch (error: any) {
    console.error('Error:', error)

    if (error.name === 'ZodError') {
      return response(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      })
    }

    return response(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' },
    })
  }
}
