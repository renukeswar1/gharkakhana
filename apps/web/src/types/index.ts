// User Types
export interface User {
  userId: string
  email: string
  phone: string
  name: string
  profileImage?: string
  role: 'CUSTOMER' | 'CHEF' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

export interface Address {
  addressId: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  geohash: string
  isDefault: boolean
}

// Chef Types
export interface Chef {
  chefId: string
  userId: string
  email: string
  phone: string
  name: string
  businessName: string
  profileImage?: string
  coverImage?: string
  bio: string
  specialties: string[]
  cuisines: string[]
  address: {
    line1: string
    city: string
    state: string
    pincode: string
    latitude: number
    longitude: number
    geohash: string
  }
  serviceRadius: number
  rating: number
  totalReviews: number
  totalOrders: number
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  verificationStatus: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED'
  isAvailable: boolean
  workingHours: {
    [key: string]: { open: string; close: string }
  }
  createdAt: string
  updatedAt: string
}

export interface ChefVerification {
  chefId: string
  documents: {
    type: 'AADHAAR' | 'PAN' | 'FSSAI' | 'KITCHEN_PHOTOS' | 'COOKING_VIDEO'
    documentUrl: string
    status: 'PENDING' | 'VERIFIED' | 'REJECTED'
    verifiedAt?: string
  }[]
  overallStatus: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED'
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
}

// Menu Types
export interface MenuItem {
  itemId: string
  name: string
  description: string
  category: string
  cuisine: string
  price: number
  discountedPrice?: number
  quantity: number
  remainingQuantity: number
  unit: string
  servingSize: string
  isVeg: boolean
  spiceLevel: 'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy'
  allergens: string[]
  images: string[]
  preparationTime: number
  availableFrom: string
  availableTill: string
  isAvailable: boolean
}

export interface DailyMenu {
  menuId: string
  chefId: string
  date: string
  items: MenuItem[]
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS'
  orderCutoffTime: string
  deliveryStartTime: string
  deliveryEndTime: string
  packagingType: 'STEEL_BOX' | 'DISPOSABLE' | 'CUSTOMER_BOX'
  packagingDeposit: number
  minimumOrderAmount: number
  deliveryFee: number
  freeDeliveryAbove: number
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalOrders: number
  createdAt: string
  updatedAt: string
}

// Order Types
export interface OrderItem {
  itemId: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

export interface Order {
  orderId: string
  customerId: string
  customerName: string
  customerPhone: string
  chefId: string
  chefName: string
  chefPhone: string
  menuId: string
  menuDate: string
  items: OrderItem[]
  deliveryAddress: Address
  pricing: {
    subtotal: number
    packagingFee: number
    packagingDeposit: number
    deliveryFee: number
    taxes: number
    discount: number
    total: number
  }
  payment: {
    method: 'UPI' | 'CARD' | 'COD' | 'WALLET'
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
    transactionId?: string
    paidAt?: string
  }
  status: OrderStatus
  statusHistory: {
    status: OrderStatus
    timestamp: string
  }[]
  deliverySlot: {
    date: string
    startTime: string
    endTime: string
  }
  specialInstructions?: string
  packagingType: 'STEEL_BOX' | 'DISPOSABLE' | 'CUSTOMER_BOX'
  steelBoxCount?: number
  steelBoxReturned?: boolean
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 
  | 'PLACED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

// Review Types
export interface Review {
  reviewId: string
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
  images?: string[]
  itemsOrdered: string[]
  isVerifiedPurchase: boolean
  chefResponse?: {
    comment: string
    respondedAt: string
  }
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

// Search Types
export interface SearchFilters {
  lat: number
  lng: number
  radius?: number
  cuisine?: string
  isVeg?: boolean
  rating?: number
  maxPrice?: number
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS'
  sortBy?: 'distance' | 'rating' | 'price' | 'relevance'
}

export interface ChefSearchResult {
  chefId: string
  businessName: string
  profileImage?: string
  rating: number
  totalReviews: number
  distance: number
  cuisines: string[]
  isAvailable: boolean
  todaysMenuAvailable: boolean
  minimumOrderAmount: number
}

export interface MenuSearchResult {
  menuId: string
  itemId: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image?: string
  isVeg: boolean
  chef: {
    chefId: string
    businessName: string
    rating: number
    distance: number
  }
  remainingQuantity: number
  availableTill: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: { field: string; message: string }[]
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  lastKey?: string
  hasMore: boolean
}
