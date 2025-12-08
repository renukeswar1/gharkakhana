'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChefRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1 - Basic Info
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Step 2 - Kitchen Details
    businessName: '',
    bio: '',
    cuisines: [] as string[],
    specialties: '',
    // Step 3 - Location
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    serviceRadius: 5,
    // Step 4 - Verification
    aadhaarNumber: '',
    panNumber: '',
    fssaiNumber: '',
    agreedToTerms: false,
  })

  const cuisineOptions = [
    'North Indian', 'South Indian', 'Bengali', 'Gujarati', 'Maharashtrian',
    'Punjabi', 'Rajasthani', 'Hyderabadi', 'Kerala', 'Tamil', 'Mughlai',
    'Street Food', 'Continental', 'Chinese', 'Healthy/Diet'
  ]

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine]
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // API call to register chef
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
      router.push('/chef/verification-pending')
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.email && formData.phone && 
               formData.password && formData.password === formData.confirmPassword
      case 2:
        return formData.businessName && formData.cuisines.length > 0
      case 3:
        return formData.addressLine1 && formData.city && formData.state && formData.pincode
      case 4:
        return formData.aadhaarNumber && formData.agreedToTerms
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-orange-600">
            🍲 GharKaKhana
          </Link>
          <h1 className="text-3xl font-bold mt-4">Become a Home Chef</h1>
          <p className="text-gray-600 mt-2">
            Share your cooking passion and earn from home
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Kitchen Details' },
            { num: 3, label: 'Location' },
            { num: 4, label: 'Verification' },
          ].map(({ num, label }) => (
            <div key={num} className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= num 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > num ? '✓' : num}
              </div>
              <span className={`text-xs mt-2 ${step >= num ? 'text-orange-600' : 'text-gray-500'}`}>
                {label}
              </span>
              {num < 4 && (
                <div className={`flex-1 h-1 w-full mx-2 mt-5 -translate-y-7 ${
                  step > num ? 'bg-orange-600' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="flex">
                  <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Create a strong password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Confirm your password"
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Kitchen Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Kitchen Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen/Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateFormData('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Priya's Kitchen, Maa Ka Khana"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Your Kitchen</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                  placeholder="Tell customers about your cooking journey, specialty, and what makes your food special..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cuisines You Specialize In *</label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        formData.cuisines.includes(cuisine)
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Signature Dishes</label>
                <input
                  type="text"
                  value={formData.specialties}
                  onChange={(e) => updateFormData('specialties', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Dal Makhani, Biryani, Dosa (comma separated)"
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Kitchen Location</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => updateFormData('addressLine1', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="House/Flat No., Building Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => updateFormData('addressLine2', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Street, Landmark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => updateFormData('pincode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="400001"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km)</label>
                  <select
                    value={formData.serviceRadius}
                    onChange={(e) => updateFormData('serviceRadius', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {[3, 5, 7, 10, 15, 20].map((km) => (
                      <option key={km} value={km}>{km} km</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use My Current Location
              </button>
            </div>
          )}

          {/* Step 4: Verification */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Verification Documents</h2>
              <p className="text-gray-600 text-sm">
                These documents help us verify your identity and ensure food safety compliance.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number *</label>
                <input
                  type="text"
                  value={formData.aadhaarNumber}
                  onChange={(e) => updateFormData('aadhaarNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number (Optional)</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => updateFormData('panNumber', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FSSAI License Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.fssaiNumber}
                  onChange={(e) => updateFormData('fssaiNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="If you have one"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Don't have FSSAI? No problem! We'll help you get one.
                </p>
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Upload Documents</label>
                
                {[
                  { name: 'Aadhaar Card', required: true },
                  { name: 'Kitchen Photos (3-5)', required: true },
                  { name: 'Cooking Video (Optional)', required: false },
                ].map((doc) => (
                  <div 
                    key={doc.name}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.required ? 'Required' : 'Optional'} • Max 10MB
                          </p>
                        </div>
                      </div>
                      <button className="text-orange-600 text-sm font-medium">
                        Upload
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => updateFormData('agreedToTerms', e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-orange-600 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link>
                  . I confirm that I will maintain food hygiene standards and provide accurate information.
                </span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '💰', title: 'Earn Extra', desc: 'Make money from your cooking skills' },
            { icon: '🏠', title: 'Work from Home', desc: 'No commute, flexible hours' },
            { icon: '❤️', title: 'Share Love', desc: 'Feed people with your recipes' },
          ].map((benefit) => (
            <div key={benefit.title} className="bg-white/80 rounded-lg p-4">
              <div className="text-2xl mb-2">{benefit.icon}</div>
              <h3 className="font-semibold text-sm">{benefit.title}</h3>
              <p className="text-xs text-gray-600">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
