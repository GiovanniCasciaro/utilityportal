'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from './ConfirmModal'
import ReassignClienteModal from './ReassignClienteModal'
import ImportExcelModal from './ImportExcelModal'

interface User {
  id: string
  email: string
  name?: string
  ruolo: 'punto_vendita' | 'agente'
  puntoVenditaId?: string
}

interface Cliente {
  id: string
  agenteId?: string
  agenteNome?: string
  ragioneSociale: string
  pec?: string
  nomePersonaFisica?: string
  piva?: string
  codiceDestinatario?: string
  nome: string
  cognome: string
  codiceFiscale: string
  email?: string
  cellulare?: string
  codiceAteco?: string
  modalitaPagamento?: string
  stato: 'attivo' | 'inattivo'
  dataRegistrazione: string
}

interface ClientiContentProps {
  user: User
}

export default function ClientiContent({ user }: ClientiContentProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStato, setFilterStato] = useState('tutti')
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; clienteId: string | null; clienteNome: string }>({
    isOpen: false,
    clienteId: null,
    clienteNome: '',
  })
  const [reassignModal, setReassignModal] = useState<{ isOpen: boolean; clienteId: string | null; clienteNome: string }>({
    isOpen: false,
    clienteId: null,
    clienteNome: '',
  })
  const [importModal, setImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    setImportModal(true)
  }

  const handleImportConfirm = () => {
    setImportModal(false)
    // Triggera il click sul file input
    fileInputRef.current?.click()
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/clienti/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.imported > 0) {
        let message = `✅ Import completato!\n\n${data.imported} clienti importati`
        if (data.totalRows) {
          message += ` su ${data.totalRows} righe totali`
        }
        if (data.errors && data.errors.length > 0) {
          message += `\n\n⚠️ ${data.errors.length} errori:`
          message += '\n' + data.errors.slice(0, 5).join('\n')
          if (data.errors.length > 5) {
            message += `\n... e altri ${data.errors.length - 5} errori`
          }
        }
        alert(message)
        loadClienti()
      } else {
        let errorMessage = data.message || 'Errore durante l\'import'
        if (data.errors && data.errors.length > 0) {
          errorMessage += '\n\nErrori trovati:\n' + data.errors.slice(0, 10).join('\n')
          if (data.errors.length > 10) {
            errorMessage += `\n... e altri ${data.errors.length - 10} errori`
          }
        }
        if (data.totalRows) {
          errorMessage += `\n\nRighe processate: ${data.totalRows}`
        }
        errorMessage += '\n\n📋 Formato Excel richiesto:\n- Nome (obbligatorio)\n- Cognome (obbligatorio)\n- Codice Fiscale (obbligatorio)\n- Email (opzionale)\n- Cellulare/Telefono (opzionale)\n- Ragione Sociale (opzionale)\n- P.IVA (opzionale)'
        alert(errorMessage)
      }
    } catch (error) {
      alert('Errore di connessione. Verifica che il file sia un Excel valido (.xlsx o .xls)')
    } finally {
      setImporting(false)
      e.target.value = '' // Reset input
    }
  }

  useEffect(() => {
    loadClienti()
  }, [searchTerm])

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

  const loadClienti = async () => {
    setLoading(true)
    try {
      const url = searchTerm 
        ? `/api/clienti?search=${encodeURIComponent(searchTerm)}`
        : '/api/clienti'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setClienti(data.clienti)
      }
    } catch (error) {
      console.error('Error loading clienti:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClienti = filterStato === 'tutti' 
    ? clienti 
    : clienti.filter(c => c.stato === filterStato)

  const handleView = (cliente: Cliente) => {
    router.push(`/clienti/${cliente.id}`)
  }

  const handleMenuToggle = (clienteId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === clienteId) {
      setOpenMenuId(null)
      setMenuPosition(null)
    } else {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      })
      setOpenMenuId(clienteId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Clienti</h1>
          <p className="text-gray-600">Gestisci i tuoi clienti e contatti</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Import in corso...' : 'Import Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
            disabled={importing}
          />
          <a
            href="/api/export/clienti?format=xlsx"
            className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg"
          >
            Export Excel
          </a>
          <Link
            href="/clienti/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            + Nuovo Cliente
          </Link>
        </div>
      </div>

      {/* Ricerca e Filtri */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 neon-search-container">
            <div className="outer-glow"></div>
            <input
              type="text"
              placeholder="Cerca per ragione sociale, nome, cognome, email, CF, P.IVA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder:text-gray-400 neon-search-input"
            />
          </div>
          <select
            value={filterStato}
            onChange={(e) => setFilterStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="attivo">Attivo</option>
            <option value="inattivo">Inattivo</option>
          </select>
        </div>
      </div>

      {/* Tabella Clienti */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Caricamento clienti...</p>
        </div>
      ) : filteredClienti.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Nessun cliente trovato</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ragione Sociale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome e Cognome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CF / P.IVA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatti</th>
                  {clienti[0]?.agenteNome && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agente</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClienti.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cliente.ragioneSociale}</div>
                      {cliente.codiceDestinatario && (
                        <div className="text-xs text-gray-500">CD: {cliente.codiceDestinatario}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cliente.nome} {cliente.cognome}</div>
                      {cliente.nomePersonaFisica && (
                        <div className="text-xs text-gray-500">PF: {cliente.nomePersonaFisica}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">CF: {cliente.codiceFiscale}</div>
                      {cliente.piva && (
                        <div className="text-xs text-gray-500">P.IVA: {cliente.piva}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cliente.email && (
                        <div className="text-sm text-gray-900">{cliente.email}</div>
                      )}
                      {cliente.cellulare && (
                        <div className="text-sm text-gray-500">{cliente.cellulare}</div>
                      )}
                      {cliente.pec && (
                        <div className="text-xs text-gray-500">PEC: {cliente.pec}</div>
                      )}
                    </td>
                    {cliente.agenteNome && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cliente.agenteNome}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cliente.stato === 'attivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cliente.stato}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative actions-menu">
                        <button
                          onClick={(e) => handleMenuToggle(cliente.id, e)}
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
            {filteredClienti.find(c => c.id === openMenuId) && (
              <>
                <button
                  onClick={() => {
                    const cliente = filteredClienti.find(c => c.id === openMenuId)!
                    handleView(cliente)
                    setOpenMenuId(null)
                    setMenuPosition(null)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Visualizza
                </button>
                <button
                  onClick={() => {
                    const cliente = filteredClienti.find(c => c.id === openMenuId)!
                    router.push(`/clienti/${cliente.id}/edit`)
                    setOpenMenuId(null)
                    setMenuPosition(null)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                >
                  Modifica
                </button>
                {user.ruolo === 'agente' && (
                  <button
                    onClick={() => {
                      const cliente = filteredClienti.find(c => c.id === openMenuId)!
                      setReassignModal({
                        isOpen: true,
                        clienteId: cliente.id,
                        clienteNome: cliente.ragioneSociale || `${cliente.nome} ${cliente.cognome}`,
                      })
                      setOpenMenuId(null)
                      setMenuPosition(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    Assegna ad altro agente
                  </button>
                )}
                <button
                  onClick={() => {
                    const cliente = filteredClienti.find(c => c.id === openMenuId)!
                    setDeleteModal({
                      isOpen: true,
                      clienteId: cliente.id,
                      clienteNome: cliente.ragioneSociale || `${cliente.nome} ${cliente.cognome}`,
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
        title="Elimina Cliente"
        message={`Sei sicuro di voler eliminare il cliente "${deleteModal.clienteNome}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={async () => {
          if (!deleteModal.clienteId) return

          try {
            const response = await fetch(`/api/clienti/${deleteModal.clienteId}`, {
              method: 'DELETE',
            })

            const data = await response.json()

            if (response.ok) {
              setClienti(clienti.filter(c => c.id !== deleteModal.clienteId))
              setDeleteModal({ isOpen: false, clienteId: null, clienteNome: '' })
            } else {
              alert(data.message || 'Errore durante l\'eliminazione')
            }
          } catch (error) {
            alert('Errore di connessione')
          }
        }}
        onCancel={() => setDeleteModal({ isOpen: false, clienteId: null, clienteNome: '' })}
      />

      {/* Modale Riassegnazione Cliente */}
      <ReassignClienteModal
        isOpen={reassignModal.isOpen}
        clienteNome={reassignModal.clienteNome}
        clienteId={reassignModal.clienteId || ''}
        currentUserId={user.id}
        onConfirm={async (nuovoAgenteId: string) => {
          if (!reassignModal.clienteId) return

          try {
            const response = await fetch(`/api/clienti/${reassignModal.clienteId}/reassign`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ nuovoAgenteId }),
            })

            const data = await response.json()

            if (response.ok) {
              // Rimuovi il cliente dalla lista (non sarà più visibile all'agente corrente)
              setClienti(clienti.filter(c => c.id !== reassignModal.clienteId))
              setReassignModal({ isOpen: false, clienteId: null, clienteNome: '' })
              alert('Cliente riassegnato con successo')
            } else {
              alert(data.message || 'Errore durante la riassegnazione')
            }
          } catch (error) {
            alert('Errore di connessione')
          }
        }}
        onCancel={() => setReassignModal({ isOpen: false, clienteId: null, clienteNome: '' })}
      />

      {/* Modale Import Excel */}
      <ImportExcelModal
        isOpen={importModal}
        onConfirm={handleImportConfirm}
        onCancel={() => setImportModal(false)}
      />
    </div>
  )
}
