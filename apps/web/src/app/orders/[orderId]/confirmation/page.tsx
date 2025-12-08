'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.orderId as string

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Animation */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. Your delicious home-cooked meal is being prepared with love!
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-mono font-semibold text-lg">{orderId}</p>
          </div>

          {/* Timeline */}
          <div className="text-left mb-6">
            <h3 className="font-semibold mb-3">What happens next?</h3>
            <div className="space-y-3">
              {[
                { icon: '👩‍🍳', text: 'Chef is preparing your food', status: 'current' },
                { icon: '📦', text: 'Food packed in steel containers', status: 'pending' },
                { icon: '🚚', text: 'Out for delivery', status: 'pending' },
                { icon: '🍽️', text: 'Enjoy your meal!', status: 'pending' },
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xl">{step.icon}</span>
                  <span className={step.status === 'current' ? 'font-medium' : 'text-gray-500'}>
                    {step.text}
                  </span>
                  {step.status === 'current' && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full ml-auto">
                      In Progress
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Time */}
          <div className="bg-orange-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-700">Estimated Delivery Time</p>
            <p className="text-2xl font-bold text-orange-600">30-45 minutes</p>
          </div>

          {/* Steel Box Reminder */}
          <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <span className="text-green-600">♻️</span>
              <div className="text-sm">
                <p className="font-medium text-green-800">Remember to return the steel box!</p>
                <p className="text-green-700">
                  Return within 2 days to get your ₹20 deposit back.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/orders/${orderId}`}
              className="block w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
            >
              Track Order
            </Link>
            <Link
              href="/search"
              className="block w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
