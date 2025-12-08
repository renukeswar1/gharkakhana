import Link from 'next/link'
import { ChefHat, DollarSign, Clock, Users } from 'lucide-react'

export function BecomeChef() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary-500 to-orange-500 text-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
              <ChefHat className="w-5 h-5" />
              <span className="text-sm font-medium">Join Our Community</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Turn Your Cooking Passion Into Income
            </h2>
            
            <p className="text-lg text-white/90 mb-8">
              Are you a homemaker who loves cooking? Join GharKaKhana and earn by 
              sharing your delicious home-cooked meals with people in your neighborhood.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { icon: DollarSign, label: 'Earn ₹15,000-50,000/month' },
                { icon: Clock, label: 'Flexible working hours' },
                { icon: Users, label: 'Build your own customer base' },
                { icon: ChefHat, label: 'Cook from your home' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>

            <Link
              href="/become-chef"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              <ChefHat className="w-5 h-5" />
              Start Your Journey
            </Link>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-80 h-80 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center">
                <span className="text-9xl">👩‍🍳</span>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-white text-gray-800 px-4 py-3 rounded-xl shadow-xl">
                <div className="text-2xl font-bold text-primary-500">₹45,000</div>
                <div className="text-sm text-gray-500">Earned this month</div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white text-gray-800 px-4 py-3 rounded-xl shadow-xl">
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-yellow-500">4.9</span>
                  <span className="text-yellow-500">★</span>
                </div>
                <div className="text-sm text-gray-500">Average rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
