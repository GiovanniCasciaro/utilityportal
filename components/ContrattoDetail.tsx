'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadDocumento from './UploadDocumento'
import ListaDocumenti from './ListaDocumenti'

interface Contratto {
  id: string
  numero: string
  cliente: string
  clienteId: string
  tipo: string
  dataInizio: string
  dataScadenza: string
  importo: number
  stato: string
  note?: string
}

interface ContrattoDetailProps {
  contrattoId: string
}

export default function ContrattoDetail({ contrattoId }: ContrattoDetailProps) {
  const router = useRouter()
  const [contratto, setContratto] = useState<Contratto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/contratti')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.contratti.find((c: Contratto) => c.id === contrattoId)
          setContratto(found || null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [contrattoId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
        <p className="text-gray-500">Caricamento dati contratto...</p>
      </div>
    )
  }

  if (!contratto) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
        <p className="text-red-500">Contratto non trovato</p>
        <Link href="/contratti" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Torna alla lista contratti
        </Link>
      </div>
    )
  }

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'attivo': return 'bg-green-100 text-green-800'
      case 'scaduto': return 'bg-red-100 text-red-800'
      case 'in_scadenza': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dettaglio Contratto</h1>
          <p className="text-gray-600">Informazioni complete del contratto</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Numero Contratto</label>
            <p className="text-gray-900 mt-1 font-semibold">{contratto.numero}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Cliente</label>
            <p className="text-gray-900 mt-1">{contratto.cliente}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <p className="text-gray-900 mt-1">{contratto.tipo}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Importo Mensile</label>
            <p className="text-gray-900 mt-1 font-semibold">€{contratto.importo.toFixed(2)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Data Inizio</label>
            <p className="text-gray-900 mt-1">{new Date(contratto.dataInizio).toLocaleDateString('it-IT')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Data Scadenza</label>
            <p className="text-gray-900 mt-1">{new Date(contratto.dataScadenza).toLocaleDateString('it-IT')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Stato</label>
            <p className="mt-1">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatoColor(contratto.stato)}`}>
                {contratto.stato}
              </span>
            </p>
          </div>
          {contratto.note && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Note</label>
              <p className="text-gray-900 mt-1">{contratto.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Documenti Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Documenti</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UploadDocumento 
            contrattoId={contratto.id} 
            onUploadSuccess={() => window.location.reload()}
          />
          <ListaDocumenti contrattoId={contratto.id} />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Link
          href="/contratti"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Torna alla lista
        </Link>
        <Link
          href={`/contratti/${contratto.id}/edit`}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Modifica Contratto
        </Link>
      </div>
    </div>
  )
}


