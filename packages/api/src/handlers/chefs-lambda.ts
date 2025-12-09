/**
 * Chefs Lambda Handler for AWS
 * Handles chef registration, profile, search by location
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import * as crypto from 'crypto'
import ngeohash from 'ngeohash'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const TABLE_NAME = process.env.TABLE_NAME!
const JWT_SECRET = process.env.JWT_SECRET || 'gharkakhana-secret'

// Verify JWT token
const verifyToken = (token: string): any => {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')
  
  const [header, payload, signature] = parts
  
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')
  
  if (signature !== expectedSignature) throw new Error('Invalid signature')
  
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
  
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }
  
  return decoded
}

// Response helper
const response = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
})

// Extract user from JWT token
const getUserFromToken = (event: APIGatewayProxyEvent): any => {
  const authHeader = event.headers.Authorization || event.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  try {
    const token = authHeader.split(' ')[1]
    return verifyToken(token)
  } catch {
    return null
  }
}

// Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const pathParams = event.pathParameters || {}
  
  console.log('Request:', { path, method, pathParams })
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return response(200, {})
  }
  
  try {
    const body = event.body ? JSON.parse(event.body) : {}

    // POST /chefs - Register as a chef (was /chefs/register)
    if (path === '/chefs' && method === 'POST') {
      const decoded = getUserFromToken(event)
      if (!decoded) {
        return response(401, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        })
      }

      const {
        businessName,
        bio,
        specialties,
        cuisines,
        address,
        serviceRadius = 5,
        aadhaarNumber,
        panNumber,
        fssaiNumber
      } = body

      if (!businessName || !cuisines || cuisines.length === 0 || !address) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Business name, cuisines, and address are required' }
        })
      }

      // Get user profile
      const userResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${decoded.userId}`,
          SK: 'PROFILE',
        }
      }))

      if (!userResult.Item) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' }
        })
      }

      const user = userResult.Item

      // Check if already registered as chef
      const existingChef = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `CHEF_USER#${decoded.userId}`
        }
      }))

      if (existingChef.Items && existingChef.Items.length > 0) {
        return response(400, {
          success: false,
          error: { code: 'ALREADY_CHEF', message: 'You are already registered as a chef' }
        })
      }

      // Generate geohash from coordinates
      let geohash = ''
      if (address.latitude && address.longitude) {
        geohash = ngeohash.encode(address.latitude, address.longitude, 7)
      }

      const chefId = uuidv4()
      const now = new Date().toISOString()

      const chef = {
        PK: `CHEF#${chefId}`,
        SK: 'PROFILE',
        entityType: 'CHEF',
        chefId,
        userId: decoded.userId,
        email: user.email,
        phone: user.phone,
        name: user.name,
        businessName,
        bio: bio || '',
        specialties: specialties || [],
        cuisines,
        address: {
          ...address,
          geohash
        },
        serviceRadius,
        verification: {
          aadhaarNumber: aadhaarNumber || '',
          panNumber: panNumber || '',
          fssaiNumber: fssaiNumber || '',
          isVerified: false,
          documents: []
        },
        rating: 0,
        totalReviews: 0,
        totalOrders: 0,
        status: 'PENDING', // PENDING, APPROVED, REJECTED, SUSPENDED
        isAvailable: false,
        workingHours: {},
        createdAt: now,
        updatedAt: now,
        // GSI1 for user lookup
        GSI1PK: `CHEF_USER#${decoded.userId}`,
        GSI1SK: 'PROFILE',
        // GSI2 for geolocation search (using geohash prefix)
        GSI2PK: geohash ? `GEO#${geohash.substring(0, 4)}` : 'GEO#NONE',
        GSI2SK: `CHEF#${chefId}`,
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: chef,
      }))

      // Update user role to CHEF
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${decoded.userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET #role = :role, updatedAt = :now',
        ExpressionAttributeNames: {
          '#role': 'role',
        },
        ExpressionAttributeValues: {
          ':role': 'CHEF',
          ':now': now,
        },
      }))

      return response(201, {
        success: true,
        data: {
          chefId,
          businessName,
          status: 'PENDING',
          message: 'Chef registration submitted. Please wait for approval.'
        }
      })
    }

    // GET /chefs or /chefs/search - Search chefs by location
    if ((path === '/chefs' || path === '/chefs/search') && method === 'GET') {
      const { lat, lng, radius = '10', cuisine } = event.queryStringParameters || {}

      // For simplicity, scan all chefs and filter
      // In production, you'd use GSI2 with geohash for efficient geo queries
      const result = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':entityType': 'CHEF',
        },
      }))

      let chefs = result.Items || []

      // Filter by cuisine if provided
      if (cuisine) {
        chefs = chefs.filter((c: any) =>
          c.cuisines?.some((cuis: string) =>
            cuis.toLowerCase().includes(cuisine.toLowerCase())
          )
        )
      }

      // Filter by distance if coordinates provided
      if (lat && lng) {
        const userLat = parseFloat(lat)
        const userLng = parseFloat(lng)
        const maxRadius = parseFloat(radius)

        chefs = chefs
          .map((chef: any) => {
            if (chef.address?.latitude && chef.address?.longitude) {
              const distance = calculateDistance(
                userLat, userLng,
                chef.address.latitude, chef.address.longitude
              )
              return { ...chef, distance: Math.round(distance * 10) / 10 }
            }
            return { ...chef, distance: 999 }
          })
          .filter((chef: any) => chef.distance <= Math.min(maxRadius, chef.serviceRadius))
          .sort((a: any, b: any) => a.distance - b.distance)
      }

      // Remove sensitive data
      const sanitizedChefs = chefs.map((chef: any) => ({
        chefId: chef.chefId,
        businessName: chef.businessName,
        name: chef.name,
        bio: chef.bio,
        cuisines: chef.cuisines,
        rating: chef.rating,
        totalReviews: chef.totalReviews,
        address: {
          city: chef.address?.city,
          area: chef.address?.area,
        },
        distance: chef.distance,
        isAvailable: chef.isAvailable,
      }))

      return response(200, {
        success: true,
        data: sanitizedChefs
      })
    }

    // GET /chefs/{chefId} - Get chef profile
    if (path.match(/^\/chefs\/[^/]+$/) && method === 'GET') {
      const chefId = event.pathParameters?.chefId

      if (!chefId) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Chef ID is required' }
        })
      }

      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CHEF#${chefId}`,
          SK: 'PROFILE',
        }
      }))

      if (!result.Item) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef not found' }
        })
      }

      // Get menu items
      const menuResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CHEF#${chefId}`,
          ':sk': 'MENU#',
        }
      }))

      const { verification, ...chefData } = result.Item

      return response(200, {
        success: true,
        data: {
          ...chefData,
          isVerified: verification?.isVerified || false,
          menuItems: menuResult.Items || []
        }
      })
    }

    // GET /chefs/me/profile - Get my chef profile
    if (path === '/chefs/me/profile' && method === 'GET') {
      const decoded = getUserFromToken(event)
      if (!decoded) {
        return response(401, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        })
      }

      // Find chef by userId
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `CHEF_USER#${decoded.userId}`
        }
      }))

      if (!result.Items || result.Items.length === 0) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef profile not found' }
        })
      }

      const chef = result.Items[0]

      // Get menu items
      const menuResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CHEF#${chef.chefId}`,
          ':sk': 'MENU#',
        }
      }))

      return response(200, {
        success: true,
        data: {
          ...chef,
          menuItems: menuResult.Items || []
        }
      })
    }

    // PATCH /chefs/me/availability - Update availability
    if (path === '/chefs/me/availability' && method === 'PATCH') {
      const decoded = getUserFromToken(event)
      if (!decoded) {
        return response(401, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        })
      }

      const { isAvailable } = body

      // Find chef by userId
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `CHEF_USER#${decoded.userId}`
        }
      }))

      if (!result.Items || result.Items.length === 0) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chef profile not found' }
        })
      }

      const chef = result.Items[0]

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CHEF#${chef.chefId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: 'SET isAvailable = :available, updatedAt = :now',
        ExpressionAttributeValues: {
          ':available': isAvailable,
          ':now': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: { isAvailable }
      })
    }

    return response(404, {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
    })

  } catch (error: any) {
    console.error('Error:', error)
    return response(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    })
  }
}
