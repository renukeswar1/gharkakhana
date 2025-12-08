import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface User {
  userId: string
  email: string
  phone: string
  name: string
  role: 'CUSTOMER' | 'CHEF' | 'ADMIN'
  profileImage?: string
}

export interface Location {
  latitude: number
  longitude: number
  city: string
  area: string
  pincode: string
  geohash: string
}

export interface Address extends Location {
  addressId: string
  label: string
  line1: string
  line2?: string
  state: string
  isDefault: boolean
}

export interface CartItem {
  itemId: string
  menuId: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface Cart {
  chefId: string | null
  chefName: string | null
  items: CartItem[]
  packagingType: 'STEEL_BOX' | 'DISPOSABLE' | 'CUSTOMER_BOX'
  packagingDeposit: number
  deliveryFee: number
  minimumOrder: number
}

interface AppState {
  // Auth
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void

  // Location
  location: Location | null
  setLocation: (location: Location | null) => void
  addresses: Address[]
  setAddresses: (addresses: Address[]) => void
  addAddress: (address: Address) => void

  // Cart
  cart: Cart
  addToCart: (item: CartItem, chefId: string, chefName: string) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  setPackagingType: (type: Cart['packagingType']) => void

  // UI
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const initialCart: Cart = {
  chefId: null,
  chefName: null,
  items: [],
  packagingType: 'STEEL_BOX',
  packagingDeposit: 0,
  deliveryFee: 30,
  minimumOrder: 0,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, cart: initialCart }),

      // Location
      location: null,
      setLocation: (location) => set({ location }),
      addresses: [],
      setAddresses: (addresses) => set({ addresses }),
      addAddress: (address) => set((state) => ({ 
        addresses: [...state.addresses, address] 
      })),

      // Cart
      cart: initialCart,
      addToCart: (item, chefId, chefName) => {
        const { cart } = get()
        
        // If cart has items from a different chef, clear it first
        if (cart.chefId && cart.chefId !== chefId) {
          set({
            cart: {
              ...initialCart,
              chefId,
              chefName,
              items: [item],
            },
          })
          return
        }

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(
          (i) => i.itemId === item.itemId
        )

        if (existingItemIndex >= 0) {
          // Update quantity
          const newItems = [...cart.items]
          newItems[existingItemIndex].quantity += item.quantity
          set({
            cart: { ...cart, items: newItems },
          })
        } else {
          // Add new item
          set({
            cart: {
              ...cart,
              chefId,
              chefName,
              items: [...cart.items, item],
            },
          })
        }
      },
      removeFromCart: (itemId) => {
        const { cart } = get()
        const newItems = cart.items.filter((i) => i.itemId !== itemId)
        
        if (newItems.length === 0) {
          set({ cart: initialCart })
        } else {
          set({ cart: { ...cart, items: newItems } })
        }
      },
      updateQuantity: (itemId, quantity) => {
        const { cart } = get()
        
        if (quantity <= 0) {
          get().removeFromCart(itemId)
          return
        }

        const newItems = cart.items.map((item) =>
          item.itemId === itemId ? { ...item, quantity } : item
        )
        set({ cart: { ...cart, items: newItems } })
      },
      clearCart: () => set({ cart: initialCart }),
      setPackagingType: (type) => {
        const { cart } = get()
        const deposit = type === 'STEEL_BOX' ? 50 * cart.items.length : 0
        set({ 
          cart: { 
            ...cart, 
            packagingType: type,
            packagingDeposit: deposit,
          } 
        })
      },

      // UI
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'gharkakhana-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        location: state.location,
        addresses: state.addresses,
        cart: state.cart,
      }),
    }
  )
)

// Selectors
export const useUser = () => useStore((state) => state.user)
export const useCart = () => useStore((state) => state.cart)
export const useLocation = () => useStore((state) => state.location)

export const useCartTotal = () => {
  const cart = useCart()
  
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const taxes = Math.round(subtotal * 0.05) // 5% GST
  const total = subtotal + cart.deliveryFee + cart.packagingDeposit + taxes

  return {
    subtotal,
    deliveryFee: cart.deliveryFee,
    packagingDeposit: cart.packagingDeposit,
    taxes,
    total,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  }
}
