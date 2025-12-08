import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Client } from '@opensearch-project/opensearch'
import ngeohash from 'ngeohash'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const TABLE_NAME = process.env.TABLE_NAME!
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT!

// OpenSearch client
const osClient = new Client({
  node: `https://${OPENSEARCH_ENDPOINT}`,
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

// Get neighboring geohashes for radius search
const getNeighborGeohashes = (lat: number, lng: number, precision: number = 5): string[] => {
  const centerHash = ngeohash.encode(lat, lng, precision)
  const neighbors = ngeohash.neighbors(centerHash)
  return [centerHash, ...Object.values(neighbors)]
}

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path
  const method = event.httpMethod
  const queryParams = event.queryStringParameters || {}

  try {
    // GET /search/chefs - Search for nearby chefs
    if (path === '/search/chefs' && method === 'GET') {
      const lat = parseFloat(queryParams.lat || '0')
      const lng = parseFloat(queryParams.lng || '0')
      const radius = parseFloat(queryParams.radius || '5')
      const cuisine = queryParams.cuisine
      const isVeg = queryParams.isVeg === 'true'
      const minRating = parseFloat(queryParams.rating || '0')
      const sortBy = queryParams.sortBy || 'distance'

      if (!lat || !lng) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' },
        })
      }

      // Get geohashes for the search area
      const geohashes = getNeighborGeohashes(lat, lng, 5)
      
      // Query all relevant geohashes
      const chefPromises = geohashes.map(hash =>
        docClient.send(new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          FilterExpression: 'entityType = :type AND isAvailable = :available',
          ExpressionAttributeValues: {
            ':pk': `GEO#${hash}`,
            ':type': 'CHEF',
            ':available': true,
          },
        }))
      )

      const results = await Promise.all(chefPromises)
      let chefs = results.flatMap(r => r.Items || [])

      // Calculate distance and filter by radius
      chefs = chefs.map(chef => ({
        ...chef,
        distance: calculateDistance(lat, lng, chef.address.latitude, chef.address.longitude),
      })).filter(chef => chef.distance <= radius)

      // Apply filters
      if (cuisine) {
        chefs = chefs.filter(chef => 
          chef.cuisines.some((c: string) => c.toLowerCase().includes(cuisine.toLowerCase()))
        )
      }
      if (minRating > 0) {
        chefs = chefs.filter(chef => chef.rating >= minRating)
      }

      // Sort
      switch (sortBy) {
        case 'rating':
          chefs.sort((a, b) => b.rating - a.rating)
          break
        case 'orders':
          chefs.sort((a, b) => b.totalOrders - a.totalOrders)
          break
        case 'distance':
        default:
          chefs.sort((a, b) => a.distance - b.distance)
      }

      // Format response
      const formattedChefs = chefs.map(chef => ({
        chefId: chef.chefId,
        businessName: chef.businessName,
        profileImage: chef.profileImage,
        rating: chef.rating,
        totalReviews: chef.totalReviews,
        distance: Math.round(chef.distance * 10) / 10,
        cuisines: chef.cuisines,
        isAvailable: chef.isAvailable,
        minimumOrderAmount: chef.minimumOrderAmount || 0,
      }))

      return response(200, {
        success: true,
        data: {
          chefs: formattedChefs,
          total: formattedChefs.length,
          hasMore: false,
        },
      })
    }

    // GET /search/menus - Search for dishes
    if (path === '/search/menus' && method === 'GET') {
      const q = queryParams.q || ''
      const lat = parseFloat(queryParams.lat || '0')
      const lng = parseFloat(queryParams.lng || '0')
      const radius = parseFloat(queryParams.radius || '5')
      const date = queryParams.date || new Date().toISOString().split('T')[0]
      const isVeg = queryParams.isVeg === 'true'
      const maxPrice = parseFloat(queryParams.maxPrice || '10000')

      if (!lat || !lng) {
        return response(400, {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' },
        })
      }

      // Use OpenSearch for full-text search
      try {
        const searchResponse = await osClient.search({
          index: 'menus',
          body: {
            query: {
              bool: {
                must: q ? [
                  {
                    nested: {
                      path: 'items',
                      query: {
                        match: { 'items.name': q },
                      },
                    },
                  },
                ] : [],
                filter: [
                  { term: { date } },
                  {
                    geo_distance: {
                      distance: `${radius}km`,
                      location: { lat, lon: lng },
                    },
                  },
                ],
              },
            },
            size: 50,
          },
        })

        const hits = searchResponse.body.hits.hits || []
        const items = hits.flatMap((hit: any) => {
          const menu = hit._source
          return menu.items
            .filter((item: any) => {
              if (isVeg && !item.isVeg) return false
              if (item.price > maxPrice) return false
              if (!item.isAvailable) return false
              if (q && !item.name.toLowerCase().includes(q.toLowerCase())) return false
              return true
            })
            .map((item: any) => ({
              menuId: menu.menuId,
              itemId: item.itemId,
              name: item.name,
              description: item.description,
              price: item.discountedPrice || item.price,
              originalPrice: item.discountedPrice ? item.price : undefined,
              image: item.images?.[0],
              isVeg: item.isVeg,
              chef: {
                chefId: menu.chefId,
                businessName: menu.chefName,
                rating: menu.chefRating,
                distance: calculateDistance(lat, lng, menu.location.lat, menu.location.lon),
              },
              remainingQuantity: item.remainingQuantity,
              availableTill: item.availableTill,
            }))
        })

        return response(200, {
          success: true,
          data: {
            items,
            total: items.length,
            hasMore: false,
          },
        })
      } catch (osError) {
        console.error('OpenSearch error:', osError)
        // Fallback to DynamoDB search
        return response(200, {
          success: true,
          data: {
            items: [],
            total: 0,
            hasMore: false,
          },
        })
      }
    }

    // GET /search/suggestions - Search suggestions
    if (path === '/search/suggestions' && method === 'GET') {
      const q = (queryParams.q || '').toLowerCase()

      // Popular dishes and cuisines
      const popularDishes = [
        'Biryani', 'Dal', 'Paneer', 'Roti', 'Rice', 'Curry', 'Thali',
        'Paratha', 'Chole', 'Sambar', 'Dosa', 'Idli', 'Rajma',
      ]
      const popularCuisines = [
        'North Indian', 'South Indian', 'Gujarati', 'Bengali',
        'Punjabi', 'Hyderabadi', 'Maharashtrian', 'Rajasthani',
      ]

      const matchingDishes = popularDishes.filter(d => 
        d.toLowerCase().includes(q)
      ).slice(0, 5)

      const matchingCuisines = popularCuisines.filter(c => 
        c.toLowerCase().includes(q)
      ).slice(0, 3)

      return response(200, {
        success: true,
        data: {
          dishes: matchingDishes,
          cuisines: matchingCuisines,
          chefs: [], // Would query from DB
        },
      })
    }

    return response(404, {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    })
  } catch (error: any) {
    console.error('Error:', error)
    return response(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' },
    })
  }
}
