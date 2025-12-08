import { Shield, Heart, Leaf, Clock, Package, Award } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Verified Chefs',
    description: 'Every chef is verified with kitchen inspection and food safety checks',
    color: 'text-blue-500 bg-blue-100',
  },
  {
    icon: Heart,
    title: 'Made with Love',
    description: 'Home-cooked meals prepared with the same care as for family',
    color: 'text-red-500 bg-red-100',
  },
  {
    icon: Leaf,
    title: 'Fresh Ingredients',
    description: 'Chefs use fresh, locally sourced ingredients daily',
    color: 'text-green-500 bg-green-100',
  },
  {
    icon: Clock,
    title: 'Daily Fresh Menu',
    description: 'New dishes every day - no frozen or pre-made food',
    color: 'text-orange-500 bg-orange-100',
  },
  {
    icon: Package,
    title: 'Steel Box Delivery',
    description: 'Eco-friendly steel containers that keep food fresh and hot',
    color: 'text-purple-500 bg-purple-100',
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: 'Not satisfied? Get a full refund, no questions asked',
    color: 'text-yellow-500 bg-yellow-100',
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading-2 mb-4">Why Choose GharKaKhana?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're not just another food delivery app. We're bringing back the 
            tradition of home-cooked meals with modern convenience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="card">
              <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Steel Box Section */}
        <div className="mt-16 bg-gradient-to-r from-primary-50 to-orange-50 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-4">
                <Package className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-medium text-gray-700">Eco-Friendly Packaging</span>
              </div>
              <h3 className="heading-3 mb-4">
                Steel Boxes for Freshness & Hygiene
              </h3>
              <p className="text-gray-600 mb-4">
                Unlike plastic containers, our stainless steel boxes keep your food 
                fresh and maintain temperature. Plus, they're reusable and eco-friendly!
              </p>
              <ul className="space-y-2">
                {[
                  'Food stays hot for longer',
                  'No plastic taste or chemicals',
                  'Easy to clean and return',
                  'Refundable deposit system',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-700">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                  <span className="text-8xl">🥘</span>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-primary-500 text-white px-4 py-2 rounded-xl shadow-lg">
                  ₹50 refundable deposit
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
