'use client'

import { useState, useEffect } from 'react'
import SimulatoreContent from './SimulatoreContent'
import SimulatoreAuth, { isSimulatoreAuthenticated } from './SimulatoreAuth'

export default function SimulatorePageClient() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Verifica se l'utente è già autenticato
    if (isSimulatoreAuthenticated()) {
      setAuthenticated(true)
    }
    setChecking(false)
  }, [])

  const handleAuthSuccess = () => {
    setAuthenticated(true)
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <SimulatoreAuth onSuccess={handleAuthSuccess} />
  }

  return <SimulatoreContent />
}

