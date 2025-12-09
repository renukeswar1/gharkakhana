/**
 * Local Development Server for GharKaKhana
 * This runs Express.js locally to simulate AWS Lambda + API Gateway
 */

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import ngeohash from 'ngeohash'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = process.env.PORT || 3001

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'gharkakhana-super-secret-key-change-in-production'
const JWT_EXPIRY = '7d'

// Local JSON database file path
const DB_PATH = path.join(__dirname, '../../data/db.json')

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize database
interface Database {
  users: Record<string, any>
  chefs: Record<string, any>
  menus: Record<string, any>
  orders: Record<string, any>
  reviews: Record<string, any>
}

const initDB = (): Database => {
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  }
  const emptyDB: Database = {
    users: {},
    chefs: {},
    menus: {},
    orders: {},
    reviews: {}
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB, null, 2))
  return emptyDB
}

let db = initDB()

const saveDB = () => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// Middleware
app.use(cors())
app.use(express.json())

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Auth middleware
interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
    })
  }
}

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      req.user = decoded
    } catch (error) {
      // Ignore invalid token for optional auth
    }
  }
  next()
}

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, phone, password, name, role = 'CUSTOMER' } = req.body

    // Validation
    if (!email || !phone || !password || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All fields are required' }
      })
    }

    // Check if user already exists
    const existingUser = Object.values(db.users).find((u: any) => u.email === email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User with this email already exists' }
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const userId = uuidv4()
    const user = {
      userId,
      email,
      phone,
      name,
      role,
      password: hashedPassword,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true, // Auto-verify for local dev
    }

    db.users[userId] = user
    saveDB()

    // Generate token
    const token = jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    )

    res.status(201).json({
      success: true,
      data: {
        userId,
        email,
        name,
        role,
        token,
        message: 'Registration successful'
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    })
  }
})

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, emailOrPhone, password } = req.body
    const loginId = emailOrPhone || email // Support both field names

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email/Phone and password are required' }
      })
    }

    // Find user by email OR phone
    const user = Object.values(db.users).find((u: any) => 
      u.email === loginId || 
      u.phone === loginId || 
      u.phone === `+91${loginId}` ||
      u.phone?.replace('+91', '') === loginId
    ) as any
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' }
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' }
      })
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    )

    // Check if user is a chef
    const chef = Object.values(db.chefs).find((c: any) => c.userId === user.userId) as any

    res.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
        chef: chef ? {
          chefId: chef.chefId,
          businessName: chef.businessName,
          status: chef.status
        } : null
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    })
  }
})

// Get current user profile
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.users[req.user!.userId]
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    })
  }

  const { password, ...userWithoutPassword } = user
  
  // Check if user is a chef
  const chef = Object.values(db.chefs).find((c: any) => c.userId === user.userId) as any

  res.json({
    success: true,
    data: {
      ...userWithoutPassword,
      chef: chef ? {
        chefId: chef.chefId,
        businessName: chef.businessName,
        status: chef.status
      } : null
    }
  })
})

// ==================== CHEF ROUTES ====================

// Register as chef
app.post('/api/chefs/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
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
    } = req.body

    // Validation
    if (!businessName || !cuisines || cuisines.length === 0 || !address) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Business name, cuisines, and address are required' }
      })
    }

    // Check if already registered as chef
    const existingChef = Object.values(db.chefs).find((c: any) => c.userId === userId)
    if (existingChef) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CHEF', message: 'You are already registered as a chef' }
      })
    }

    // Get user
    const user = db.users[userId]
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      })
    }

    // Generate geohash from coordinates
    let geohash = ''
    if (address.latitude && address.longitude) {
      geohash = ngeohash.encode(address.latitude, address.longitude, 7)
    }

    const chefId = uuidv4()
    const chef = {
      chefId,
      userId,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.chefs[chefId] = chef
    
    // Update user role
    db.users[userId].role = 'CHEF'
    
    saveDB()

    res.status(201).json({
      success: true,
      data: {
        chefId,
        businessName,
        status: 'PENDING',
        message: 'Chef registration submitted. Please wait for approval.'
      }
    })
  } catch (error: any) {
    console.error('Chef registration error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    })
  }
})

// Get chef profile
app.get('/api/chefs/:chefId', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  const { chefId } = req.params
  const chef = db.chefs[chefId]

  if (!chef) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chef not found' }
    })
  }

  // Get chef's menu items
  const menuItems = Object.values(db.menus).filter((m: any) => m.chefId === chefId)

  // Don't expose sensitive verification data
  const { verification, ...chefData } = chef

  res.json({
    success: true,
    data: {
      ...chefData,
      isVerified: verification?.isVerified || false,
      menuItems
    }
  })
})

// Get my chef profile (for logged in chefs)
app.get('/api/chefs/me/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const chef = Object.values(db.chefs).find((c: any) => c.userId === userId) as any

  if (!chef) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chef profile not found' }
    })
  }

  // Get chef's menu items
  const menuItems = Object.values(db.menus).filter((m: any) => m.chefId === chef.chefId)

  // Get recent orders
  const recentOrders = Object.values(db.orders)
    .filter((o: any) => o.chefId === chef.chefId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  res.json({
    success: true,
    data: {
      ...chef,
      menuItems,
      recentOrders
    }
  })
})

// Update chef availability
app.patch('/api/chefs/me/availability', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const { isAvailable } = req.body

  const chef = Object.values(db.chefs).find((c: any) => c.userId === userId) as any
  if (!chef) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chef profile not found' }
    })
  }

  db.chefs[chef.chefId].isAvailable = isAvailable
  db.chefs[chef.chefId].updatedAt = new Date().toISOString()
  saveDB()

  res.json({
    success: true,
    data: { isAvailable }
  })
})

// Search chefs by location
app.get('/api/chefs/search', (req: Request, res: Response) => {
  const { lat, lng, radius = 10, cuisine } = req.query

  let chefs = Object.values(db.chefs).filter((c: any) => 
    c.status === 'APPROVED' && c.isAvailable
  )

  // Filter by cuisine if provided
  if (cuisine) {
    chefs = chefs.filter((c: any) => 
      c.cuisines.some((cuis: string) => 
        cuis.toLowerCase().includes((cuisine as string).toLowerCase())
      )
    )
  }

  // If coordinates provided, calculate distance and filter
  if (lat && lng) {
    const userLat = parseFloat(lat as string)
    const userLng = parseFloat(lng as string)
    const maxRadius = parseFloat(radius as string)

    chefs = chefs
      .map((chef: any) => {
        if (chef.address?.latitude && chef.address?.longitude) {
          const distance = calculateDistance(
            userLat, userLng,
            chef.address.latitude, chef.address.longitude
          )
          return { ...chef, distance }
        }
        return { ...chef, distance: 999 }
      })
      .filter((chef: any) => chef.distance <= Math.min(maxRadius, chef.serviceRadius))
      .sort((a: any, b: any) => a.distance - b.distance)
  }

  // Remove sensitive data
  const sanitizedChefs = chefs.map((chef: any) => {
    const { verification, ...chefData } = chef
    return {
      ...chefData,
      isVerified: verification?.isVerified || false
    }
  })

  res.json({
    success: true,
    data: sanitizedChefs
  })
})

// ==================== MENU ROUTES ====================

// Add menu item
app.post('/api/menus', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const chef = Object.values(db.chefs).find((c: any) => c.userId === userId) as any

  if (!chef) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only chefs can add menu items' }
    })
  }

  const {
    name,
    description,
    price,
    category,
    isVeg,
    isAvailable = true,
    preparationTime,
    servingSize,
    ingredients,
    allergens,
    images
  } = req.body

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, price, and category are required' }
    })
  }

  const menuId = uuidv4()
  const menuItem = {
    menuId,
    chefId: chef.chefId,
    name,
    description: description || '',
    price,
    category,
    isVeg: isVeg ?? true,
    isAvailable,
    preparationTime: preparationTime || 30,
    servingSize: servingSize || '1 person',
    ingredients: ingredients || [],
    allergens: allergens || [],
    images: images || [],
    rating: 0,
    totalOrders: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  db.menus[menuId] = menuItem
  saveDB()

  res.status(201).json({
    success: true,
    data: menuItem
  })
})

// Get chef's menu
app.get('/api/menus/chef/:chefId', (req: Request, res: Response) => {
  const { chefId } = req.params
  const menuItems = Object.values(db.menus).filter((m: any) => m.chefId === chefId)

  res.json({
    success: true,
    data: menuItems
  })
})

// Update menu item
app.put('/api/menus/:menuId', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const { menuId } = req.params
  const menuItem = db.menus[menuId]

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Menu item not found' }
    })
  }

  const chef = Object.values(db.chefs).find((c: any) => c.userId === userId) as any
  if (!chef || chef.chefId !== menuItem.chefId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only update your own menu items' }
    })
  }

  const updates = req.body
  db.menus[menuId] = {
    ...menuItem,
    ...updates,
    menuId, // Ensure ID doesn't change
    chefId: menuItem.chefId, // Ensure chef doesn't change
    updatedAt: new Date().toISOString()
  }
  saveDB()

  res.json({
    success: true,
    data: db.menus[menuId]
  })
})

// Delete menu item
app.delete('/api/menus/:menuId', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const { menuId } = req.params
  const menuItem = db.menus[menuId]

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Menu item not found' }
    })
  }

  const chef = Object.values(db.chefs).find((c: any) => c.userId === userId) as any
  if (!chef || chef.chefId !== menuItem.chefId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only delete your own menu items' }
    })
  }

  delete db.menus[menuId]
  saveDB()

  res.json({
    success: true,
    data: { message: 'Menu item deleted' }
  })
})

// ==================== ORDER ROUTES ====================

// Create order
app.post('/api/orders', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const {
    chefId,
    items,
    deliveryAddress,
    packagingType = 'DISPOSABLE',
    notes
  } = req.body

  if (!chefId || !items || items.length === 0 || !deliveryAddress) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Chef, items, and delivery address are required' }
    })
  }

  const chef = db.chefs[chefId]
  if (!chef) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chef not found' }
    })
  }

  // Calculate totals
  let subtotal = 0
  const orderItems = items.map((item: any) => {
    const menuItem = db.menus[item.menuId]
    if (!menuItem) {
      throw new Error(`Menu item ${item.menuId} not found`)
    }
    const itemTotal = menuItem.price * item.quantity
    subtotal += itemTotal
    return {
      menuId: item.menuId,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
      total: itemTotal
    }
  })

  const packagingFee = packagingType === 'STEEL_BOX' ? 50 : 0
  const deliveryFee = 30 // Fixed delivery fee for now
  const total = subtotal + packagingFee + deliveryFee

  const orderId = uuidv4()
  const order = {
    orderId,
    userId,
    chefId,
    items: orderItems,
    subtotal,
    packagingType,
    packagingFee,
    deliveryFee,
    total,
    deliveryAddress,
    notes: notes || '',
    status: 'PENDING', // PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  db.orders[orderId] = order
  saveDB()

  res.status(201).json({
    success: true,
    data: order
  })
})

// Get user orders
app.get('/api/orders/my-orders', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const orders = Object.values(db.orders)
    .filter((o: any) => o.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({
    success: true,
    data: orders
  })
})

// Get chef orders
app.get('/api/orders/chef-orders', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const chef = Object.values(db.chefs).find((c: any) => c.userId === userId) as any

  if (!chef) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only chefs can access this' }
    })
  }

  const orders = Object.values(db.orders)
    .filter((o: any) => o.chefId === chef.chefId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({
    success: true,
    data: orders
  })
})

// Update order status (by chef)
app.patch('/api/orders/:orderId/status', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const { orderId } = req.params
  const { status } = req.body

  const order = db.orders[orderId]
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Order not found' }
    })
  }

  const chef = Object.values(db.chefs).find((c: any) => c.userId === userId) as any
  if (!chef || chef.chefId !== order.chefId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only update your own orders' }
    })
  }

  db.orders[orderId].status = status
  db.orders[orderId].updatedAt = new Date().toISOString()
  saveDB()

  res.json({
    success: true,
    data: db.orders[orderId]
  })
})

// ==================== UTILITY FUNCTIONS ====================

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI/180)
}

// ==================== ADMIN ROUTES (for testing) ====================

// Approve chef (admin only - for testing)
app.post('/api/admin/chefs/:chefId/approve', (req: Request, res: Response) => {
  const { chefId } = req.params
  const chef = db.chefs[chefId]

  if (!chef) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chef not found' }
    })
  }

  db.chefs[chefId].status = 'APPROVED'
  db.chefs[chefId].isAvailable = true
  db.chefs[chefId].verification.isVerified = true
  db.chefs[chefId].updatedAt = new Date().toISOString()
  saveDB()

  res.json({
    success: true,
    data: { message: 'Chef approved', chefId }
  })
})

// List all chefs (admin)
app.get('/api/admin/chefs', (req: Request, res: Response) => {
  const chefs = Object.values(db.chefs)
  res.json({
    success: true,
    data: chefs
  })
})

// ==================== GEOCODING ROUTES ====================

// Reverse geocode (get address from coordinates)
app.get('/api/geocode/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = req.query
  
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Latitude and longitude are required' }
    })
  }

  // For local development, return mock data
  // In production, integrate with Google Maps or similar API
  const geohash = ngeohash.encode(parseFloat(lat as string), parseFloat(lng as string), 7)
  
  res.json({
    success: true,
    data: {
      latitude: parseFloat(lat as string),
      longitude: parseFloat(lng as string),
      geohash,
      formattedAddress: `Location at ${lat}, ${lng}`,
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      area: 'Central'
    }
  })
})

// ==================== SERVER START ====================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🍲 GharKaKhana Local API Server                       ║
║                                                           ║
║     Server running at: http://localhost:${PORT}             ║
║                                                           ║
║     Available endpoints:                                  ║
║     - POST /api/auth/register                             ║
║     - POST /api/auth/login                                ║
║     - GET  /api/auth/me                                   ║
║     - POST /api/chefs/register                            ║
║     - GET  /api/chefs/:chefId                             ║
║     - GET  /api/chefs/search                              ║
║     - POST /api/menus                                     ║
║     - GET  /api/menus/chef/:chefId                        ║
║     - POST /api/orders                                    ║
║     - GET  /api/orders/my-orders                          ║
║     - POST /api/admin/chefs/:chefId/approve (testing)     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `)
})

export default app
