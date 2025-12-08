import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🍛</span>
              <span className="text-xl font-bold font-display text-white">
                GharKaKhana
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Connecting you with verified home chefs for authentic, 
              hygienic home-cooked meals.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-sm hover:text-white transition-colors">
                  Find Food
                </Link>
              </li>
              <li>
                <Link href="/chefs" className="text-sm hover:text-white transition-colors">
                  Browse Chefs
                </Link>
              </li>
              <li>
                <Link href="/become-chef" className="text-sm hover:text-white transition-colors">
                  Become a Chef
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-sm hover:text-white transition-colors">
                  Food Safety
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-500" />
                <a href="mailto:support@gharkakhana.com" className="text-sm hover:text-white transition-colors">
                  support@gharkakhana.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-500" />
                <a href="tel:+911234567890" className="text-sm hover:text-white transition-colors">
                  +91 1234 567 890
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="text-white text-sm font-semibold mb-2">Download App</h4>
              <div className="flex gap-2">
                <a href="#" className="block">
                  <img 
                    src="/app-store.svg" 
                    alt="App Store" 
                    className="h-10"
                  />
                </a>
                <a href="#" className="block">
                  <img 
                    src="/play-store.svg" 
                    alt="Play Store" 
                    className="h-10"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2024 GharKaKhana. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund" className="text-sm text-gray-400 hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
