import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const cognitoClient = new CognitoIdentityProviderClient({})

const TABLE_NAME = process.env.TABLE_NAME!
const USER_POOL_ID = process.env.USER_POOL_ID!
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['CUSTOMER', 'CHEF']),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}

  try {
    // POST /auth/register
    if (path === '/auth/register' && method === 'POST') {
      const data = registerSchema.parse(body)
      const userId = uuidv4()

      // Create user in Cognito
      await cognitoClient.send(new SignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: data.email,
        Password: data.password,
        UserAttributes: [
          { Name: 'email', Value: data.email },
          { Name: 'phone_number', Value: data.phone },
          { Name: 'name', Value: data.name },
          { Name: 'custom:role', Value: data.role },
        ],
      }))

      // Create user in DynamoDB
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          entityType: 'USER',
          userId,
          email: data.email,
          phone: data.phone,
          name: data.name,
          role: data.role,
          addresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          GSI2PK: `USER#${userId}`,
          GSI2SK: 'PROFILE',
        },
      }))

      return response(201, {
        success: true,
        data: {
          userId,
          email: data.email,
          message: 'Please verify your email/phone to complete registration',
        },
      })
    }

    // POST /auth/login
    if (path === '/auth/login' && method === 'POST') {
      const data = loginSchema.parse(body)

      const authResult = await cognitoClient.send(new InitiateAuthCommand({
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: data.email,
          PASSWORD: data.password,
        },
      }))

      return response(200, {
        success: true,
        data: {
          accessToken: authResult.AuthenticationResult?.AccessToken,
          idToken: authResult.AuthenticationResult?.IdToken,
          refreshToken: authResult.AuthenticationResult?.RefreshToken,
          expiresIn: authResult.AuthenticationResult?.ExpiresIn,
        },
      })
    }

    // POST /auth/verify-otp
    if (path === '/auth/verify-otp' && method === 'POST') {
      const { email, code } = body

      await cognitoClient.send(new ConfirmSignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }))

      return response(200, {
        success: true,
        data: {
          message: 'Email verified successfully',
        },
      })
    }

    // POST /auth/forgot-password
    if (path === '/auth/forgot-password' && method === 'POST') {
      // Implement forgot password logic
      return response(200, {
        success: true,
        data: {
          message: 'Password reset email sent',
        },
      })
    }

    // POST /auth/reset-password
    if (path === '/auth/reset-password' && method === 'POST') {
      // Implement reset password logic
      return response(200, {
        success: true,
        data: {
          message: 'Password reset successful',
        },
      })
    }

    return response(404, {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
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
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
    })
  }
}
