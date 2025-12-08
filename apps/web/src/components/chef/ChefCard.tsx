import Link from 'next/link'
import { Star, MapPin, Clock } from 'lucide-react'

interface Chef {
  id: string
  businessName: string
  profileImage: string
  cuisines: string[]
  rating: number
  totalReviews: number
  distance: number
  isAvailable: boolean
  todaysSpecial?: string
  minimumOrder: number
}

interface ChefCardProps {
  chef: Chef
}

export function ChefCard({ chef }: ChefCardProps) {
  return (
    <Link href={`/chef/${chef.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          <div className="absolute inset-0 flex items-center justify-center text-6xl bg-gradient-to-br from-primary-100 to-orange-100">
            👩‍🍳
          </div>
          
          {/* Availability Badge */}
          {chef.isAvailable ? (
            <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Open Today
            </div>
          ) : (
            <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              Closed
            </div>
          )}

          {/* Distance */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {chef.distance} km
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name & Rating */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-800 group-hover:text-primary-600 transition-colors">
              {chef.businessName}
            </h3>
            <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded">
              <Star className="w-4 h-4 fill-green-600 text-green-600" />
              <span className="text-sm font-medium text-green-700">{chef.rating}</span>
            </div>
          </div>

          {/* Cuisines */}
          <p className="text-sm text-gray-500 mb-3">
            {chef.cuisines.join(', ')}
          </p>

          {/* Today's Special */}
          {chef.todaysSpecial && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mb-3">
              <div className="text-xs text-orange-600 font-medium mb-0.5">Today's Special</div>
              <div className="text-sm text-gray-700">{chef.todaysSpecial}</div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Min. ₹{chef.minimumOrder}
            </div>
            <div className="text-sm text-gray-500">
              {chef.totalReviews} reviews
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
