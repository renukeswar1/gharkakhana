import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

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

// Generate order ID
const generateOrderId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `GKK-${dateStr}-${random}`
}

// Create order schema
const createOrderSchema = z.object({
  menuId: z.string().uuid(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
  deliveryAddressId: z.string().uuid(),
  deliverySlot: z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  specialInstructions: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'COD', 'WALLET']),
})

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  const userId = getUserId(event)

  try {
    // POST /orders - Create new order
    if (path === '/orders' && method === 'POST') {
      const orderData = createOrderSchema.parse(body)
      const orderId = generateOrderId()

      // Get user profile with addresses
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

      const deliveryAddress = user.addresses?.find(
        (addr: any) => addr.addressId === orderData.deliveryAddressId
      )
      if (!deliveryAddress) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid delivery address' },
        })
      }

      // Get menu
      const menuResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI3',
        KeyConditionExpression: 'begins_with(GSI3SK, :sk)',
        FilterExpression: 'menuId = :menuId',
        ExpressionAttributeValues: {
          ':sk': 'MENU#',
          ':menuId': orderData.menuId,
        },
      }))
      const menu = menuResult.Items?.[0]
      if (!menu) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Menu not found' },
        })
      }

      // Get chef
      const chefResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CHEF#${menu.chefId}`,
          SK: 'PROFILE',
        },
      }))
      const chef = chefResult.Item

      // Validate items and calculate pricing
      const orderItems: any[] = []
      let subtotal = 0

      for (const orderItem of orderData.items) {
        const menuItem = menu.items.find((item: any) => item.itemId === orderItem.itemId)
        if (!menuItem) {
          return response(400, {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: `Item ${orderItem.itemId} not found in menu` },
          })
        }
        if (!menuItem.isAvailable || menuItem.remainingQuantity < orderItem.quantity) {
          return response(400, {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: `Item ${menuItem.name} is not available in requested quantity` },
          })
        }

        const price = menuItem.discountedPrice || menuItem.price
        const itemSubtotal = price * orderItem.quantity
        subtotal += itemSubtotal

        orderItems.push({
          itemId: orderItem.itemId,
          name: menuItem.name,
          price,
          quantity: orderItem.quantity,
          subtotal: itemSubtotal,
        })
      }

      // Check minimum order
      if (subtotal < menu.minimumOrderAmount) {
        return response(400, {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: `Minimum order amount is ₹${menu.minimumOrderAmount}` 
          },
        })
      }

      // Calculate pricing
      const packagingDeposit = menu.packagingType === 'STEEL_BOX' ? menu.packagingDeposit * orderItems.length : 0
      const deliveryFee = subtotal >= (menu.freeDeliveryAbove || 99999) ? 0 : menu.deliveryFee
      const taxes = Math.round(subtotal * 0.05) // 5% GST
      const total = subtotal + packagingDeposit + deliveryFee + taxes

      const order = {
        PK: `ORDER#${orderId}`,
        SK: 'DETAILS',
        entityType: 'ORDER',
        orderId,
        customerId: userId,
        customerName: user.name,
        customerPhone: user.phone,
        chefId: menu.chefId,
        chefName: chef?.businessName || menu.chefName,
        chefPhone: chef?.phone,
        menuId: orderData.menuId,
        menuDate: menu.date,
        items: orderItems,
        deliveryAddress,
        pricing: {
          subtotal,
          packagingFee: 0,
          packagingDeposit,
          deliveryFee,
          taxes,
          discount: 0,
          total,
        },
        payment: {
          method: orderData.paymentMethod,
          status: 'PENDING',
        },
        status: 'PLACED',
        statusHistory: [
          { status: 'PLACED', timestamp: new Date().toISOString() },
        ],
        deliverySlot: orderData.deliverySlot,
        specialInstructions: orderData.specialInstructions,
        packagingType: menu.packagingType,
        steelBoxCount: menu.packagingType === 'STEEL_BOX' ? orderItems.length : 0,
        steelBoxReturned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // GSI keys
        GSI2PK: `CUSTOMER#${userId}`,
        GSI2SK: `ORDER#${menu.date}#${orderId}`,
        GSI3PK: `CHEF#${menu.chefId}`,
        GSI3SK: `ORDER#${menu.date}#${orderId}`,
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: order,
      }))

      // Update menu item quantities
      const updatedItems = menu.items.map((item: any) => {
        const orderItem = orderData.items.find(oi => oi.itemId === item.itemId)
        if (orderItem) {
          return {
            ...item,
            remainingQuantity: item.remainingQuantity - orderItem.quantity,
            isAvailable: item.remainingQuantity - orderItem.quantity > 0,
          }
        }
        return item
      })

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: menu.PK, SK: menu.SK },
        UpdateExpression: 'SET items = :items, totalOrders = totalOrders + :one, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': updatedItems,
          ':one': 1,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(201, {
        success: true,
        data: {
          orderId,
          status: 'PLACED',
          pricing: order.pricing,
          // In production, include Razorpay order details
          paymentDetails: {
            amount: total * 100, // In paise
            currency: 'INR',
          },
        },
      })
    }

    // GET /orders - Get user's orders
    if (path === '/orders' && method === 'GET') {
      const status = event.queryStringParameters?.status
      const limit = parseInt(event.queryStringParameters?.limit || '20')

      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `CUSTOMER#${userId}`,
          ':sk': 'ORDER#',
        },
        ScanIndexForward: false, // Latest first
        Limit: limit,
      }))

      let orders = result.Items || []
      if (status) {
        orders = orders.filter(order => order.status === status)
      }

      return response(200, {
        success: true,
        data: {
          orders,
          total: orders.length,
          hasMore: !!result.LastEvaluatedKey,
        },
      })
    }

    // GET /orders/{orderId}
    if (path.match(/\/orders\/[A-Z0-9-]+$/) && method === 'GET') {
      const orderId = event.pathParameters?.orderId

      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: 'DETAILS',
        },
      }))

      if (!result.Item) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Order not found' },
        })
      }

      // Check if user owns this order or is the chef
      const order = result.Item
      if (order.customerId !== userId && order.chefId !== userId) {
        return response(403, {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to view this order' },
        })
      }

      return response(200, {
        success: true,
        data: order,
      })
    }

    // PUT /orders/{orderId}/status - Update order status (chef only)
    if (path.match(/\/orders\/[A-Z0-9-]+\/status$/) && method === 'PUT') {
      const orderId = event.pathParameters?.orderId
      const { status } = body

      const validStatuses = ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
      if (!validStatuses.includes(status)) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid status' },
        })
      }

      // Get order
      const orderResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
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

      // Update status
      const newStatusHistory = [
        ...order.statusHistory,
        { status, timestamp: new Date().toISOString() },
      ]

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: 'DETAILS',
        },
        UpdateExpression: 'SET #status = :status, statusHistory = :history, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':history': newStatusHistory,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: { 
          orderId, 
          status,
          message: `Order status updated to ${status}` 
        },
      })
    }

    // POST /orders/{orderId}/cancel
    if (path.match(/\/orders\/[A-Z0-9-]+\/cancel$/) && method === 'POST') {
      const orderId = event.pathParameters?.orderId
      const { reason } = body

      // Get order
      const orderResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
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

      // Check if can be cancelled
      if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Order cannot be cancelled at this stage' },
        })
      }

      const newStatusHistory = [
        ...order.statusHistory,
        { status: 'CANCELLED', timestamp: new Date().toISOString(), reason },
      ]

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: 'DETAILS',
        },
        UpdateExpression: 'SET #status = :status, statusHistory = :history, cancellationReason = :reason, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'CANCELLED',
          ':history': newStatusHistory,
          ':reason': reason,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: { 
          orderId, 
          status: 'CANCELLED',
          message: 'Order cancelled successfully' 
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
