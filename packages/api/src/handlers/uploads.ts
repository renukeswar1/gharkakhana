import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const s3Client = new S3Client({})
const BUCKET_NAME = process.env.BUCKET_NAME!

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

const presignedUrlSchema = z.object({
  fileType: z.string().regex(/^image\/(jpeg|png|gif|webp)|video\/(mp4|mov)|application\/pdf$/),
  purpose: z.enum(['PROFILE_IMAGE', 'MENU_IMAGE', 'REVIEW_IMAGE', 'VERIFICATION_DOC', 'KITCHEN_PHOTO', 'COOKING_VIDEO']),
})

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  const userId = getUserId(event)

  try {
    // POST /uploads/presigned-url
    if (path === '/uploads/presigned-url' && method === 'POST') {
      const data = presignedUrlSchema.parse(body)
      
      // Generate file key
      const extension = data.fileType.split('/')[1]
      const fileKey = `${data.purpose.toLowerCase()}/${userId}/${uuidv4()}.${extension}`

      // Create presigned URL for upload
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: data.fileType,
        Metadata: {
          userId,
          purpose: data.purpose,
          uploadedAt: new Date().toISOString(),
        },
      })

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300, // 5 minutes
      })

      // Construct the final URL
      const finalUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`

      return response(200, {
        success: true,
        data: {
          uploadUrl: presignedUrl,
          fileUrl: finalUrl,
          fileKey,
          expiresIn: 300,
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
