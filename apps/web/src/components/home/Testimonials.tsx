import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'Working Professional',
    image: '/testimonials/user1.jpg',
    rating: 5,
    text: "Finally found something that tastes like home! The biryani from Amma's Kitchen reminded me of my mother's cooking. Ordering every weekend now!",
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    role: 'IT Professional',
    image: '/testimonials/user2.jpg',
    rating: 5,
    text: "As a bachelor living alone, I was tired of restaurant food. GharKaKhana changed my life - now I get fresh, hygienic home food daily.",
  },
  {
    id: 3,
    name: 'Anita Reddy',
    role: 'Home Chef',
    image: '/testimonials/user3.jpg',
    rating: 5,
    text: "I started as a home chef 6 months ago. Now I earn ₹40,000/month cooking from my home. Best decision ever!",
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading-2 mb-4">What People Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of happy customers and home chefs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-2xl p-6 shadow-md relative">
              {/* Quote icon */}
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-white" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
