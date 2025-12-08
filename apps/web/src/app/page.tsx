import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, ChefHat, Star, Shield, Clock, Leaf } from 'lucide-react'
import { HeroSection } from '@/components/home/HeroSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { FeaturedChefs } from '@/components/home/FeaturedChefs'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { BecomeChef } from '@/components/home/BecomeChef'
import { Testimonials } from '@/components/home/Testimonials'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Featured Chefs */}
      <FeaturedChefs />
      
      {/* Why Choose Us */}
      <WhyChooseUs />
      
      {/* Become a Chef CTA */}
      <BecomeChef />
      
      {/* Testimonials */}
      <Testimonials />
    </div>
  )
}
