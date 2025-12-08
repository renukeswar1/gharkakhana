import { z } from 'zod'

// Common validation schemas
export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number')
export const emailSchema = z.string().email('Invalid email address')
export const pincodeSchema = z.string().regex(/^\d{6}$/, 'Invalid PIN code')
export const aadhaarSchema = z.string().regex(/^\d{12}$/, 'Invalid Aadhaar number')
export const panSchema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number')

// Address Schema
export const addressSchema = z.object({
  line1: z.string().min(5, 'Address is too short'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: pincodeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

// User Registration Schema
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  email: emailSchema,
  phone: phoneSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Chef Registration Schema
export const chefRegistrationSchema = z.object({
  businessName: z.string().min(3, 'Business name is too short').max(100),
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).optional(),
  cuisines: z.array(z.string()).min(1, 'Select at least one cuisine'),
  address: addressSchema,
  serviceRadius: z.number().min(1).max(20),
  workingHours: z.record(z.object({
    open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })).optional(),
})

// Menu Item Schema
export const menuItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(1).max(10000),
  image: z.string().url().optional(),
  isVegetarian: z.boolean().default(true),
  isVegan: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  servingSize: z.string().min(1),
  preparationTime: z.number().min(5).max(180),
  category: z.string().min(1),
  maxQuantity: z.number().min(1).max(100).default(10),
})

// Daily Menu Schema
export const dailyMenuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'ALL_DAY']),
  items: z.array(menuItemSchema).min(1),
  orderDeadline: z.string().optional(),
  notes: z.string().max(500).optional(),
})

// Order Schema
export const createOrderSchema = z.object({
  chefId: z.string().uuid(),
  menuId: z.string().uuid(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().min(1).max(10),
    notes: z.string().max(200).optional(),
  })).min(1),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  deliveryAddress: addressSchema.optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'WALLET', 'COD']),
  specialInstructions: z.string().max(500).optional(),
})

// Review Schema
export const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  foodRating: z.number().min(1).max(5),
  hygieneRating: z.number().min(1).max(5),
  packagingRating: z.number().min(1).max(5),
  deliveryRating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
})

// Search Schema
export const searchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(50).default(5),
  query: z.string().max(100).optional(),
  cuisines: z.array(z.string()).optional(),
  isVegetarian: z.boolean().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().max(10000).optional(),
  sortBy: z.enum(['distance', 'rating', 'price_asc', 'price_desc']).default('distance'),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(20),
})

// Export types
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type ChefRegistrationInput = z.infer<typeof chefRegistrationSchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type DailyMenuInput = z.infer<typeof dailyMenuSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type SearchInput = z.infer<typeof searchSchema>
