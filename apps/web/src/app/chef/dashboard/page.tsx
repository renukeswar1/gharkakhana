'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  todayOrders: number
  todayEarnings: number
  pendingOrders: number
  totalOrders: number
  rating: number
  totalReviews: number
}

interface Order {
  id: string
  customerName: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED'
  createdAt: string
  deliveryType: 'DELIVERY' | 'PICKUP'
}

export default function ChefDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Mock data
      const mockStats: DashboardStats = {
        todayOrders: 8,
        todayEarnings: 2450,
        pendingOrders: 3,
        totalOrders: 1243,
        rating: 4.8,
        totalReviews: 156,
      }

      const mockOrders: Order[] = [
        {
          id: 'ORD-001',
          customerName: 'Rahul Mehta',
          items: [
            { name: 'Dal Makhani', quantity: 2, price: 120 },
            { name: 'Jeera Rice', quantity: 2, price: 80 },
            { name: 'Naan', quantity: 4, price: 40 },
          ],
          total: 560,
          status: 'PENDING',
          createdAt: '10 mins ago',
          deliveryType: 'DELIVERY',
        },
        {
          id: 'ORD-002',
          customerName: 'Priya Singh',
          items: [
            { name: 'Butter Chicken', quantity: 1, price: 180 },
            { name: 'Naan', quantity: 2, price: 40 },
          ],
          total: 260,
          status: 'CONFIRMED',
          createdAt: '25 mins ago',
          deliveryType: 'PICKUP',
        },
        {
          id: 'ORD-003',
          customerName: 'Amit Patel',
          items: [
            { name: 'Paneer Tikka Masala', quantity: 2, price: 160 },
            { name: 'Raita', quantity: 2, price: 40 },
          ],
          total: 400,
          status: 'PREPARING',
          createdAt: '45 mins ago',
          deliveryType: 'DELIVERY',
        },
      ]

      setStats(mockStats)
      setOrders(mockOrders)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
  }

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-purple-100 text-purple-800',
      READY: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
    }
    return colors[status]
  }

  const getNextStatus = (status: Order['status']): Order['status'] | null => {
    const flow: Record<Order['status'], Order['status'] | null> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'DELIVERED',
      DELIVERED: null,
    }
    return flow[status]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chef Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your overview for today.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Availability Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                  {isAvailable ? 'Accepting Orders' : 'Not Available'}
                </span>
                <button
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`w-14 h-7 rounded-full p-1 transition ${
                    isAvailable ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isAvailable ? 'translate-x-7' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
              <Link 
                href="/chef/menu/edit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Update Today's Menu
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Today's Orders</p>
                <p className="text-2xl font-bold">{stats?.todayOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Today's Earnings</p>
                <p className="text-2xl font-bold">₹{stats?.todayEarnings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending Orders</p>
                <p className="text-2xl font-bold">{stats?.pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Rating</p>
                <p className="text-2xl font-bold">{stats?.rating} <span className="text-sm text-gray-500 font-normal">({stats?.totalReviews})</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { icon: '📋', label: 'Menu', href: '/chef/menu' },
            { icon: '📊', label: 'Analytics', href: '/chef/analytics' },
            { icon: '💬', label: 'Reviews', href: '/chef/reviews' },
            { icon: '⚙️', label: 'Settings', href: '/chef/settings' },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center hover:shadow-md transition cursor-pointer">
                <span className="text-2xl">{action.icon}</span>
                <p className="text-sm font-medium mt-2">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Orders</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'active'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active ({orders.filter(o => o.status !== 'DELIVERED').length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === 'completed'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {orders
              .filter(order => 
                activeTab === 'active' 
                  ? order.status !== 'DELIVERED' 
                  : order.status === 'DELIVERED'
              )
              .map((order) => (
                <div key={order.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{order.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.deliveryType === 'PICKUP' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {order.deliveryType === 'PICKUP' ? '🏃 Pickup' : '🚚 Delivery'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {order.customerName} • {order.createdAt}
                      </p>
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">Items:</p>
                        <ul className="mt-1 space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-sm">
                              {item.quantity}x {item.name} - ₹{item.price * item.quantity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{order.total}</p>
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                          className="mt-3 px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition"
                        >
                          Mark as {getNextStatus(order.status)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {orders.filter(order => 
              activeTab === 'active' 
                ? order.status !== 'DELIVERED' 
                : order.status === 'DELIVERED'
            ).length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <p>No {activeTab} orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
