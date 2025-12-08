import Link from 'next/link'
import { Star, MapPin, Clock } from 'lucide-react'
import { ChefCard } from '@/components/chef/ChefCard'

// Mock data - will be replaced with API call
const featuredChefs = [
  {
    id: '1',
    businessName: "Amma's Kitchen",
    profileImage: '/chefs/chef1.jpg',
    cuisines: ['South Indian', 'Andhra'],
    rating: 4.8,
    totalReviews: 156,
    distance: 1.2,
    isAvailable: true,
    todaysSpecial: 'Hyderabadi Chicken Biryani',
    minimumOrder: 150,
  },
  {
    id: '2',
    businessName: 'Punjabi Rasoi',
    profileImage: '/chefs/chef2.jpg',
    cuisines: ['North Indian', 'Punjabi'],
    rating: 4.7,
    totalReviews: 203,
    distance: 2.5,
    isAvailable: true,
    todaysSpecial: 'Dal Makhani + Butter Naan',
    minimumOrder: 200,
  },
  {
    id: '3',
    businessName: 'Bengali Bhojan',
    profileImage: '/chefs/chef3.jpg',
    cuisines: ['Bengali', 'Seafood'],
    rating: 4.9,
    totalReviews: 89,
    distance: 1.8,
    isAvailable: true,
    todaysSpecial: 'Fish Curry with Rice',
    minimumOrder: 180,
  },
  {
    id: '4',
    businessName: 'Gujarat ni Rasoi',
    profileImage: '/chefs/chef4.jpg',
    cuisines: ['Gujarati', 'Jain'],
    rating: 4.6,
    totalReviews: 124,
    distance: 3.2,
    isAvailable: true,
    todaysSpecial: 'Gujarati Thali',
    minimumOrder: 250,
  },
]

export function FeaturedChefs() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h2 className="heading-2 mb-2">Featured Home Chefs</h2>
            <p className="text-gray-600">
              Top-rated chefs loved by the community
            </p>
          </div>
          <Link 
            href="/chefs"
            className="btn-outline mt-4 md:mt-0"
          >
            View All Chefs
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredChefs.map((chef) => (
            <ChefCard key={chef.id} chef={chef} />
          ))}
        </div>
      </div>
    </section>
  )
}
