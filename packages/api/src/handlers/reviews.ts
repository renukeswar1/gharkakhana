import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const TABLE_NAME = process.env.TABLE_NAME!

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

const createReviewSchema = z.object({
  orderId: z.string(),
  rating: z.number().min(1).max(5),
  foodRating: z.number().min(1).max(5),
  hygieneRating: z.number().min(1).max(5),
  packagingRating: z.number().min(1).max(5),
  deliveryRating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
})

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  const userId = getUserId(event)

  try {
    // POST /reviews - Create review
    if (path === '/reviews' && method === 'POST') {
      const data = createReviewSchema.parse(body)
      const reviewId = uuidv4()

      // Get order to validate
      const orderResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${data.orderId}`,
          SK: 'DETAILS',
        },
      }))
      const order = orderResult.Item
      if (!order) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Order not found' },
        })
      }

      if (order.customerId !== userId) {
        return response(403, {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only review your own orders' },
        })
      }

      if (order.status !== 'DELIVERED') {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'You can only review delivered orders' },
        })
      }

      // Check if already reviewed
      const existingReview = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        FilterExpression: 'orderId = :orderId',
        ExpressionAttributeValues: {
          ':pk': `CUSTOMER#${userId}`,
          ':sk': 'REVIEW#',
          ':orderId': data.orderId,
        },
      }))

      if (existingReview.Items?.length) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'You have already reviewed this order' },
        })
      }

      // Get user profile
      const userResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      }))

      const review = {
        PK: `REVIEW#${reviewId}`,
        SK: 'DETAILS',
        entityType: 'REVIEW',
        reviewId,
        orderId: data.orderId,
        customerId: userId,
        customerName: userResult.Item?.name || 'Anonymous',
        chefId: order.chefId,
        rating: data.rating,
        foodRating: data.foodRating,
        hygieneRating: data.hygieneRating,
        packagingRating: data.packagingRating,
        deliveryRating: data.deliveryRating,
        title: data.title,
        comment: data.comment,
        images: data.images || [],
        itemsOrdered: order.items.map((item: any) => item.name),
        isVerifiedPurchase: true,
        helpfulCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // GSI keys
        GSI2PK: `CUSTOMER#${userId}`,
        GSI2SK: `REVIEW#${new Date().toISOString()}#${reviewId}`,
        GSI3PK: `CHEF#${order.chefId}`,
        GSI3SK: `REVIEW#${new Date().toISOString()}#${reviewId}`,
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: review,
      }))

      // Update chef's rating
      const chefResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CHEF#${order.chefId}`,
          SK: 'PROFILE',
        },
      }))
      const chef = chefResult.Item

      if (chef) {
        const totalReviews = chef.totalReviews + 1
        const newRating = ((chef.rating * chef.totalReviews) + data.rating) / totalReviews

        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CHEF#${order.chefId}`,
            SK: 'PROFILE',
          },
          UpdateExpression: 'SET rating = :rating, totalReviews = :totalReviews, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':rating': Math.round(newRating * 10) / 10,
            ':totalReviews': totalReviews,
            ':updatedAt': new Date().toISOString(),
          },
        }))
      }

      return response(201, {
        success: true,
        data: {
          reviewId,
          message: 'Thank you for your review!',
        },
      })
    }

    // POST /reviews/{reviewId}/response - Chef responds to review
    if (path.match(/\/reviews\/[\w-]+\/response$/) && method === 'POST') {
      const reviewId = event.pathParameters?.reviewId
      const { comment } = body

      const reviewResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `REVIEW#${reviewId}`,
          SK: 'DETAILS',
        },
      }))
      const review = reviewResult.Item
      if (!review) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Review not found' },
        })
      }

      // Verify chef owns this review
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

      if (!chef || chef.chefId !== review.chefId) {
        return response(403, {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to respond to this review' },
        })
      }

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `REVIEW#${reviewId}`,
          SK: 'DETAILS',
        },
        UpdateExpression: 'SET chefResponse = :response, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':response': {
            comment,
            respondedAt: new Date().toISOString(),
          },
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: { message: 'Response added successfully' },
      })
    }

    // POST /reviews/{reviewId}/helpful
    if (path.match(/\/reviews\/[\w-]+\/helpful$/) && method === 'POST') {
      const reviewId = event.pathParameters?.reviewId

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `REVIEW#${reviewId}`,
          SK: 'DETAILS',
        },
        UpdateExpression: 'SET helpfulCount = helpfulCount + :inc',
        ExpressionAttributeValues: {
          ':inc': 1,
        },
      }))

      return response(200, {
        success: true,
        data: { message: 'Marked as helpful' },
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
