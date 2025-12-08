'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/store/useStore'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isVegetarian: boolean
  isVegan: boolean
  isSpicy: boolean
  servingSize: string
  preparationTime: number
  isAvailable: boolean
  maxQuantity: number
}

interface Chef {
  id: string
  name: string
  businessName: string
  bio: string
  cuisines: string[]
  specialties: string[]
  rating: number
  totalReviews: number
  totalOrders: number
  isAvailable: boolean
  profileImage?: string
  coverImage?: string
  workingHours: Record<string, { open: string; close: string }>
  address: {
    city: string
    state: string
  }
}

interface Review {
  id: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
  itemsOrdered: string[]
}

export default function ChefDetailPage() {
  const params = useParams()
  const chefId = params.id as string
  const { addToCart, cart } = useStore()
  
  const [chef, setChef] = useState<Chef | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'about'>('menu')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchChefDetails()
  }, [chefId])

  const fetchChefDetails = async () => {
    setLoading(true)
    try {
      // Mock data - in production, these would be API calls
      const mockChef: Chef = {
        id: chefId,
        name: 'Priya Sharma',
        businessName: "Priya's Kitchen",
        bio: 'Passionate home chef with 15 years of cooking experience. Specializing in authentic North Indian cuisine made with love and traditional recipes passed down through generations. All dishes are prepared fresh daily using quality ingredients.',
        cuisines: ['North Indian', 'Punjabi'],
        specialties: ['Dal Makhani', 'Butter Chicken', 'Naan', 'Paneer Tikka'],
        rating: 4.8,
        totalReviews: 156,
        totalOrders: 1243,
        isAvailable: true,
        workingHours: {
          monday: { open: '10:00', close: '20:00' },
          tuesday: { open: '10:00', close: '20:00' },
          wednesday: { open: '10:00', close: '20:00' },
          thursday: { open: '10:00', close: '20:00' },
          friday: { open: '10:00', close: '21:00' },
          saturday: { open: '10:00', close: '21:00' },
          sunday: { open: '11:00', close: '20:00' },
        },
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      }

      const mockMenu: MenuItem[] = [
        {
          id: '1',
          name: 'Dal Makhani',
          description: 'Creamy black lentils slow-cooked overnight with butter and cream',
          price: 120,
          isVegetarian: true,
          isVegan: false,
          isSpicy: false,
          servingSize: '250g',
          preparationTime: 30,
          isAvailable: true,
          maxQuantity: 10,
        },
        {
          id: '2',
          name: 'Butter Chicken',
          description: 'Tender chicken in rich, creamy tomato-based curry',
          price: 180,
          isVegetarian: false,
          isVegan: false,
          isSpicy: true,
          servingSize: '300g',
          preparationTime: 35,
          isAvailable: true,
          maxQuantity: 8,
        },
        {
          id: '3',
          name: 'Paneer Tikka Masala',
          description: 'Grilled cottage cheese in spicy tomato gravy',
          price: 160,
          isVegetarian: true,
          isVegan: false,
          isSpicy: true,
          servingSize: '280g',
          preparationTime: 30,
          isAvailable: true,
          maxQuantity: 10,
        },
        {
          id: '4',
          name: 'Jeera Rice',
          description: 'Fragrant basmati rice tempered with cumin seeds',
          price: 80,
          isVegetarian: true,
          isVegan: true,
          isSpicy: false,
          servingSize: '250g',
          preparationTime: 20,
          isAvailable: true,
          maxQuantity: 15,
        },
        {
          id: '5',
          name: 'Garlic Naan',
          description: 'Soft leavened bread topped with garlic and butter',
          price: 40,
          isVegetarian: true,
          isVegan: false,
          isSpicy: false,
          servingSize: '2 pieces',
          preparationTime: 15,
          isAvailable: true,
          maxQuantity: 20,
        },
        {
          id: '6',
          name: 'Raita',
          description: 'Cooling yogurt with cucumber and spices',
          price: 40,
          isVegetarian: true,
          isVegan: false,
          isSpicy: false,
          servingSize: '150g',
          preparationTime: 10,
          isAvailable: true,
          maxQuantity: 15,
        },
      ]

      const mockReviews: Review[] = [
        {
          id: '1',
          customerName: 'Rahul M.',
          rating: 5,
          comment: 'The Dal Makhani was absolutely divine! Reminded me of my grandmother\'s cooking. Will definitely order again.',
          createdAt: '2024-01-15',
          itemsOrdered: ['Dal Makhani', 'Jeera Rice', 'Naan'],
        },
        {
          id: '2',
          customerName: 'Sneha K.',
          rating: 4,
          comment: 'Great taste and portions. The butter chicken was excellent. Slightly delayed delivery but worth the wait.',
          createdAt: '2024-01-12',
          itemsOrdered: ['Butter Chicken', 'Naan'],
        },
        {
          id: '3',
          customerName: 'Amit P.',
          rating: 5,
          comment: 'Best home-cooked food in the area. Hygienic packaging and tastes authentic. Highly recommended!',
          createdAt: '2024-01-10',
          itemsOrdered: ['Paneer Tikka Masala', 'Jeera Rice'],
        },
      ]

      setChef(mockChef)
      setMenu(mockMenu)
      setReviews(mockReviews)
    } catch (error) {
      console.error('Error fetching chef details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemQuantityInCart = (itemId: string) => {
    const cartItem = cart.items.find(item => item.id === itemId)
    return cartItem?.quantity || 0
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!chef) return
    addToCart({
      id: item.id,
      menuId: 'today',
      name: item.name,
      price: item.price,
      quantity: 1,
      chefId: chef.id,
      chefName: chef.businessName,
    })
  }

  const getDayName = () => {
    return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
  }

  const isCurrentlyOpen = () => {
    if (!chef) return false
    const today = getDayName()
    const hours = chef.workingHours[today]
    if (!hours) return false

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return currentTime >= hours.open && currentTime <= hours.close
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!chef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Chef not found</h2>
          <Link href="/search" className="text-orange-600 hover:underline mt-2 block">
            Back to search
          </Link>
        </div>
      </div>
    )
  }

  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : selectedCategory === 'veg'
      ? menu.filter(item => item.isVegetarian)
      : menu.filter(item => !item.isVegetarian)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image / Header */}
      <div className="relative h-64 bg-gradient-to-br from-orange-400 to-orange-600">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Chef Info Card */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
              {chef.name.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{chef.businessName}</h1>
                  <p className="text-gray-600">by {chef.name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{chef.rating}</span>
                      <span className="text-gray-500">({chef.totalReviews} reviews)</span>
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">{chef.totalOrders}+ orders</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isCurrentlyOpen() 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isCurrentlyOpen() ? '🟢 Open Now' : '🔴 Closed'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {chef.address.city}, {chef.address.state}
                  </span>
                </div>
              </div>

              {/* Cuisines & Specialties */}
              <div className="mt-4 flex flex-wrap gap-2">
                {chef.cuisines.map((cuisine) => (
                  <span key={cuisine} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full">
                    {cuisine}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mt-4">
          <div className="border-b">
            <div className="flex">
              {(['menu', 'reviews', 'about'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-center font-medium transition ${
                    activeTab === tab
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'menu' ? "Today's Menu" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Menu Tab */}
            {activeTab === 'menu' && (
              <div>
                {/* Category Filter */}
                <div className="flex gap-2 mb-6">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'veg', label: '🥬 Veg' },
                    { key: 'non-veg', label: '🍖 Non-Veg' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        selectedCategory === key
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Menu Items */}
                <div className="space-y-4">
                  {filteredMenu.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-sm ${item.isVegetarian ? 'border-2 border-green-600' : 'border-2 border-red-600'} flex items-center justify-center`}>
                                <span className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                              </span>
                              <h3 className="font-semibold">{item.name}</h3>
                              {item.isSpicy && <span className="text-red-500">🌶️</span>}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>📦 {item.servingSize}</span>
                              <span>⏱️ {item.preparationTime} mins</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">₹{item.price}</p>
                            {item.isAvailable ? (
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="mt-2 px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition"
                              >
                                {getItemQuantityInCart(item.id) > 0 
                                  ? `Add More (${getItemQuantityInCart(item.id)})` 
                                  : 'Add to Cart'}
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500">Not available</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating Summary */}
                <div className="flex items-center gap-6 p-6 bg-orange-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-orange-600">{chef.rating}</p>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(chef.rating) ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{chef.totalReviews} reviews</p>
                  </div>
                </div>

                {/* Review List */}
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {review.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{review.customerName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-gray-700">{review.comment}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {review.itemsOrdered.map((item) => (
                        <span key={item} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-gray-700">{chef.bio}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {chef.specialties.map((specialty) => (
                      <span key={specialty} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Working Hours</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(chef.workingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between py-2 border-b">
                        <span className="capitalize">{day}</span>
                        <span className="text-gray-600">{hours.open} - {hours.close}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.items.length > 0 && (
        <Link href="/cart">
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 hover:bg-orange-700 transition cursor-pointer">
            <span>{cart.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
            <span>|</span>
            <span className="font-semibold">₹{cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
            <span>→</span>
            <span>View Cart</span>
          </div>
        </Link>
      )}
    </div>
  )
}
