'use client'

import { useState, useEffect } from 'react'

interface Agente {
  id: string
  email: string
  nome: string
  attivo: number
  clientiCount: number
  contrattiCount: number
}

export default function AgentiContent() {
  const [agenti, setAgenti] = useState<Agente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agenti')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAgenti(data.agenti)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Agenti</h1>
        <p className="text-gray-600">Overview dei tuoi agenti e delle loro attività</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Caricamento agenti...</p>
        </div>
      ) : agenti.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Nessun agente trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agenti.map((agente) => (
            <div key={agente.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{agente.nome || 'N/A'}</h3>
                  <p className="text-sm text-gray-500">{agente.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  agente.attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {agente.attivo ? 'Attivo' : 'Inattivo'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Clienti</p>
                  <p className="text-2xl font-bold text-gray-900">{agente.clientiCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contratti</p>
                  <p className="text-2xl font-bold text-gray-900">{agente.contrattiCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


