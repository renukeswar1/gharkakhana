import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'GharKaKhana - Home Cooked Food Delivery',
  description: 'Order fresh, hygienic home-cooked food from verified home chefs near you. Authentic taste, just like your mother makes!',
  keywords: ['home cooked food', 'home chef', 'food delivery', 'authentic food', 'hygienic food', 'tiffin service'],
  authors: [{ name: 'GharKaKhana' }],
  openGraph: {
    title: 'GharKaKhana - Home Cooked Food Delivery',
    description: 'Order fresh, hygienic home-cooked food from verified home chefs near you.',
    url: 'https://gharkakhana.com',
    siteName: 'GharKaKhana',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
