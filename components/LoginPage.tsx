'use client'

import { useState, FormEvent, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [particleCount, setParticleCount] = useState(20)
  const router = useRouter()

  useEffect(() => {
    // Riduci il numero di particelle su dispositivi mobili per migliorare le performance
    const updateParticleCount = () => {
      setParticleCount(window.innerWidth < 768 ? 10 : 20)
    }
    
    updateParticleCount()
    window.addEventListener('resize', updateParticleCount)
    
    return () => window.removeEventListener('resize', updateParticleCount)
  }, [])

  // Memorizza le proprietà delle particelle per evitare che cambino ad ogni render
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      // Usa un seed basato sull'indice per avere valori consistenti
      const seed = i * 0.618033988749895 // Golden ratio per distribuzione uniforme
      const random1 = (Math.sin(seed * 100) + 1) / 2
      const random2 = (Math.sin(seed * 200) + 1) / 2
      const random3 = (Math.sin(seed * 300) + 1) / 2
      const random4 = (Math.sin(seed * 400) + 1) / 2
      const random5 = (Math.sin(seed * 500) + 1) / 2
      
      return {
        width: random1 * 100 + 20,
        height: random2 * 100 + 20,
        left: random3 * 100,
        top: random4 * 100,
        duration: 15 + random5 * 10,
        delay: random1 * 5,
      }
    })
  }, [particleCount])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json()

      if (response.ok) {
        // Resetta l'ID di sessione di login per invalidare l'autenticazione del simulatore
        if (typeof window !== 'undefined') {
          localStorage.removeItem('login_session_id')
          // Rimuovi anche l'autenticazione del simulatore se presente
          sessionStorage.removeItem('simulatore_authenticated')
        }
        router.push('/dashboard')
      } else {
        setError(data.message || 'Credenziali non valide')
      }
    } catch (err) {
      setError('Errore di connessione. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30"
              style={{
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animation: `float ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }}></div>
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 -top-40 -bottom-40 bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12 animate-shimmer"></div>
        </div>

        {/* Animated Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5">
                <animate attributeName="stop-opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5">
                <animate attributeName="stop-opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" begin="1s" />
              </stop>
            </linearGradient>
          </defs>
          <path
            d="M0,200 Q400,100 800,200 T1600,200"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M0,400 Q400,300 800,400 T1600,400"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-6 border border-white/20 transition-all duration-300 hover:shadow-3xl hover:bg-white/95">
          {/* Logo/Titolo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              Utily Portal
            </h1>
            <p className="text-gray-600 text-lg">Benvenuto!</p>
          </div>

          {/* Form di Login */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="inserisci@mail.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Ricordami</span>
              </label>

              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Password dimenticata?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Accesso in corso...' : 'Login'}
            </button>
          </form>

          {/* Piè di pagina */}
          <div className="pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Copyright © {new Date().getFullYear()} Utily Portal - Realizzato da Utily Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


