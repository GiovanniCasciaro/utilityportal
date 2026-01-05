'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadDocumento from './UploadDocumento'
import ListaDocumenti from './ListaDocumenti'

interface Referente {
  id: string
  clienteId: string
  cognome: string
  nome: string
  cellulare?: string
}

interface Fornitura {
  id: string
  clienteId: string
  podPdr?: string
  indirizzoFornitura?: string
  consumoAnnuale?: number
  tipologiaContratto: string
  stato: string
  prestazione?: string
  fornitore?: string
  offerta?: string
  prezzo?: number
  ccv?: string
  scadenza?: string
  compenso?: number
  commissione?: number
  operatore?: string
  nrPratica?: string
  linkPortale?: string
  checkPagamento?: number | boolean
  checkStorno?: number | boolean
  esitoContratto?: string
  tipologia?: string
  note?: string
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
  indirizzoResidenza?: string
  iban?: string
}

interface ClienteAnagraficaProps {
  clienteId: string
}

export default function ClienteAnagrafica({ clienteId }: ClienteAnagraficaProps) {
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [referenti, setReferenti] = useState<Referente[]>([])
  const [forniture, setForniture] = useState<Fornitura[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'anagrafica' | 'forniture'>('anagrafica')
  
  // Stati per aggiungere referente
  const [showAddReferente, setShowAddReferente] = useState(false)
  const [newReferente, setNewReferente] = useState({ cognome: '', nome: '', cellulare: '' })
  const [addingReferente, setAddingReferente] = useState(false)

  // Stati per aggiungere fornitura
  const [showAddFornitura, setShowAddFornitura] = useState(false)
  const [newFornitura, setNewFornitura] = useState({
    podPdr: '',
    indirizzoFornitura: '',
    consumoAnnuale: '',
    tipologiaContratto: 'Residenziale',
    stato: 'Attivo',
    prestazione: '',
    fornitore: '',
    offerta: '',
    prezzo: '',
    ccv: '',
    scadenza: '',
    compenso: '',
    commissione: '',
    operatore: '',
    nrPratica: '',
    linkPortale: '',
    checkPagamento: false,
    checkStorno: false,
    esitoContratto: '',
    tipologia: '',
    note: ''
  })
  const [addingFornitura, setAddingFornitura] = useState(false)
  const [editingFornitura, setEditingFornitura] = useState<Fornitura | null>(null)

  useEffect(() => {
    loadData()
  }, [clienteId])

  const loadData = async () => {
      try {
        const res = await fetch(`/api/clienti/${clienteId}`)
        const data = await res.json()
        if (data.success) {
          setCliente(data.cliente)
        setReferenti(data.referenti || [])
        setForniture(data.forniture || [])
        } else {
          console.error('Error loading cliente:', data.message)
        }
      } catch (error) {
        console.error('Error fetching cliente:', error)
      } finally {
        setLoading(false)
      }
    }

  const handleAddReferente = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingReferente(true)
    try {
      const res = await fetch(`/api/clienti/${clienteId}/referenti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReferente),
      })
      const data = await res.json()
      if (data.success) {
        setReferenti([...referenti, data.referente])
        setNewReferente({ cognome: '', nome: '', cellulare: '' })
        setShowAddReferente(false)
      } else {
        alert(data.message || 'Errore durante l\'aggiunta del referente')
      }
    } catch (error) {
      alert('Errore di connessione')
    } finally {
      setAddingReferente(false)
    }
  }

  const handleDeleteReferente = async (referenteId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo referente?')) return
    
    try {
      const res = await fetch(`/api/clienti/${clienteId}/referenti/${referenteId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setReferenti(referenti.filter(r => r.id !== referenteId))
      } else {
        alert(data.message || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      alert('Errore di connessione')
    }
  }

  const handleAddFornitura = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingFornitura(true)
    try {
      const url = editingFornitura
        ? `/api/clienti/${clienteId}/forniture/${editingFornitura.id}`
        : `/api/clienti/${clienteId}/forniture`
      const method = editingFornitura ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFornitura,
          consumoAnnuale: newFornitura.consumoAnnuale ? parseFloat(newFornitura.consumoAnnuale) : null,
          prezzo: newFornitura.prezzo ? parseFloat(newFornitura.prezzo) : null,
          compenso: newFornitura.compenso ? parseFloat(newFornitura.compenso) : null,
          commissione: newFornitura.commissione ? parseFloat(newFornitura.commissione) : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (editingFornitura) {
          setForniture(forniture.map(f => f.id === editingFornitura.id ? data.fornitura : f))
        } else {
          setForniture([...forniture, data.fornitura])
        }
        setNewFornitura({
          podPdr: '',
          indirizzoFornitura: '',
          consumoAnnuale: '',
          tipologiaContratto: 'Residenziale',
          stato: 'Attivo',
          prestazione: '',
          fornitore: '',
          offerta: '',
          prezzo: '',
          ccv: '',
          scadenza: '',
          compenso: '',
          commissione: '',
          operatore: '',
          nrPratica: '',
          linkPortale: '',
          checkPagamento: false,
          checkStorno: false,
          esitoContratto: '',
          tipologia: '',
          note: ''
        })
        setShowAddFornitura(false)
        setEditingFornitura(null)
      } else {
        alert(data.message || 'Errore durante l\'operazione')
      }
    } catch (error) {
      alert('Errore di connessione')
    } finally {
      setAddingFornitura(false)
    }
  }

  const handleEditFornitura = (fornitura: Fornitura) => {
    setEditingFornitura(fornitura)
    setNewFornitura({
      podPdr: fornitura.podPdr || '',
      indirizzoFornitura: fornitura.indirizzoFornitura || '',
      consumoAnnuale: fornitura.consumoAnnuale?.toString() || '',
      tipologiaContratto: fornitura.tipologiaContratto || 'Residenziale',
      stato: fornitura.stato || 'Attivo',
      prestazione: fornitura.prestazione || '',
      fornitore: fornitura.fornitore || '',
      offerta: fornitura.offerta || '',
      prezzo: fornitura.prezzo?.toString() || '',
      ccv: fornitura.ccv || '',
      scadenza: fornitura.scadenza || '',
      compenso: fornitura.compenso?.toString() || '',
      commissione: fornitura.commissione?.toString() || '',
      operatore: fornitura.operatore || '',
      nrPratica: fornitura.nrPratica || '',
      linkPortale: fornitura.linkPortale || '',
      checkPagamento: !!fornitura.checkPagamento,
      checkStorno: !!fornitura.checkStorno,
      esitoContratto: fornitura.esitoContratto || '',
      tipologia: fornitura.tipologia || '',
      note: fornitura.note || ''
    })
    setShowAddFornitura(true)
  }

  const handleDeleteFornitura = async (fornituraId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa fornitura?')) return
    
    try {
      const res = await fetch(`/api/clienti/${clienteId}/forniture/${fornituraId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setForniture(forniture.filter(f => f.id !== fornituraId))
      } else {
        alert(data.message || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      alert('Errore di connessione')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
        <p className="text-gray-500">Caricamento dati cliente...</p>
      </div>
    )
  }

  if (!cliente && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cliente non trovato</h2>
          <p className="text-gray-600 mb-6">Il cliente richiesto non esiste o non hai i permessi per visualizzarlo.</p>
          <Link 
            href="/clienti" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla lista clienti
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dettagli Anagrafica Cliente</h1>
          <p className="text-gray-600">Gestione completa dei dati cliente</p>
        </div>
        <Link
          href="/clienti"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Torna alla lista
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('anagrafica')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'anagrafica'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheda 1 - Dati Anagrafici
          </button>
          <button
            onClick={() => setActiveTab('forniture')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'forniture'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheda 2 - Forniture
          </button>
        </nav>
      </div>

      {/* Scheda 1 - Dati Anagrafici */}
      {activeTab === 'anagrafica' && (
        <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dati Anagrafici</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                <p className="text-gray-900">{cliente.cognome}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <p className="text-gray-900">{cliente.nome}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                <p className="text-gray-900 font-mono">{cliente.codiceFiscale}</p>
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cellulare</label>
                <p className="text-gray-900">
                  {cliente.cellulare ? (
                    <a href={`tel:${cliente.cellulare}`} className="text-blue-600 hover:text-blue-800">
                      {cliente.cellulare}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Non specificato</span>
                  )}
                </p>
        </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <p className="text-gray-900">
                {cliente.email ? (
                  <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:text-blue-800">
                    {cliente.email}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Non specificata</span>
                )}
              </p>
            </div>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo di Residenza</label>
                <p className="text-gray-900">
                  {cliente.indirizzoResidenza || <span className="text-gray-400 italic">Non specificato</span>}
              </p>
            </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <p className="text-gray-900 font-mono">
                  {cliente.iban || <span className="text-gray-400 italic">Non specificato</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Referenti */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Referenti</h2>
              {!showAddReferente && (
                <button
                  onClick={() => setShowAddReferente(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  + Aggiungi Referente
                </button>
              )}
        </div>

            {showAddReferente && (
              <form onSubmit={handleAddReferente} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                    <input
                      type="text"
                      value={newReferente.cognome}
                      onChange={(e) => setNewReferente({ ...newReferente, cognome: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={newReferente.nome}
                      onChange={(e) => setNewReferente({ ...newReferente, nome: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cellulare</label>
                    <input
                      type="tel"
                      value={newReferente.cellulare}
                      onChange={(e) => setNewReferente({ ...newReferente, cellulare: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={addingReferente}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {addingReferente ? 'Salvataggio...' : 'Salva'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddReferente(false)
                      setNewReferente({ cognome: '', nome: '', cellulare: '' })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annulla
                  </button>
              </div>
              </form>
            )}

            {referenti.length === 0 ? (
              <p className="text-gray-500 italic">Nessun referente aggiunto</p>
            ) : (
              <div className="space-y-3">
                {referenti.map((referente) => (
                  <div key={referente.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
                      <p className="font-medium text-gray-900">{referente.cognome} {referente.nome}</p>
                      {referente.cellulare && (
                        <p className="text-sm text-gray-600">
                          <a href={`tel:${referente.cellulare}`} className="text-blue-600 hover:text-blue-800">
                            {referente.cellulare}
                          </a>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReferente(referente.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      Elimina
                    </button>
            </div>
                ))}
              </div>
            )}
          </div>

          {/* Documenti di Identità */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Allegato Documento di Identità</h2>
            <p className="text-sm text-gray-600 mb-4">Puoi allegare più file (PDF, immagini)</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UploadDocumento 
                clienteId={cliente.id} 
                categoria="Documento Identità"
                onUploadSuccess={loadData}
              />
              <ListaDocumenti clienteId={cliente.id} categoria="Documento Identità" />
            </div>
          </div>
        </div>
      )}

      {/* Scheda 2 - Forniture */}
      {activeTab === 'forniture' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Forniture</h2>
              {!showAddFornitura && (
                <button
                  onClick={() => {
                    setShowAddFornitura(true)
                    setEditingFornitura(null)
                    setNewFornitura({
                      podPdr: '',
                      indirizzoFornitura: '',
                      consumoAnnuale: '',
                      tipologiaContratto: 'Residenziale',
                      stato: 'Attivo',
                      prestazione: '',
                      fornitore: '',
                      offerta: '',
                      prezzo: '',
                      ccv: '',
                      scadenza: '',
                      compenso: '',
                      commissione: '',
                      operatore: '',
                      nrPratica: '',
                      linkPortale: '',
                      checkPagamento: false,
                      checkStorno: false,
                      esitoContratto: '',
                      tipologia: '',
                      note: ''
                    })
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Aggiungi Fornitura
                </button>
              )}
      </div>

            {showAddFornitura && (
              <form onSubmit={handleAddFornitura} className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingFornitura ? 'Modifica Fornitura' : 'Nuova Fornitura'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">POD/PDR</label>
                    <input
                      type="text"
                      value={newFornitura.podPdr}
                      onChange={(e) => setNewFornitura({ ...newFornitura, podPdr: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Fornitura</label>
                    <input
                      type="text"
                      value={newFornitura.indirizzoFornitura}
                      onChange={(e) => setNewFornitura({ ...newFornitura, indirizzoFornitura: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consumo Annuo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.consumoAnnuale}
                      onChange={(e) => setNewFornitura({ ...newFornitura, consumoAnnuale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia Contratto</label>
                    <select
                      value={newFornitura.tipologiaContratto}
                      onChange={(e) => setNewFornitura({ ...newFornitura, tipologiaContratto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    >
                      <option value="Residenziale">Residenziale</option>
                      <option value="Business">Business</option>
                      <option value="Altri Usi">Altri Usi</option>
                    </select>
        </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                    <select
                      value={newFornitura.stato}
                      onChange={(e) => setNewFornitura({ ...newFornitura, stato: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    >
                      <option value="Attivo">Attivo</option>
                      <option value="Cessato">Cessato</option>
                    </select>
      </div>
                  
                  {/* Nuovi campi dal foglio Google Sheets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prestazione</label>
                    <input
                      type="text"
                      value={newFornitura.prestazione}
                      onChange={(e) => setNewFornitura({ ...newFornitura, prestazione: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornitore</label>
                    <input
                      type="text"
                      value={newFornitura.fornitore}
                      onChange={(e) => setNewFornitura({ ...newFornitura, fornitore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offerta</label>
                    <input
                      type="text"
                      value={newFornitura.offerta}
                      onChange={(e) => setNewFornitura({ ...newFornitura, offerta: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.prezzo}
                      onChange={(e) => setNewFornitura({ ...newFornitura, prezzo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CCV</label>
                    <input
                      type="text"
                      value={newFornitura.ccv}
                      onChange={(e) => setNewFornitura({ ...newFornitura, ccv: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
                    <input
                      type="date"
                      value={newFornitura.scadenza}
                      onChange={(e) => setNewFornitura({ ...newFornitura, scadenza: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compenso</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.compenso}
                      onChange={(e) => setNewFornitura({ ...newFornitura, compenso: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commissione</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.commissione}
                      onChange={(e) => setNewFornitura({ ...newFornitura, commissione: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operatore</label>
                    <input
                      type="text"
                      value={newFornitura.operatore}
                      onChange={(e) => setNewFornitura({ ...newFornitura, operatore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr. Pratica</label>
                    <input
                      type="text"
                      value={newFornitura.nrPratica}
                      onChange={(e) => setNewFornitura({ ...newFornitura, nrPratica: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Portale</label>
                    <input
                      type="url"
                      value={newFornitura.linkPortale}
                      onChange={(e) => setNewFornitura({ ...newFornitura, linkPortale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Esito Contratto</label>
                    <input
                      type="text"
                      value={newFornitura.esitoContratto}
                      onChange={(e) => setNewFornitura({ ...newFornitura, esitoContratto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia</label>
                    <input
                      type="text"
                      value={newFornitura.tipologia}
                      onChange={(e) => setNewFornitura({ ...newFornitura, tipologia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <textarea
                      value={newFornitura.note}
                      onChange={(e) => setNewFornitura({ ...newFornitura, note: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newFornitura.checkPagamento}
                        onChange={(e) => setNewFornitura({ ...newFornitura, checkPagamento: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Check Pagamento</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newFornitura.checkStorno}
                        onChange={(e) => setNewFornitura({ ...newFornitura, checkStorno: e.target.checked })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Check Storno</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    disabled={addingFornitura}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {addingFornitura ? 'Salvataggio...' : editingFornitura ? 'Aggiorna' : 'Salva'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFornitura(false)
                      setEditingFornitura(null)
                      setNewFornitura({
                        podPdr: '',
                        indirizzoFornitura: '',
                        consumoAnnuale: '',
                        tipologiaContratto: 'Residenziale',
                        stato: 'Attivo',
                        prestazione: '',
                        fornitore: '',
                        offerta: '',
                        prezzo: '',
                        ccv: '',
                        scadenza: '',
                        compenso: '',
                        commissione: '',
                        operatore: '',
                        nrPratica: '',
                        linkPortale: '',
                        checkPagamento: false,
                        checkStorno: false,
                        esitoContratto: '',
                        tipologia: '',
                        note: ''
                      })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            )}

            {forniture.length === 0 ? (
              <p className="text-gray-500 italic">Nessuna fornitura aggiunta</p>
            ) : (
              <div className="space-y-4">
                {forniture.map((fornitura) => (
                  <div key={fornitura.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">POD/PDR</label>
                          <p className="text-gray-900 font-mono">{fornitura.podPdr || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Indirizzo Fornitura</label>
                          <p className="text-gray-900">{fornitura.indirizzoFornitura || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Consumo Annuo</label>
                          <p className="text-gray-900">{fornitura.consumoAnnuale ? `${fornitura.consumoAnnuale} kWh` : '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Tipologia Contratto</label>
                          <p className="text-gray-900">{fornitura.tipologiaContratto}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Stato</label>
                          <p className="text-gray-900">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              fornitura.stato === 'Attivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {fornitura.stato}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditFornitura(fornitura)}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDeleteFornitura(fornitura.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Link
          href="/clienti"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Torna alla lista
        </Link>
        <Link
          href={`/clienti/${cliente.id}/edit`}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Modifica Cliente
        </Link>
      </div>
    </div>
  )
}
