'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, ChevronDown } from 'lucide-react'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'dish' | 'chef'>('dish')

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-orange-50 to-yellow-50 py-16 md:py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-200/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full mb-6 shadow-sm">
            <span className="text-2xl">🏠</span>
            <span className="text-sm font-medium text-gray-700">
              Fresh from Home Kitchens
            </span>
          </div>

          {/* Heading */}
          <h1 className="heading-1 mb-6">
            Authentic <span className="text-primary-500">Home-Cooked</span> Food,
            <br />
            Delivered to Your Door
          </h1>

          {/* Subheading */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Skip the restaurants. Order fresh, hygienic meals prepared by verified 
            home chefs in your neighborhood. Just like mom makes! 🍛
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-xl p-2 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              {/* Location */}
              <button className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors md:border-r md:border-gray-200">
                <MapPin className="w-5 h-5 text-primary-500" />
                <span className="text-gray-600">Hyderabad</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* Search Type Toggle */}
              <div className="flex items-center gap-2 px-2">
                <button
                  onClick={() => setSearchType('dish')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    searchType === 'dish' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Dish
                </button>
                <button
                  onClick={() => setSearchType('chef')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    searchType === 'chef' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Chef
                </button>
              </div>

              {/* Search Input */}
              <div className="flex-1 flex items-center">
                <input
                  type="text"
                  placeholder={searchType === 'dish' ? 'Search for biryani, dal, roti...' : 'Search for home chefs...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border-0 focus:ring-0 focus:outline-none text-gray-700 placeholder:text-gray-400"
                />
              </div>

              {/* Search Button */}
              <Link
                href={`/search?type=${searchType}&q=${searchQuery}`}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </Link>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-gray-500">Popular:</span>
            {['Biryani', 'Thali', 'Paratha', 'Chole Bhature', 'South Indian'].map((item) => (
              <Link
                key={item}
                href={`/search?type=dish&q=${item}`}
                className="px-3 py-1 bg-white/80 hover:bg-white rounded-full text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { number: '500+', label: 'Home Chefs' },
            { number: '10,000+', label: 'Happy Customers' },
            { number: '50,000+', label: 'Meals Served' },
            { number: '4.8★', label: 'Average Rating' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
