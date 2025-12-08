'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '@/store/useStore'

export default function SearchPage() {
  const router = useRouter()
  const { location, setLocation } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'chefs' | 'menu'>('chefs')
  const [chefs, setChefs] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('distance')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])

  const cuisines = [
    'North Indian', 'South Indian', 'Bengali', 'Gujarati', 'Maharashtrian',
    'Punjabi', 'Rajasthani', 'Hyderabadi', 'Kerala', 'Tamil'
  ]

  useEffect(() => {
    // Get user location
    if (navigator.geolocation && !location.latitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Current Location',
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [location.latitude, setLocation])

  useEffect(() => {
    if (location.latitude && location.longitude) {
      fetchNearbyChefs()
    }
  }, [location, selectedCuisines, sortBy])

  const fetchNearbyChefs = async () => {
    setLoading(true)
    try {
      // Mock data for now - in production, this would be an API call
      const mockChefs = [
        {
          id: '1',
          name: 'Priya Sharma',
          businessName: 'Priya\'s Kitchen',
          image: '/images/chefs/chef1.jpg',
          rating: 4.8,
          totalReviews: 156,
          cuisines: ['North Indian', 'Punjabi'],
          specialties: ['Dal Makhani', 'Butter Chicken', 'Naan'],
          distance: '1.2 km',
          isAvailable: true,
          priceRange: '₹80 - ₹200',
        },
        {
          id: '2',
          name: 'Meena Iyer',
          businessName: 'South Spice',
          image: '/images/chefs/chef2.jpg',
          rating: 4.9,
          totalReviews: 203,
          cuisines: ['South Indian', 'Kerala'],
          specialties: ['Dosa', 'Idli', 'Sambar'],
          distance: '2.5 km',
          isAvailable: true,
          priceRange: '₹60 - ₹150',
        },
        {
          id: '3',
          name: 'Sunita Patel',
          businessName: 'Gujarati Rasoi',
          image: '/images/chefs/chef3.jpg',
          rating: 4.7,
          totalReviews: 89,
          cuisines: ['Gujarati'],
          specialties: ['Thepla', 'Dhokla', 'Undhiyu'],
          distance: '3.1 km',
          isAvailable: false,
          priceRange: '₹70 - ₹180',
        },
      ]
      setChefs(mockChefs)
    } catch (error) {
      console.error('Error fetching chefs:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchMenuItems = async () => {
    if (!searchQuery) return
    setLoading(true)
    try {
      // Mock data - in production, this would be an API call
      const mockMenuItems = [
        {
          id: '1',
          name: 'Dal Makhani',
          description: 'Creamy black lentils slow-cooked overnight',
          price: 120,
          image: '/images/menu/dal-makhani.jpg',
          chef: { id: '1', name: 'Priya Sharma', businessName: 'Priya\'s Kitchen' },
          rating: 4.9,
          isVegetarian: true,
          isAvailable: true,
        },
        {
          id: '2',
          name: 'Chicken Biryani',
          description: 'Aromatic basmati rice with tender chicken',
          price: 180,
          image: '/images/menu/biryani.jpg',
          chef: { id: '4', name: 'Fatima Khan', businessName: 'Hyderabadi Dastarkhwan' },
          rating: 4.8,
          isVegetarian: false,
          isAvailable: true,
        },
      ]
      setMenuItems(mockMenuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    } catch (error) {
      console.error('Error searching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Location Bar */}
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{location.address || 'Set your location'}</span>
            <button className="text-orange-600 text-sm ml-2">Change</button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={searchType === 'chefs' ? 'Search home chefs near you...' : 'Search for dishes (e.g., Biryani, Dosa)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchType === 'menu' && searchMenuItems()}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchType === 'menu' && (
              <button
                onClick={searchMenuItems}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Search
              </button>
            )}
          </div>

          {/* Search Type Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setSearchType('chefs')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                searchType === 'chefs'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Browse Chefs
            </button>
            <button
              onClick={() => setSearchType('menu')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                searchType === 'menu'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Search by Dish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-32">
              <h3 className="font-semibold mb-4">Filters</h3>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="distance">Distance</option>
                  <option value="rating">Rating</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Cuisines */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cuisines</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cuisines.map((cuisine) => (
                    <label key={cuisine} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCuisines.includes(cuisine)}
                        onChange={() => toggleCuisine(cuisine)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Available Now</span>
                </label>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCuisines([])
                  setSortBy('distance')
                  setPriceRange([0, 500])
                }}
                className="w-full py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : searchType === 'chefs' ? (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {chefs.length} Home Chefs Near You
                </h2>
                <div className="space-y-4">
                  {chefs.map((chef) => (
                    <Link key={chef.id} href={`/chefs/${chef.id}`}>
                      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition cursor-pointer">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                              {chef.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{chef.businessName}</h3>
                                <p className="text-gray-600 text-sm">by {chef.name}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                chef.isAvailable 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {chef.isAvailable ? 'Accepting Orders' : 'Closed'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="flex items-center gap-1 text-sm">
                                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-medium">{chef.rating}</span>
                                <span className="text-gray-500">({chef.totalReviews} reviews)</span>
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className="text-sm text-gray-600">{chef.distance}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {chef.cuisines.map((cuisine: string) => (
                                <span key={cuisine} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
                                  {cuisine}
                                </span>
                              ))}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Known for:</span> {chef.specialties.join(', ')}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{chef.priceRange}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {menuItems.length > 0 
                    ? `${menuItems.length} Results for "${searchQuery}"`
                    : searchQuery 
                      ? `No results for "${searchQuery}"`
                      : 'Search for your favorite dishes'
                  }
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {menuItems.map((item) => (
                    <Link key={item.id} href={`/chefs/${item.chef.id}?item=${item.id}`}>
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer">
                        <div className="h-32 bg-gradient-to-br from-orange-200 to-orange-300"></div>
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                            <span className="font-semibold text-orange-600">₹{item.price}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-sm text-gray-600">
                              by <span className="text-orange-600">{item.chef.businessName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium">{item.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
