'use client'

import { useState, FormEvent } from 'react'

interface SimulatoreAuthProps {
  onSuccess: () => void
}

const SIMULATOR_TOKEN = 'Pinetaismylife'
const STORAGE_KEY = 'simulatore_authenticated'
const LOGIN_SESSION_KEY = 'login_session_id'

// Ottieni o crea un ID di sessione di login
function getLoginSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = localStorage.getItem(LOGIN_SESSION_KEY)
  if (!sessionId) {
    // Crea un nuovo ID di sessione
    sessionId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(LOGIN_SESSION_KEY, sessionId)
  }
  return sessionId
}

// Resetta l'autenticazione del simulatore (chiamato al logout)
export function resetSimulatoreAuth() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export default function SimulatoreAuth({ onSuccess }: SimulatoreAuthProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showError, setShowError] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setShowError(false)
    setLoading(true)

    // Simula un piccolo delay per UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (token.trim() === SIMULATOR_TOKEN) {
      // Token corretto - salva nello storage con l'ID di sessione di login
      if (typeof window !== 'undefined') {
        const loginSessionId = getLoginSessionId()
        sessionStorage.setItem(STORAGE_KEY, loginSessionId)
      }
      onSuccess()
    } else {
      // Token errato
      setError('Token di accesso non valido. Riprova.')
      setShowError(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-100">
          {/* Icona e Titolo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accesso Simulatore
            </h2>
            <p className="text-gray-600">
              Inserisci il token di accesso per utilizzare il simulatore
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Token di Accesso
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  setError('')
                  setShowError(false)
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="Inserisci il token"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Verifica in corso...' : 'Accedi'}
            </button>
          </form>

          {/* Messaggio Premium */}
          {showError && (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-gray-700">
                  <strong className="text-gray-900">Il tuo Punto Vendita non ha i diritti per accedere al simulatore.</strong>
                  <br />
                  Passa a <strong>Utily Portal Premium</strong>, o contattaci personalmente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Funzione helper per verificare se l'utente è autenticato
export function isSimulatoreAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  const storedAuth = sessionStorage.getItem(STORAGE_KEY)
  const loginSessionId = getLoginSessionId()
  
  // Verifica che l'autenticazione del simulatore corrisponda alla sessione di login corrente
  return storedAuth === loginSessionId && storedAuth !== null
}

