'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/store/useStore'

export default function CartPage() {
  const router = useRouter()
  const { cart, updateCartItemQuantity, removeFromCart, clearCart } = useStore()
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('delivery')
  const [instructions, setInstructions] = useState('')

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = deliveryOption === 'delivery' ? 30 : 0
  const packagingFee = 20 // Steel box deposit
  const total = subtotal + deliveryFee + packagingFee

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious home-cooked food!</p>
          <Link 
            href="/search"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Browse Home Chefs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {/* Chef Info */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {cart.items[0]?.chefName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{cart.items[0]?.chefName}</h3>
                  <p className="text-sm text-gray-500">{cart.items.length} items</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow-sm divide-y">
              {cart.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{item.name}</h4>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-orange-600 font-medium">₹{item.price}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-4">Delivery Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:border-orange-500 transition">
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryOption === 'delivery'}
                    onChange={() => setDeliveryOption('delivery')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Home Delivery</p>
                    <p className="text-sm text-gray-500">Delivered in steel containers (returnable)</p>
                  </div>
                  <span className="font-medium">₹30</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:border-orange-500 transition">
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryOption === 'pickup'}
                    onChange={() => setDeliveryOption('pickup')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Self Pickup</p>
                    <p className="text-sm text-gray-500">Pick up from chef's kitchen</p>
                  </div>
                  <span className="text-green-600 font-medium">Free</span>
                </label>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Special Instructions</h3>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any dietary restrictions, allergies, or special requests..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Steel Box Deposit
                    <span className="text-xs text-gray-400 block">(Refundable)</span>
                  </span>
                  <span>₹{packagingFee}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-orange-600">₹{total}</span>
                </div>
              </div>

              {/* Steel Box Info */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">♻️</span>
                  <div className="text-sm">
                    <p className="font-medium text-green-800">Eco-Friendly Packaging</p>
                    <p className="text-green-700">
                      Your food comes in reusable steel containers. Return them within 2 days to get your ₹{packagingFee} deposit back!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full mt-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={clearCart}
                className="w-full mt-2 py-2 text-gray-500 text-sm hover:text-red-500 transition"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
