'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/store/useStore'
import { apiClient } from '@/lib/api-client'

export default function AccountPage() {
  const router = useRouter()
  const { user, setUser, logout } = useStore()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient.get('/auth/me')
        setProfile(data.data)
        setUser({
          userId: data.data.userId,
          email: data.data.email,
          phone: data.data.phone,
          name: data.data.name,
          role: data.data.role
        })
      } catch (err: any) {
        console.error('Error fetching profile:', err)
        if (err.message?.includes('UNAUTHORIZED') || err.message?.includes('No token')) {
          router.push('/login')
          return
        }
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router, setUser])

  const handleLogout = () => {
    logout()
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/login" className="text-orange-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-orange-600">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <p className="text-gray-600">{profile?.email}</p>
              <p className="text-gray-600">{profile?.phone}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                profile?.role === 'CHEF' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Chef Info */}
        {profile?.chef && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              👨‍🍳 Chef Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Kitchen Name</p>
                <p className="font-medium">{profile.chef.businessName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.chef.status === 'APPROVED' 
                    ? 'bg-green-100 text-green-800' 
                    : profile.chef.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.chef.status}
                </span>
              </div>
            </div>
            {profile.chef.status === 'APPROVED' && (
              <Link 
                href="/chef/dashboard"
                className="mt-4 inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Go to Chef Dashboard
              </Link>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/orders"
              className="p-4 border rounded-xl hover:bg-gray-50 transition text-center"
            >
              <span className="text-2xl mb-2 block">📦</span>
              <span className="text-sm font-medium">My Orders</span>
            </Link>
            <Link 
              href="/addresses"
              className="p-4 border rounded-xl hover:bg-gray-50 transition text-center"
            >
              <span className="text-2xl mb-2 block">📍</span>
              <span className="text-sm font-medium">Addresses</span>
            </Link>
            <Link 
              href="/favorites"
              className="p-4 border rounded-xl hover:bg-gray-50 transition text-center"
            >
              <span className="text-2xl mb-2 block">❤️</span>
              <span className="text-sm font-medium">Favorites</span>
            </Link>
            <Link 
              href="/settings"
              className="p-4 border rounded-xl hover:bg-gray-50 transition text-center"
            >
              <span className="text-2xl mb-2 block">⚙️</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>

        {/* Become a Chef CTA */}
        {profile?.role !== 'CHEF' && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-sm p-6 mb-6 text-white">
            <h2 className="text-lg font-semibold mb-2">🍳 Become a Home Chef!</h2>
            <p className="text-orange-100 mb-4">
              Share your cooking skills and earn money from home
            </p>
            <Link 
              href="/chef/register"
              className="inline-block px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition"
            >
              Register as Chef
            </Link>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
