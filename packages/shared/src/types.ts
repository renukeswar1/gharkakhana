// User Types
export type UserRole = 'CUSTOMER' | 'CHEF' | 'ADMIN'

export interface User {
  id: string
  email: string
  phone: string
  name: string
  role: UserRole
  profileImage?: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  chefId?: string
  createdAt: string
  updatedAt: string
}

// Chef Types
export type ChefStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
export type VerificationStatus = 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED'

export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  geohash?: string
}

export interface WorkingHours {
  open: string
  close: string
}

export interface Chef {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  businessName: string
  bio?: string
  profileImage?: string
  coverImage?: string
  cuisines: string[]
  specialties: string[]
  address: Address
  serviceRadius: number
  rating: number
  totalReviews: number
  totalOrders: number
  status: ChefStatus
  verificationStatus: VerificationStatus
  isAvailable: boolean
  workingHours: Record<string, WorkingHours>
  createdAt: string
  updatedAt: string
}

// Menu Types
export type MenuStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' | 'ALL_DAY'

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  isVegetarian: boolean
  isVegan: boolean
  isSpicy: boolean
  allergens: string[]
  servingSize: string
  preparationTime: number
  category: string
  isAvailable: boolean
  maxQuantity: number
}

export interface DailyMenu {
  id: string
  chefId: string
  date: string
  mealType: MealType
  items: MenuItem[]
  status: MenuStatus
  orderDeadline?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Order Types
export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'UPI' | 'CARD' | 'WALLET' | 'COD'
export type DeliveryType = 'DELIVERY' | 'PICKUP'

export interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
  notes?: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  chefId: string
  chefName: string
  menuId: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  packagingFee: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  deliveryType: DeliveryType
  deliveryAddress?: Address
  specialInstructions?: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  steelBoxReturned: boolean
  steelBoxReturnedAt?: string
  createdAt: string
  updatedAt: string
}

// Review Types
export interface Review {
  id: string
  orderId: string
  customerId: string
  customerName: string
  chefId: string
  rating: number
  foodRating: number
  hygieneRating: number
  packagingRating: number
  deliveryRating: number
  title?: string
  comment?: string
  images: string[]
  itemsOrdered: string[]
  isVerifiedPurchase: boolean
  helpfulCount: number
  chefResponse?: {
    comment: string
    respondedAt: string
  }
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  nextCursor?: string
}

// Search Types
export interface ChefSearchResult {
  id: string
  name: string
  businessName: string
  profileImage?: string
  cuisines: string[]
  rating: number
  totalReviews: number
  distance: number
  isAvailable: boolean
  priceRange: {
    min: number
    max: number
  }
}

export interface MenuSearchResult {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  isVegetarian: boolean
  chef: {
    id: string
    name: string
    businessName: string
    rating: number
  }
  distance: number
}

// Verification Types
export type DocumentType = 'AADHAAR' | 'PAN' | 'FSSAI' | 'KITCHEN_PHOTO' | 'COOKING_VIDEO'
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface VerificationDocument {
  type: DocumentType
  url: string
  status: DocumentStatus
  uploadedAt: string
  reviewedAt?: string
  reviewNotes?: string
}

export interface ChefVerification {
  chefId: string
  documents: VerificationDocument[]
  overallStatus: VerificationStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  updatedAt: string
}
