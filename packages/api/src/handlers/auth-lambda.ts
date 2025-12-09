/**
 * Auth Lambda Handler for AWS
 * Uses DynamoDB for storage and JWT for authentication
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { v4 as uuidv4 } from 'uuid'
import * as crypto from 'crypto'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const snsClient = new SNSClient({})

const TABLE_NAME = process.env.TABLE_NAME!
const OTP_TABLE_NAME = process.env.OTP_TABLE_NAME!
const JWT_SECRET = process.env.JWT_SECRET || 'gharkakhana-secret'

// Simple JWT implementation (for production, use a library like jose)
const createToken = (payload: object, expiresIn: string = '7d'): string => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (7 * 24 * 60 * 60) // 7 days
  
  const fullPayload = { ...payload, iat: now, exp }
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url')
  
  return `${base64Header}.${base64Payload}.${signature}`
}

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

// Password hashing (simple implementation - use bcrypt in production)
const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [salt, hash] = stored.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return hash === verifyHash
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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return response(200, {})
  }
  
  try {
    const body = event.body ? JSON.parse(event.body) : {}

    // POST /auth/register
    if (path === '/auth/register' && method === 'POST') {
      const { email, phone, password, name, role = 'CUSTOMER' } = body

      if (!email || !phone || !password || !name) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'All fields are required' }
        })
      }

      // Check if user exists by email
      const existingByEmail = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `EMAIL#${email.toLowerCase()}`
        }
      }))

      if (existingByEmail.Items && existingByEmail.Items.length > 0) {
        return response(400, {
          success: false,
          error: { code: 'USER_EXISTS', message: 'User with this email already exists' }
        })
      }

      // Normalize phone number
      const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`

      // Check if user exists by phone
      const existingByPhone = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `PHONE#${normalizedPhone}`
        }
      }))

      if (existingByPhone.Items && existingByPhone.Items.length > 0) {
        return response(400, {
          success: false,
          error: { code: 'USER_EXISTS', message: 'User with this phone already exists' }
        })
      }

      const userId = uuidv4()
      const hashedPassword = await hashPassword(password)
      const now = new Date().toISOString()

      const user = {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        entityType: 'USER',
        userId,
        email: email.toLowerCase(),
        phone: normalizedPhone,
        name,
        role,
        password: hashedPassword,
        isVerified: true,
        addresses: [],
        createdAt: now,
        updatedAt: now,
        // GSI1 for email lookup
        GSI1PK: `EMAIL#${email.toLowerCase()}`,
        GSI1SK: 'USER',
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
      }))

      // Also create a phone lookup entry
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PHONE',
          GSI1PK: `PHONE#${normalizedPhone}`,
          GSI1SK: 'USER',
          userId,
        },
      }))

      const token = createToken({ userId, email: email.toLowerCase(), role })

      return response(201, {
        success: true,
        data: {
          userId,
          email,
          name,
          phone: normalizedPhone,
          role,
          token,
          message: 'Registration successful'
        }
      })
    }

    // POST /auth/login
    if (path === '/auth/login' && method === 'POST') {
      const { email, emailOrPhone, password } = body
      const loginId = (emailOrPhone || email || '').toLowerCase().trim()

      if (!loginId || !password) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email/Phone and password are required' }
        })
      }

      // Determine if it's email or phone
      const isEmail = loginId.includes('@')
      let gsi1pk: string

      if (isEmail) {
        gsi1pk = `EMAIL#${loginId}`
      } else {
        // Normalize phone
        const phone = loginId.startsWith('+91') ? loginId : `+91${loginId}`
        gsi1pk = `PHONE#${phone}`
      }

      // Find user
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': gsi1pk
        }
      }))

      if (!result.Items || result.Items.length === 0) {
        return response(401, {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' }
        })
      }

      const userRef = result.Items[0]
      
      // Get full user profile
      const userResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userRef.userId}`,
          SK: 'PROFILE',
        }
      }))

      const user = userResult.Item
      if (!user) {
        return response(401, {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' }
        })
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password)
      if (!isValidPassword) {
        return response(401, {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' }
        })
      }

      // Check if user is a chef
      let chef = null
      if (user.role === 'CHEF') {
        const chefResult = await docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `CHEF_USER#${user.userId}`
          }
        }))
        if (chefResult.Items && chefResult.Items.length > 0) {
          chef = {
            chefId: chefResult.Items[0].chefId,
            businessName: chefResult.Items[0].businessName,
            status: chefResult.Items[0].status
          }
        }
      }

      const token = createToken({ 
        userId: user.userId, 
        email: user.email, 
        role: user.role 
      })

      return response(200, {
        success: true,
        data: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          token,
          chef
        }
      })
    }

    // POST /auth/send-otp - Send OTP to phone
    if (path === '/auth/send-otp' && method === 'POST') {
      const { phone } = body

      if (!phone) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Phone number is required' }
        })
      }

      // Normalize phone
      const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = Math.floor(Date.now() / 1000) + 300 // 5 minutes

      // Store OTP in DynamoDB
      await docClient.send(new PutCommand({
        TableName: OTP_TABLE_NAME,
        Item: {
          phone: normalizedPhone,
          otp,
          expiresAt,
          createdAt: new Date().toISOString()
        }
      }))

      // In production, send SMS via SNS
      // For development, just return success (OTP is logged)
      console.log(`OTP for ${normalizedPhone}: ${otp}`)

      // Uncomment to send real SMS:
      // await snsClient.send(new PublishCommand({
      //   PhoneNumber: normalizedPhone,
      //   Message: `Your GharKaKhana verification code is: ${otp}. Valid for 5 minutes.`
      // }))

      return response(200, {
        success: true,
        data: {
          message: 'OTP sent successfully',
          // For development only - remove in production:
          otp_dev_only: otp
        }
      })
    }

    // POST /auth/verify-otp - Verify OTP and login/register
    if (path === '/auth/verify-otp' && method === 'POST') {
      const { phone, otp } = body

      if (!phone || !otp) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Phone and OTP are required' }
        })
      }

      // Normalize phone
      const normalizedPhone = phone.startsWith('+91') ? phone : `+91${phone}`

      // Get OTP from DynamoDB
      const otpResult = await docClient.send(new GetCommand({
        TableName: OTP_TABLE_NAME,
        Key: { phone: normalizedPhone }
      }))

      if (!otpResult.Item || otpResult.Item.otp !== otp) {
        return response(400, {
          success: false,
          error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' }
        })
      }

      // Check expiry
      if (otpResult.Item.expiresAt < Math.floor(Date.now() / 1000)) {
        return response(400, {
          success: false,
          error: { code: 'EXPIRED_OTP', message: 'OTP has expired' }
        })
      }

      // Delete used OTP
      await docClient.send(new DeleteCommand({
        TableName: OTP_TABLE_NAME,
        Key: { phone: normalizedPhone }
      }))

      // Check if user exists
      const userResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `PHONE#${normalizedPhone}`
        }
      }))

      if (userResult.Items && userResult.Items.length > 0) {
        // User exists - login
        const userRef = userResult.Items[0]
        const fullUser = await docClient.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userRef.userId}`,
            SK: 'PROFILE'
          }
        }))

        if (fullUser.Item) {
          const user = fullUser.Item
          const token = createToken({
            userId: user.userId,
            email: user.email,
            role: user.role
          })

          return response(200, {
            success: true,
            data: {
              isNewUser: false,
              userId: user.userId,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
              token
            }
          })
        }
      }

      // New user - return flag for client to complete registration
      return response(200, {
        success: true,
        data: {
          isNewUser: true,
          phone: normalizedPhone,
          message: 'Phone verified. Please complete registration.'
        }
      })
    }

    // GET /auth/me or /auth/profile
    if ((path === '/auth/me' || path === '/auth/profile') && method === 'GET') {
      const decoded = getUserFromToken(event)
      if (!decoded) {
        return response(401, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
        })
      }

      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${decoded.userId}`,
          SK: 'PROFILE',
        }
      }))

      if (!result.Item) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' }
        })
      }

      const { password, ...userWithoutPassword } = result.Item

      // Check if user is a chef
      let chef = null
      if (result.Item.role === 'CHEF') {
        const chefResult = await docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `CHEF_USER#${decoded.userId}`
          }
        }))
        if (chefResult.Items && chefResult.Items.length > 0) {
          chef = {
            chefId: chefResult.Items[0].chefId,
            businessName: chefResult.Items[0].businessName,
            status: chefResult.Items[0].status
          }
        }
      }

      return response(200, {
        success: true,
        data: {
          ...userWithoutPassword,
          chef
        }
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
