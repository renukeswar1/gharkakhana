'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, MapPin, User, ShoppingBag } from 'lucide-react'
import { useStore } from '@/store/useStore'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, cart, location } = useStore()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🍛</span>
            <span className="text-xl font-bold font-display text-primary-600">
              GharKaKhana
            </span>
          </Link>

          {/* Location Selector - Desktop */}
          <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <MapPin className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-gray-600">
              {location ? location.city : 'Select Location'}
            </span>
          </button>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/search" 
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Explore
            </Link>
            <Link 
              href="/chefs" 
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Home Chefs
            </Link>
            <Link 
              href="/become-chef" 
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Become a Chef
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link 
              href="/cart"
              className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag className="w-6 h-6 text-gray-600" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cart.items.length}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <Link 
                href="/account"
                className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <User className="w-6 h-6 text-gray-600" />
              </Link>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-2">
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50">
                <MapPin className="w-5 h-5 text-primary-500" />
                <span className="text-sm text-gray-600">
                  {location ? location.city : 'Select Location'}
                </span>
              </button>
              <Link 
                href="/search" 
                className="px-4 py-2 text-gray-600 hover:text-primary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Explore
              </Link>
              <Link 
                href="/chefs" 
                className="px-4 py-2 text-gray-600 hover:text-primary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Home Chefs
              </Link>
              <Link 
                href="/become-chef" 
                className="px-4 py-2 text-gray-600 hover:text-primary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Become a Chef
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
