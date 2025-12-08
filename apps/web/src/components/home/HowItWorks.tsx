import { Search, ChefHat, ShoppingBag, Utensils } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Search',
    description: 'Find home chefs near you or search for your favorite dish',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: ChefHat,
    title: 'Choose Chef',
    description: "Browse today's menu from verified home chefs in your area",
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: ShoppingBag,
    title: 'Place Order',
    description: 'Select items, choose delivery time, and pay securely',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Utensils,
    title: 'Enjoy!',
    description: 'Fresh home-cooked food delivered in hygienic steel boxes',
    color: 'bg-purple-100 text-purple-600',
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading-2 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Getting delicious home-cooked food is as easy as 1-2-3-4!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200" />
              )}
              
              <div className="relative bg-white rounded-2xl p-6 text-center">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mt-4 mb-4`}>
                  <step.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
