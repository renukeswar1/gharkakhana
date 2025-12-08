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

// Menu item schema
const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string(),
  cuisine: z.string().optional(),
  price: z.number().positive(),
  discountedPrice: z.number().positive().optional(),
  quantity: z.number().positive(),
  unit: z.string().default('plate'),
  servingSize: z.string().optional(),
  isVeg: z.boolean(),
  spiceLevel: z.enum(['Mild', 'Medium', 'Spicy', 'Extra Spicy']).optional(),
  allergens: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  preparationTime: z.number().positive().optional(),
  availableFrom: z.string(),
  availableTill: z.string(),
})

// Create menu schema
const createMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS']),
  items: z.array(menuItemSchema).min(1),
  orderCutoffTime: z.string(),
  deliveryStartTime: z.string(),
  deliveryEndTime: z.string(),
  packagingType: z.enum(['STEEL_BOX', 'DISPOSABLE', 'CUSTOMER_BOX']),
  packagingDeposit: z.number().nonnegative(),
  minimumOrderAmount: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  freeDeliveryAbove: z.number().nonnegative().optional(),
})

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const body = event.body ? JSON.parse(event.body) : {}
  const userId = getUserId(event)

  try {
    // Get chef profile for the user
    const getChefProfile = async () => {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'CHEF#',
        },
      }))
      return result.Items?.[0]
    }

    // POST /menus - Create new menu
    if (path === '/menus' && method === 'POST') {
      const chef = await getChefProfile()
      if (!chef) {
        return response(403, {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only verified chefs can create menus' },
        })
      }

      const menuData = createMenuSchema.parse(body)
      const menuId = uuidv4()
      const geohash = ngeohash.encode(chef.address.latitude, chef.address.longitude, 5)

      // Add itemId to each item
      const itemsWithIds = menuData.items.map(item => ({
        ...item,
        itemId: uuidv4(),
        remainingQuantity: item.quantity,
        isAvailable: true,
      }))

      const menu = {
        PK: `CHEF#${chef.chefId}`,
        SK: `MENU#${menuData.date}#${menuId}`,
        entityType: 'DAILY_MENU',
        menuId,
        chefId: chef.chefId,
        chefName: chef.businessName,
        date: menuData.date,
        items: itemsWithIds,
        mealType: menuData.mealType,
        orderCutoffTime: menuData.orderCutoffTime,
        deliveryStartTime: menuData.deliveryStartTime,
        deliveryEndTime: menuData.deliveryEndTime,
        packagingType: menuData.packagingType,
        packagingDeposit: menuData.packagingDeposit,
        minimumOrderAmount: menuData.minimumOrderAmount,
        deliveryFee: menuData.deliveryFee,
        freeDeliveryAbove: menuData.freeDeliveryAbove || 0,
        status: 'ACTIVE',
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // GSI keys
        GSI1PK: `GEO#${geohash}`,
        GSI1SK: `${menuData.date}#MENU#${menuId}`,
        GSI3PK: `CHEF#${chef.chefId}`,
        GSI3SK: `MENU#${menuData.date}#${menuId}`,
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: menu,
      }))

      return response(201, {
        success: true,
        data: {
          menuId,
          date: menuData.date,
          itemCount: itemsWithIds.length,
          message: 'Menu created successfully',
        },
      })
    }

    // GET /menus/my - Get chef's own menus
    if (path === '/menus/my' && method === 'GET') {
      const chef = await getChefProfile()
      if (!chef) {
        return response(403, {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only chefs can access this endpoint' },
        })
      }

      const startDate = event.queryStringParameters?.startDate || new Date().toISOString().split('T')[0]
      const endDate = event.queryStringParameters?.endDate

      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: endDate 
          ? 'PK = :pk AND SK BETWEEN :start AND :end'
          : 'PK = :pk AND SK >= :start',
        ExpressionAttributeValues: {
          ':pk': `CHEF#${chef.chefId}`,
          ':start': `MENU#${startDate}`,
          ...(endDate && { ':end': `MENU#${endDate}#\uffff` }),
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

    // GET /menus/{menuId}
    if (path.match(/\/menus\/[\w-]+$/) && method === 'GET') {
      const menuId = event.pathParameters?.menuId

      // Query to find the menu (we need to know the chef and date)
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI3',
        KeyConditionExpression: 'begins_with(GSI3SK, :sk)',
        FilterExpression: 'menuId = :menuId',
        ExpressionAttributeValues: {
          ':sk': 'MENU#',
          ':menuId': menuId,
        },
      }))

      const menu = result.Items?.[0]
      if (!menu) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Menu not found' },
        })
      }

      return response(200, {
        success: true,
        data: menu,
      })
    }

    // PUT /menus/{menuId}/items/{itemId}/availability
    if (path.match(/\/menus\/[\w-]+\/items\/[\w-]+\/availability$/) && method === 'PUT') {
      const menuId = event.pathParameters?.menuId
      const itemId = event.pathParameters?.itemId
      const { isAvailable, remainingQuantity } = body

      const chef = await getChefProfile()
      if (!chef) {
        return response(403, {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only chefs can update menu items' },
        })
      }

      // Find the menu
      const menuResult = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'menuId = :menuId',
        ExpressionAttributeValues: {
          ':pk': `CHEF#${chef.chefId}`,
          ':sk': 'MENU#',
          ':menuId': menuId,
        },
      }))

      const menu = menuResult.Items?.[0]
      if (!menu) {
        return response(404, {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Menu not found' },
        })
      }

      // Update the item
      const updatedItems = menu.items.map((item: any) => {
        if (item.itemId === itemId) {
          return {
            ...item,
            isAvailable: isAvailable ?? item.isAvailable,
            remainingQuantity: remainingQuantity ?? item.remainingQuantity,
          }
        }
        return item
      })

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: menu.PK,
          SK: menu.SK,
        },
        UpdateExpression: 'SET items = :items, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':items': updatedItems,
          ':updatedAt': new Date().toISOString(),
        },
      }))

      return response(200, {
        success: true,
        data: { message: 'Item availability updated' },
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
