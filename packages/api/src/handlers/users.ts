import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
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

// Get user ID from Cognito authorizer
const getUserId = (event: APIGatewayProxyEvent): string => {
  return event.requestContext.authorizer?.claims?.sub || ''
}

// Address schema
const addressSchema = z.object({
  label: z.string(),
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  latitude: z.number(),
  longitude: z.number(),
  isDefault: z.boolean().optional(),
})

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  const userId = getUserId(event)

  try {
    // GET /users/me
    if (path === '/users/me' && method === 'GET') {
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      }))

      if (!result.Item) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        })
      }

      return response(200, {
        success: true,
        data: result.Item,
      })
    }

    // PUT /users/me
    if (path === '/users/me' && method === 'PUT') {
      const { name, phone, profileImage } = body

      const updateExpressions: string[] = []
      const expressionAttributeNames: Record<string, string> = {}
      const expressionAttributeValues: Record<string, any> = {}

      if (name) {
        updateExpressions.push('#name = :name')
        expressionAttributeNames['#name'] = 'name'
        expressionAttributeValues[':name'] = name
      }
      if (phone) {
        updateExpressions.push('phone = :phone')
        expressionAttributeValues[':phone'] = phone
      }
      if (profileImage) {
        updateExpressions.push('profileImage = :profileImage')
        expressionAttributeValues[':profileImage'] = profileImage
      }

      updateExpressions.push('updatedAt = :updatedAt')
      expressionAttributeValues[':updatedAt'] = new Date().toISOString()

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 
          ? expressionAttributeNames 
          : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
      }))

      return response(200, {
        success: true,
        data: { message: 'Profile updated successfully' },
      })
    }

    // POST /users/me/addresses
    if (path === '/users/me/addresses' && method === 'POST') {
      const addressData = addressSchema.parse(body)
      const addressId = uuidv4()
      const geohash = ngeohash.encode(addressData.latitude, addressData.longitude, 6)

      const newAddress = {
        addressId,
        ...addressData,
        geohash,
      }

      // Get current user
      const userResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      }))

      const addresses = userResult.Item?.addresses || []
      
      // If this is set as default, remove default from others
      if (addressData.isDefault) {
        addresses.forEach((addr: any) => addr.isDefault = false)
      }
      
      addresses.push(newAddress)

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET addresses = :addresses, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':addresses': addresses,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(201, {
        success: true,
        data: newAddress,
      })
    }

    // PUT /users/me/addresses/{addressId}
    if (path.match(/\/users\/me\/addresses\/[\w-]+$/) && method === 'PUT') {
      const addressId = event.pathParameters?.addressId

      // Get current user
      const userResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      }))

      const addresses = userResult.Item?.addresses || []
      const addressIndex = addresses.findIndex((addr: any) => addr.addressId === addressId)

      if (addressIndex === -1) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Address not found' },
        })
      }

      const updatedAddress = { ...addresses[addressIndex], ...body }
      if (body.latitude && body.longitude) {
        updatedAddress.geohash = ngeohash.encode(body.latitude, body.longitude, 6)
      }

      if (body.isDefault) {
        addresses.forEach((addr: any) => addr.isDefault = false)
      }

      addresses[addressIndex] = updatedAddress

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET addresses = :addresses, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':addresses': addresses,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: updatedAddress,
      })
    }

    // DELETE /users/me/addresses/{addressId}
    if (path.match(/\/users\/me\/addresses\/[\w-]+$/) && method === 'DELETE') {
      const addressId = event.pathParameters?.addressId

      const userResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      }))

      const addresses = (userResult.Item?.addresses || []).filter(
        (addr: any) => addr.addressId !== addressId
      )

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET addresses = :addresses, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':addresses': addresses,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: { message: 'Address deleted successfully' },
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
