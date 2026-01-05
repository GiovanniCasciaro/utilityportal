'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from './ConfirmModal'

interface Contratto {
  id: string
  numero: string
  cliente: string
  tipo: string
  dataInizio: string
  dataScadenza: string
  importo: number
  stato: 'attivo' | 'scaduto' | 'in_scadenza'
}

export default function ContrattiContent() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [contratti, setContratti] = useState<Contratto[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contrattoId: string | null; contrattoNumero: string }>({
    isOpen: false,
    contrattoId: null,
    contrattoNumero: '',
  })
  const [importing, setImporting] = useState(false)

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contratti/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Import completato! ${data.imported || 0} contratti importati.`)
        loadContratti()
      } else {
        alert(data.message || 'Errore durante l\'import')
      }
    } catch (error) {
      alert('Errore di connessione')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const loadContratti = () => {
    setLoading(true)
    fetch('/api/contratti')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setContratti(data.contratti)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadContratti()
    
    // Aggiorna ogni 5 secondi per catturare nuovi contratti
    const interval = setInterval(loadContratti, 5000)
    return () => clearInterval(interval)
  }, [])

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.actions-menu') && !(event.target as Element).closest('.actions-menu-overlay')) {
        setOpenMenuId(null)
        setMenuPosition(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const filteredContratti = contratti.filter(contratto =>
    `${contratto.numero} ${contratto.cliente} ${contratto.tipo}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'attivo': return 'bg-green-100 text-green-800'
      case 'scaduto': return 'bg-red-100 text-red-800'
      case 'in_scadenza': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case 'attivo': return 'Attivo'
      case 'scaduto': return 'Scaduto'
      case 'in_scadenza': return 'In Scadenza'
      default: return stato
    }
  }

  const handleMenuToggle = (contrattoId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === contrattoId) {
      setOpenMenuId(null)
      setMenuPosition(null)
    } else {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      })
      setOpenMenuId(contrattoId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Contratti</h1>
          <p className="text-gray-600">Gestisci tutti i contratti TLC</p>
        </div>
        <div className="flex gap-3">
          <label className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />
            Import Excel
          </label>
          <Link
            href="/contratti/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            + Nuovo Contratto
          </Link>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Totale Contratti</div>
          <div className="text-2xl font-bold text-gray-900">{contratti.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Attivi</div>
          <div className="text-2xl font-bold text-green-600">{contratti.filter(c => c.stato === 'attivo').length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">In Scadenza</div>
          <div className="text-2xl font-bold text-yellow-600">{contratti.filter(c => c.stato === 'in_scadenza').length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Fatturato Mensile</div>
          <div className="text-2xl font-bold text-purple-600">€{contratti.reduce((sum, c) => sum + c.importo, 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Ricerca */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="neon-search-container">
          <div className="outer-glow"></div>
          <input
            type="text"
            placeholder="Cerca per numero, cliente, tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder:text-gray-400 neon-search-input"
          />
        </div>
      </div>

      {/* Tabella Contratti */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Caricamento contratti...</p>
        </div>
      ) : filteredContratti.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Nessun contratto trovato</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContratti.map((contratto) => (
                <tr key={contratto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contratto.numero}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contratto.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contratto.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contratto.dataInizio).toLocaleDateString('it-IT')} - {new Date(contratto.dataScadenza).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    €{contratto.importo.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatoColor(contratto.stato)}`}>
                      {getStatoLabel(contratto.stato)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative actions-menu">
                      <button
                        onClick={(e) => handleMenuToggle(contratto.id, e)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Menu azioni"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Menu Overlay */}
      {openMenuId && menuPosition && (
        <div 
          className="fixed actions-menu-overlay z-50"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          <div className="w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
            {filteredContratti.find(c => c.id === openMenuId) && (
              <>
                <Link
                  href={`/contratti/${openMenuId}`}
                  onClick={() => {
                    setOpenMenuId(null)
                    setMenuPosition(null)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Visualizza
                </Link>
                <button
                  onClick={() => {
                    router.push(`/contratti/${openMenuId}/edit`)
                    setOpenMenuId(null)
                    setMenuPosition(null)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                >
                  Modifica
                </button>
                <button
                  onClick={() => {
                    const contratto = filteredContratti.find(c => c.id === openMenuId)!
                    setDeleteModal({
                      isOpen: true,
                      contrattoId: contratto.id,
                      contrattoNumero: contratto.numero,
                    })
                    setOpenMenuId(null)
                    setMenuPosition(null)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Elimina
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modale Conferma Eliminazione */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Elimina Contratto"
        message={`Sei sicuro di voler eliminare il contratto "${deleteModal.contrattoNumero}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={async () => {
          if (!deleteModal.contrattoId) return

          try {
            const response = await fetch(`/api/contratti/${deleteModal.contrattoId}`, {
              method: 'DELETE',
            })

            const data = await response.json()

            if (response.ok) {
              setContratti(contratti.filter(c => c.id !== deleteModal.contrattoId))
              setDeleteModal({ isOpen: false, contrattoId: null, contrattoNumero: '' })
              loadContratti() // Refresh the list
            } else {
              alert(data.message || 'Errore durante l\'eliminazione')
            }
          } catch (error) {
            alert('Errore di connessione')
          }
        }}
        onCancel={() => setDeleteModal({ isOpen: false, contrattoId: null, contrattoNumero: '' })}
      />
    </div>
  )
}

