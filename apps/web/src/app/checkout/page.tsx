'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/store/useStore'

interface Address {
  id: string
  label: string
  line1: string
  line2: string
  city: string
  pincode: string
  isDefault: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, clearCart } = useStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [showAddAddress, setShowAddAddress] = useState(false)

  // Mock saved addresses
  const [addresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      line1: '123, Palm Heights',
      line2: 'Near Metro Station, Andheri West',
      city: 'Mumbai',
      pincode: '400053',
      isDefault: true,
    },
    {
      id: '2',
      label: 'Office',
      line1: '456, Tech Park',
      line2: 'BKC, Bandra East',
      city: 'Mumbai',
      pincode: '400051',
      isDefault: false,
    },
  ])

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = 30
  const packagingFee = 20
  const total = subtotal + deliveryFee + packagingFee

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return

    setLoading(true)
    try {
      // Mock order placement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear cart and redirect to order confirmation
      const orderId = 'ORD-' + Date.now()
      clearCart()
      router.push(`/orders/${orderId}/confirmation`)
    } catch (error) {
      console.error('Error placing order:', error)
    } finally {
      setLoading(false)
    }
  }

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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/cart" className="text-gray-500 hover:text-gray-700">
            ← Back to Cart
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { num: 1, label: 'Address' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Confirm' },
          ].map(({ num, label }, index) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= num 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > num ? '✓' : num}
              </div>
              <span className={`ml-2 text-sm ${step >= num ? 'text-gray-900' : 'text-gray-500'}`}>
                {label}
              </span>
              {index < 2 && (
                <div className={`w-12 h-0.5 mx-4 ${step > num ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Step 1: Address Selection */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Select Delivery Address</h2>
                
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border rounded-lg cursor-pointer transition ${
                        selectedAddress === address.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={() => setSelectedAddress(address.id)}
                          className="mt-1 w-4 h-4 text-orange-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{address.label}</span>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{address.line1}</p>
                          <p className="text-sm text-gray-600">{address.line2}</p>
                          <p className="text-sm text-gray-600">{address.city} - {address.pincode}</p>
                        </div>
                      </div>
                    </label>
                  ))}

                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Address
                  </button>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedAddress}
                  className="w-full mt-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>
                
                <div className="space-y-3">
                  {[
                    { id: 'UPI', label: 'UPI', desc: 'Pay using any UPI app', icon: '📱' },
                    { id: 'CARD', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, Rupay', icon: '💳' },
                    { id: 'WALLET', label: 'Wallet', desc: 'Paytm, PhonePe, Amazon Pay', icon: '👛' },
                    { id: 'COD', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: '💵' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`block p-4 border rounded-lg cursor-pointer transition ${
                        paymentMethod === method.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="w-4 h-4 text-orange-600"
                        />
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <span className="font-medium">{method.label}</span>
                          <p className="text-sm text-gray-500">{method.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Order Confirmation */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Confirm Your Order</h2>
                
                {/* Delivery Address */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-700">Delivery Address</h3>
                    <button 
                      onClick={() => setStep(1)}
                      className="text-sm text-orange-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    {(() => {
                      const addr = addresses.find(a => a.id === selectedAddress)
                      return addr ? (
                        <>
                          <p className="font-medium text-gray-900">{addr.label}</p>
                          <p>{addr.line1}</p>
                          <p>{addr.line2}</p>
                          <p>{addr.city} - {addr.pincode}</p>
                        </>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-700">Payment Method</h3>
                    <button 
                      onClick={() => setStep(2)}
                      className="text-sm text-orange-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    {paymentMethod === 'UPI' && '📱 UPI Payment'}
                    {paymentMethod === 'CARD' && '💳 Credit/Debit Card'}
                    {paymentMethod === 'WALLET' && '👛 Digital Wallet'}
                    {paymentMethod === 'COD' && '💵 Cash on Delivery'}
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Order Items</h3>
                  <div className="divide-y border rounded-lg">
                    {cart.items.map((item) => (
                      <div key={item.id} className="p-3 flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eco-friendly notice */}
                <div className="p-4 bg-green-50 rounded-lg mb-6">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">♻️</span>
                    <div className="text-sm">
                      <p className="font-medium text-green-800">Eco-Friendly Steel Box Delivery</p>
                      <p className="text-green-700">
                        Your food will be delivered in reusable steel containers. Return them within 2 days to get your ₹20 deposit refunded!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Placing Order...
                      </>
                    ) : (
                      <>Place Order • ₹{total}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              
              {/* Chef Info */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {cart.items[0]?.chefName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{cart.items[0]?.chefName}</p>
                  <p className="text-xs text-gray-500">{cart.items.length} items</p>
                </div>
              </div>

              {/* Items */}
              <div className="py-4 border-b space-y-2 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Steel Box Deposit</span>
                  <span>₹{packagingFee}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-orange-600">₹{total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  placeholder="Home, Office, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  placeholder="House/Flat No., Building Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  placeholder="Street, Landmark"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    placeholder="400001"
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddAddress(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddAddress(false)}
                className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
