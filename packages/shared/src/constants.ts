// Cuisines available on the platform
export const CUISINES = [
  'North Indian',
  'South Indian',
  'Bengali',
  'Gujarati',
  'Maharashtrian',
  'Punjabi',
  'Rajasthani',
  'Hyderabadi',
  'Kerala',
  'Tamil',
  'Mughlai',
  'Street Food',
  'Continental',
  'Chinese',
  'Healthy/Diet',
  'Jain',
  'Vegan',
] as const

// Food categories
export const MENU_CATEGORIES = [
  'Main Course',
  'Rice & Breads',
  'Starters',
  'Salads',
  'Soups',
  'Desserts',
  'Beverages',
  'Accompaniments',
  'Thalis',
  'Combos',
] as const

// Common allergens
export const ALLERGENS = [
  'Dairy',
  'Eggs',
  'Gluten',
  'Nuts',
  'Peanuts',
  'Soy',
  'Shellfish',
  'Fish',
  'Sesame',
] as const

// Order status flow
export const ORDER_STATUS_FLOW = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED'], // DELIVERED for pickup orders
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
} as const

// Fees and charges
export const FEES = {
  DELIVERY_FEE: 30,
  STEEL_BOX_DEPOSIT: 20,
  PLATFORM_COMMISSION_PERCENT: 10,
  MIN_ORDER_AMOUNT: 100,
} as const

// Timing constants
export const TIMING = {
  ORDER_CANCELLATION_WINDOW_MINS: 5,
  STEEL_BOX_RETURN_DAYS: 2,
  MENU_ADVANCE_PUBLISH_DAYS: 7,
  VERIFICATION_SLA_HOURS: 48,
} as const

// Geohash precision
// Precision 5 = ~4.89km x 4.89km
// Precision 6 = ~1.22km x 0.61km
export const GEOHASH_PRECISION = 5

// Indian states for address validation
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
] as const

// Error codes
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_UNAUTHORIZED: 'AUTH_003',
  
  // Validation errors
  VALIDATION_ERROR: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  
  // Resource errors
  NOT_FOUND: 'RES_001',
  ALREADY_EXISTS: 'RES_002',
  
  // Business logic errors
  ORDER_ALREADY_CANCELLED: 'BUS_001',
  CANCELLATION_WINDOW_EXPIRED: 'BUS_002',
  CHEF_NOT_AVAILABLE: 'BUS_003',
  ITEM_NOT_AVAILABLE: 'BUS_004',
  MINIMUM_ORDER_NOT_MET: 'BUS_005',
  
  // System errors
  INTERNAL_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
} as const
