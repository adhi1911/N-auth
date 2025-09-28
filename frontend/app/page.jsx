'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AUTH_CONFIG } from "@/config"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1724] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1B2B4B] border-t-[#4B9EFD]"></div>
        </div>
      </div>
    )
  }

  const steps = [
    { 
      title: "New Device Login", 
      desc: `User attempts login from device # ${AUTH_CONFIG.MAX_N}`, 
      color: "bg-[#4B9EFD]",
      icon: "📱"
    },
    { 
      title: "Session Validation", 
      desc: "System checks active sessions (3/3)", 
      color: "bg-[#3B8EEE]",
      icon: "🔍"
    },
    { 
      title: "Limit Check", 
      desc: "Device limit reached (MAX: 3)", 
      color: "bg-[#FF4E64]",
      icon: "⚠️"
    },
    { 
      title: "Access Denied", 
      desc: "Login blocked, show active devices", 
      color: "bg-[#FF4E64]",
      icon: "🚫"
    }
  ]

  return (
    <div className="min-h-screen bg-[#0F1724]">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#131B2E] to-[#0F1724] pointer-events-none"></div>

      <main className="relative container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-[#1B2B4B] border border-[#2C3B5B] rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-[#4B9EFD] rounded-full animate-pulse"></div>
              <span className="text-[#94A3B8] text-sm">Live Demo</span>
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">
              N-Device <span className="text-[#4B9EFD]">Login</span>
            </h1>
            <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-8">
              Secure multi-device authentication system with concurrent session limits
            </p>
          </div>

          {/* Interactive Flow */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
            <div className="relative bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-2xl p-8 backdrop-blur-sm">
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-[#2C3B5B]"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                {steps.map((step, idx) => (
                  <div key={idx} className="text-center relative">
                    <div className={`
                      relative mx-auto w-16 h-16 rounded-full border-4 transition-all duration-500 flex items-center justify-center text-2xl
                      ${activeStep >= idx 
                        ? `${step.color} border-transparent shadow-lg` 
                        : 'bg-[#2C3B5B] border-[#1B2B4B]'
                      }
                    `}>
                      <span className={activeStep >= idx ? 'filter-none' : 'grayscale opacity-50'}>
                        {step.icon}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className={`font-semibold transition-colors duration-300 ${
                        activeStep >= idx ? 'text-white' : 'text-[#94A3B8]'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm mt-1 transition-colors duration-300 ${
                        activeStep >= idx ? 'text-[#94A3B8]' : 'text-[#4A5568]'
                      }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: "🔐",
                title: "Secure Authentication",
                desc: "Multi-factor device verification"
              },
              {
                icon: "⚡",
                title: "Real-time Control",
                desc: "Instant session management"
              },
              {
                icon: "🚫",
                title: "Access Limits",
                desc: "Configurable device restrictions"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-xl p-6 backdrop-blur-sm hover:bg-[#1B2B4B]/70 transition-all duration-300">
                <div className="w-12 h-12 bg-[#2C3B5B] rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#94A3B8] text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-2xl p-8 backdrop-blur-sm mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Try it Now</h2>
              <p className="text-[#94A3B8] mb-6 max-w-2xl mx-auto">
                Experience secure multi-device login management in action.
              </p>
              <div className="inline-flex items-center space-x-2 text-sm text-[#94A3B8]">
                <div className="w-2 h-2 bg-[#4B9EFD] rounded-full"></div>
                <span>Maximum 3 concurrent devices</span>
              </div>
            </div>

            <a 
              href="https://github.com/adhi1911/N_device_login" 
              className="inline-flex items-center space-x-2 text-[#94A3B8] hover:text-white transition-all duration-300 group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>View Source Code</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}