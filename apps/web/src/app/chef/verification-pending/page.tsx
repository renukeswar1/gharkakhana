'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function VerificationPendingPage() {
  const [chefInfo, setChefInfo] = useState<any>(null)

  useEffect(() => {
    // Try to get chef info from the API
    const fetchChefInfo = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setChefInfo(data.data)
        }
      } catch (error) {
        console.error('Error fetching chef info:', error)
      }
    }

    fetchChefInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for applying to become a home chef on GharKaKhana. 
            Your application is under review.
          </p>

          {chefInfo?.chef && (
            <div className="bg-orange-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-orange-800 mb-2">Your Details:</h3>
              <p className="text-sm text-orange-700">
                <strong>Kitchen Name:</strong> {chefInfo.chef.businessName}
              </p>
              <p className="text-sm text-orange-700">
                <strong>Status:</strong>{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  {chefInfo.chef.status}
                </span>
              </p>
            </div>
          )}

          {/* What's Next */}
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">1.</span>
                Our team will review your application (usually within 24-48 hours)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">2.</span>
                We may call you for verification
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">3.</span>
                Once approved, you can start adding menu items
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">4.</span>
                Go live and start receiving orders!
              </li>
            </ul>
          </div>

          {/* Contact */}
          <p className="text-sm text-gray-500 mb-6">
            Questions? Contact us at{' '}
            <a href="mailto:support@gharkakhana.com" className="text-orange-600 hover:underline">
              support@gharkakhana.com
            </a>
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition"
            >
              Go to Home
            </Link>
            <Link 
              href="/login"
              className="block w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Login to Your Account
            </Link>
          </div>
        </div>

        {/* Decorative */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            🍲 Share your homemade love with the world
          </p>
        </div>
      </div>
    </div>
  )
}
