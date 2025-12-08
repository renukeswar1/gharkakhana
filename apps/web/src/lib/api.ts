import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useStore } from '@/store/useStore'
import type { ApiResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add location if available
    const location = useStore.getState().location
    if (location) {
      config.headers['X-User-Location'] = JSON.stringify({
        lat: location.latitude,
        lng: location.longitude,
      })
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<never>>) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      useStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Generic request wrapper
export async function request<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api.request<ApiResponse<T>>(config)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data || {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection.',
          },
        }
      )
    }
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
      },
    }
  }
}

// API methods
export const authApi = {
  register: (data: {
    email: string
    phone: string
    password: string
    name: string
    role: 'CUSTOMER' | 'CHEF'
  }) => request({ method: 'POST', url: '/auth/register', data }),

  login: (data: { email: string; password: string }) =>
    request({ method: 'POST', url: '/auth/login', data }),

  verifyOtp: (data: { phone: string; otp: string }) =>
    request({ method: 'POST', url: '/auth/verify-otp', data }),

  forgotPassword: (data: { email: string }) =>
    request({ method: 'POST', url: '/auth/forgot-password', data }),

  resetPassword: (data: { token: string; password: string }) =>
    request({ method: 'POST', url: '/auth/reset-password', data }),
}

export const userApi = {
  getProfile: () => request({ method: 'GET', url: '/users/me' }),

  updateProfile: (data: Partial<{ name: string; phone: string; profileImage: string }>) =>
    request({ method: 'PUT', url: '/users/me', data }),

  addAddress: (data: {
    label: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    latitude: number
    longitude: number
    isDefault?: boolean
  }) => request({ method: 'POST', url: '/users/me/addresses', data }),

  updateAddress: (addressId: string, data: any) =>
    request({ method: 'PUT', url: `/users/me/addresses/${addressId}`, data }),

  deleteAddress: (addressId: string) =>
    request({ method: 'DELETE', url: `/users/me/addresses/${addressId}` }),
}

export const chefApi = {
  register: (data: any) => request({ method: 'POST', url: '/chefs/register', data }),

  getProfile: () => request({ method: 'GET', url: '/chefs/me' }),

  updateProfile: (data: any) => request({ method: 'PUT', url: '/chefs/me', data }),

  submitVerification: (data: FormData) =>
    request({
      method: 'POST',
      url: '/chefs/me/verification',
      data,
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getVerificationStatus: () =>
    request({ method: 'GET', url: '/chefs/me/verification' }),

  updateAvailability: (data: { isAvailable: boolean; workingHours?: any }) =>
    request({ method: 'PUT', url: '/chefs/me/availability', data }),

  getPublicProfile: (chefId: string) =>
    request({ method: 'GET', url: `/chefs/${chefId}` }),

  getChefMenus: (chefId: string, params?: { date?: string; mealType?: string }) =>
    request({ method: 'GET', url: `/chefs/${chefId}/menus`, params }),

  getChefReviews: (chefId: string, params?: { limit?: number; lastKey?: string }) =>
    request({ method: 'GET', url: `/chefs/${chefId}/reviews`, params }),
}

export const menuApi = {
  create: (data: any) => request({ method: 'POST', url: '/menus', data }),

  get: (menuId: string) => request({ method: 'GET', url: `/menus/${menuId}` }),

  update: (menuId: string, data: any) =>
    request({ method: 'PUT', url: `/menus/${menuId}`, data }),

  delete: (menuId: string) =>
    request({ method: 'DELETE', url: `/menus/${menuId}` }),

  updateItemAvailability: (
    menuId: string,
    itemId: string,
    data: { isAvailable: boolean; remainingQuantity?: number }
  ) =>
    request({
      method: 'PUT',
      url: `/menus/${menuId}/items/${itemId}/availability`,
      data,
    }),

  getMyMenus: (params?: { startDate?: string; endDate?: string; status?: string }) =>
    request({ method: 'GET', url: '/menus/my', params }),
}

export const searchApi = {
  searchChefs: (params: {
    lat: number
    lng: number
    radius?: number
    cuisine?: string
    isVeg?: boolean
    rating?: number
    sortBy?: string
  }) => request({ method: 'GET', url: '/search/chefs', params }),

  searchMenus: (params: {
    q?: string
    lat: number
    lng: number
    radius?: number
    date?: string
    mealType?: string
    isVeg?: boolean
    maxPrice?: number
    sortBy?: string
  }) => request({ method: 'GET', url: '/search/menus', params }),

  getSuggestions: (q: string) =>
    request({ method: 'GET', url: '/search/suggestions', params: { q } }),
}

export const orderApi = {
  create: (data: {
    menuId: string
    items: { itemId: string; quantity: number }[]
    deliveryAddressId: string
    deliverySlot: { date: string; startTime: string; endTime: string }
    specialInstructions?: string
    paymentMethod: string
  }) => request({ method: 'POST', url: '/orders', data }),

  confirmPayment: (
    orderId: string,
    data: {
      razorpayPaymentId: string
      razorpayOrderId: string
      razorpaySignature: string
    }
  ) => request({ method: 'POST', url: `/orders/${orderId}/confirm-payment`, data }),

  getOrders: (params?: {
    status?: string
    startDate?: string
    endDate?: string
    limit?: number
    lastKey?: string
  }) => request({ method: 'GET', url: '/orders', params }),

  getOrder: (orderId: string) =>
    request({ method: 'GET', url: `/orders/${orderId}` }),

  updateStatus: (orderId: string, data: { status: string }) =>
    request({ method: 'PUT', url: `/orders/${orderId}/status`, data }),

  cancel: (orderId: string, data: { reason: string }) =>
    request({ method: 'POST', url: `/orders/${orderId}/cancel`, data }),

  markSteelBoxReturned: (orderId: string) =>
    request({ method: 'POST', url: `/orders/${orderId}/steel-box-return` }),
}

export const reviewApi = {
  create: (data: {
    orderId: string
    rating: number
    foodRating: number
    hygieneRating: number
    packagingRating: number
    deliveryRating: number
    title?: string
    comment?: string
    images?: string[]
  }) => request({ method: 'POST', url: '/reviews', data }),

  get: (reviewId: string) => request({ method: 'GET', url: `/reviews/${reviewId}` }),

  update: (reviewId: string, data: any) =>
    request({ method: 'PUT', url: `/reviews/${reviewId}`, data }),

  delete: (reviewId: string) =>
    request({ method: 'DELETE', url: `/reviews/${reviewId}` }),

  respond: (reviewId: string, data: { comment: string }) =>
    request({ method: 'POST', url: `/reviews/${reviewId}/response`, data }),

  markHelpful: (reviewId: string) =>
    request({ method: 'POST', url: `/reviews/${reviewId}/helpful` }),
}

export const uploadApi = {
  getPresignedUrl: (data: {
    fileType: string
    purpose: 'PROFILE_IMAGE' | 'MENU_IMAGE' | 'REVIEW_IMAGE' | 'VERIFICATION_DOC'
  }) => request({ method: 'POST', url: '/uploads/presigned-url', data }),
}
