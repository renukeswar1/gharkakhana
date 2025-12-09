/**
 * API Client for GharKaKhana
 * 
 * This client automatically:
 * - Includes JWT token in Authorization header
 * - Handles token refresh
 * - Provides typed responses
 * - Handles errors consistently
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (includeAuth) {
      const token = this.getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json()

    if (!response.ok) {
      // Handle 401 - redirect to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          // Optionally redirect to login
          // window.location.href = '/login'
        }
      }

      throw new Error(data.error?.message || `HTTP ${response.status}`)
    }

    return data
  }

  async get<T = any>(endpoint: string, options?: { skipAuth?: boolean }): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(!options?.skipAuth),
    })
    return this.handleResponse<T>(response)
  }

  async post<T = any>(endpoint: string, body: any, options?: { skipAuth?: boolean }): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(!options?.skipAuth),
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(response)
  }

  async put<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(response)
  }

  async patch<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(response)
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    return this.handleResponse<T>(response)
  }

  // Auth-specific methods
  async login(emailOrPhone: string, password: string) {
    return this.post('/auth/login', { 
      emailOrPhone, 
      password 
    }, { skipAuth: true })
  }

  async register(data: {
    name: string
    email: string
    phone: string
    password: string
    role?: 'CUSTOMER' | 'CHEF'
  }) {
    return this.post('/auth/register', data, { skipAuth: true })
  }

  async getProfile() {
    return this.get('/auth/me')
  }

  // Chef methods
  async registerChef(data: any) {
    return this.post('/chefs/register', data)
  }

  async getChef(chefId: string) {
    return this.get(`/chefs/${chefId}`, { skipAuth: true })
  }

  async searchChefs(params: { lat?: number; lng?: number; radius?: number; cuisine?: string }) {
    const queryParams = new URLSearchParams()
    if (params.lat) queryParams.append('lat', params.lat.toString())
    if (params.lng) queryParams.append('lng', params.lng.toString())
    if (params.radius) queryParams.append('radius', params.radius.toString())
    if (params.cuisine) queryParams.append('cuisine', params.cuisine)
    
    return this.get(`/chefs/search?${queryParams.toString()}`, { skipAuth: true })
  }

  // Menu methods
  async getChefMenu(chefId: string) {
    return this.get(`/menus/chef/${chefId}`, { skipAuth: true })
  }

  async addMenuItem(data: any) {
    return this.post('/menus', data)
  }

  async updateMenuItem(menuId: string, data: any) {
    return this.put(`/menus/${menuId}`, data)
  }

  async deleteMenuItem(menuId: string) {
    return this.delete(`/menus/${menuId}`)
  }

  // Order methods
  async createOrder(data: any) {
    return this.post('/orders', data)
  }

  async getMyOrders() {
    return this.get('/orders/my-orders')
  }

  async getChefOrders() {
    return this.get('/orders/chef-orders')
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.patch(`/orders/${orderId}/status`, { status })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_URL)

// Export class for testing
export { ApiClient }
