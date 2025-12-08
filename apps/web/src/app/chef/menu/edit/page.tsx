'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  isVegetarian: boolean
  isSpicy: boolean
  servingSize: string
  preparationTime: number
  isAvailable: boolean
  maxQuantity: number
  category: string
}

export default function MenuEditPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isVegetarian: true,
    isSpicy: false,
    servingSize: '',
    preparationTime: 30,
    maxQuantity: 10,
    category: 'Main Course',
  })

  const categories = ['Main Course', 'Rice & Breads', 'Starters', 'Desserts', 'Beverages', 'Accompaniments']

  useEffect(() => {
    fetchMenu()
  }, [selectedDate])

  const fetchMenu = async () => {
    setLoading(true)
    try {
      // Mock data
      const mockItems: MenuItem[] = [
        {
          id: '1',
          name: 'Dal Makhani',
          description: 'Creamy black lentils slow-cooked overnight',
          price: 120,
          isVegetarian: true,
          isSpicy: false,
          servingSize: '250g',
          preparationTime: 30,
          isAvailable: true,
          maxQuantity: 10,
          category: 'Main Course',
        },
        {
          id: '2',
          name: 'Butter Chicken',
          description: 'Tender chicken in rich tomato curry',
          price: 180,
          isVegetarian: false,
          isSpicy: true,
          servingSize: '300g',
          preparationTime: 35,
          isAvailable: true,
          maxQuantity: 8,
          category: 'Main Course',
        },
        {
          id: '3',
          name: 'Jeera Rice',
          description: 'Fragrant basmati rice with cumin',
          price: 80,
          isVegetarian: true,
          isSpicy: false,
          servingSize: '250g',
          preparationTime: 20,
          isAvailable: true,
          maxQuantity: 15,
          category: 'Rice & Breads',
        },
      ]
      setMenuItems(mockItems)
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItemAvailability = (itemId: string) => {
    setMenuItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
      )
    )
  }

  const deleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setMenuItems(prev => prev.filter(item => item.id !== itemId))
    }
  }

  const handleSubmit = () => {
    if (editingItem) {
      // Update existing item
      setMenuItems(prev =>
        prev.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                isVegetarian: formData.isVegetarian,
                isSpicy: formData.isSpicy,
                servingSize: formData.servingSize,
                preparationTime: formData.preparationTime,
                maxQuantity: formData.maxQuantity,
                category: formData.category,
              }
            : item
        )
      )
    } else {
      // Add new item
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        isVegetarian: formData.isVegetarian,
        isSpicy: formData.isSpicy,
        servingSize: formData.servingSize,
        preparationTime: formData.preparationTime,
        isAvailable: true,
        maxQuantity: formData.maxQuantity,
        category: formData.category,
      }
      setMenuItems(prev => [...prev, newItem])
    }

    // Reset form
    setFormData({
      name: '',
      description: '',
      price: '',
      isVegetarian: true,
      isSpicy: false,
      servingSize: '',
      preparationTime: 30,
      maxQuantity: 10,
      category: 'Main Course',
    })
    setShowAddModal(false)
    setEditingItem(null)
  }

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      isVegetarian: item.isVegetarian,
      isSpicy: item.isSpicy,
      servingSize: item.servingSize,
      preparationTime: item.preparationTime,
      maxQuantity: item.maxQuantity,
      category: item.category,
    })
    setShowAddModal(true)
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Link href="/chef/dashboard" className="text-gray-500 hover:text-gray-700">
                  ← Back
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Menu Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => {
                  setEditingItem(null)
                  setFormData({
                    name: '',
                    description: '',
                    price: '',
                    isVegetarian: true,
                    isSpicy: false,
                    servingSize: '',
                    preparationTime: 30,
                    maxQuantity: 10,
                    category: 'Main Course',
                  })
                  setShowAddModal(true)
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-xl font-semibold mb-2">No menu items yet</h2>
            <p className="text-gray-600 mb-6">Add your first dish to start accepting orders</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Add Your First Dish
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h2 className="font-semibold text-gray-900">{category}</h2>
                </div>
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="p-6 flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-sm ${item.isVegetarian ? 'border-2 border-green-600' : 'border-2 border-red-600'} flex items-center justify-center`}>
                            <span className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                          </span>
                          <h3 className="font-semibold">{item.name}</h3>
                          {item.isSpicy && <span>🌶️</span>}
                          {!item.isAvailable && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>₹{item.price}</span>
                          <span>•</span>
                          <span>{item.servingSize}</span>
                          <span>•</span>
                          <span>{item.preparationTime} mins</span>
                          <span>•</span>
                          <span>Max: {item.maxQuantity}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleItemAvailability(item.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                            item.isAvailable
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Dal Makhani"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={2}
                  placeholder="Describe your dish..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                  <input
                    type="text"
                    value={formData.servingSize}
                    onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="250g or 2 pieces"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Quantity</label>
                  <input
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm">Spicy 🌶️</span>
                </label>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition cursor-pointer">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600 mt-2">Click to upload dish photo</p>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingItem(null)
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.price}
                className="flex-1 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
