'use client'

import { useState, useEffect } from 'react'

interface Agente {
  id: string
  email: string
  nome?: string
  attivo: number
  clientiCount: number
  contrattiCount: number
}

interface ReassignClienteModalProps {
  isOpen: boolean
  clienteNome: string
  clienteId: string
  currentUserId: string
  onConfirm: (nuovoAgenteId: string) => Promise<void>
  onCancel: () => void
}

export default function ReassignClienteModal({
  isOpen,
  clienteNome,
  clienteId,
  currentUserId,
  onConfirm,
  onCancel,
}: ReassignClienteModalProps) {
  const [agenti, setAgenti] = useState<Agente[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAgenteId, setSelectedAgenteId] = useState<string>('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAgenti()
    } else {
      setSelectedAgenteId('')
      setAgenti([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUserId])

  const loadAgenti = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agenti')
      const data = await res.json()
      if (data.success) {
        // Filtra l'agente corrente dalla lista
        const agentiFiltrati = data.agenti.filter((a: Agente) => a.id !== currentUserId)
        setAgenti(agentiFiltrati)
      }
    } catch (error) {
      console.error('Error loading agenti:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedAgenteId) {
      alert('Seleziona un agente')
      return
    }

    setConfirming(true)
    try {
      await onConfirm(selectedAgenteId)
    } finally {
      setConfirming(false)
    }
  }

  if (!isOpen) return null

  const selectedAgente = agenti.find(a => a.id === selectedAgenteId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />
      
      {/* Modale */}
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 z-50">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Assegna Cliente ad Altro Agente
        </h3>
        <p className="text-gray-600 mb-4">
          Stai per riassegnare il cliente <strong>"{clienteNome}"</strong> ad un altro agente.
        </p>
        
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ <strong>Azione irreversibile:</strong> Dopo la riassegnazione, non vedrai più questo cliente né i suoi contratti. Il nuovo agente diventerà il proprietario.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleziona il nuovo agente:
          </label>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Caricamento agenti...</p>
            </div>
          ) : agenti.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Nessun agente disponibile</p>
            </div>
          ) : (
            <select
              value={selectedAgenteId}
              onChange={(e) => setSelectedAgenteId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">-- Seleziona un agente --</option>
              {agenti.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nome || agente.email} ({agente.clientiCount} clienti)
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedAgente && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Il cliente verrà assegnato a: <strong>{selectedAgente.nome || selectedAgente.email}</strong>
            </p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAgenteId || confirming}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? 'Conferma in corso...' : 'Conferma Riassegnazione'}
          </button>
        </div>
      </div>
    </div>
  )
}

