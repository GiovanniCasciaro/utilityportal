'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadDocumento from './UploadDocumento'

interface Referente {
  cognome: string
  nome: string
  cellulare?: string
}

interface Fornitura {
  podPdr: string
  indirizzoFornitura: string
  consumoAnnuale: string
  tipologiaContratto: string
  stato: string
}

export default function NewClienteForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tipoCliente, setTipoCliente] = useState<'domestico' | 'partita_iva'>('domestico')
  const [activeTab, setActiveTab] = useState<'anagrafica' | 'forniture'>('anagrafica')
  const [clienteId, setClienteId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    ragioneSociale: '',
    pec: '',
    nomePersonaFisica: '',
    piva: '',
    codiceDestinatario: '',
    nome: '',
    cognome: '',
    codiceFiscale: '',
    email: '',
    cellulare: '',
    indirizzoResidenza: '',
    iban: '',
    codiceAteco: '',
    modalitaPagamento: '',
    stato: 'attivo' as 'attivo' | 'inattivo',
  })
  
  const [documento, setDocumento] = useState<File | null>(null)
  
  // Stati per referenti
  const [referenti, setReferenti] = useState<Referente[]>([])
  const [showAddReferente, setShowAddReferente] = useState(false)
  const [newReferente, setNewReferente] = useState({ cognome: '', nome: '', cellulare: '' })
  const [addingReferente, setAddingReferente] = useState(false)
  
  // Stati per forniture
  const [forniture, setForniture] = useState<Fornitura[]>([])
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
  const [editingFornituraIndex, setEditingFornituraIndex] = useState<number | null>(null)

  const handleCreateCliente = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Valida in base al tipo
    if (tipoCliente === 'partita_iva' && !formData.ragioneSociale) {
      setError('Ragione Sociale è obbligatoria per Partita IVA')
      setLoading(false)
      return
    }

    // Valida documento se presente
    if (documento) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (documento.size > maxSize) {
        setError('Il documento è troppo grande. Dimensione massima: 5MB')
        setLoading(false)
        return
      }

      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(documento.type)) {
        setError('Formato file non supportato. Usa PDF, PNG, JPG o JPEG')
        setLoading(false)
        return
      }
    }

    try {
      // Crea FormData per supportare file upload
      const formDataToSend = new FormData()
      formDataToSend.append('ragioneSociale', tipoCliente === 'partita_iva' ? formData.ragioneSociale : '')
      formDataToSend.append('pec', formData.pec || '')
      formDataToSend.append('nomePersonaFisica', formData.nomePersonaFisica || '')
      formDataToSend.append('piva', formData.piva || '')
      formDataToSend.append('codiceDestinatario', formData.codiceDestinatario || '')
      formDataToSend.append('nome', formData.nome)
      formDataToSend.append('cognome', formData.cognome)
      formDataToSend.append('codiceFiscale', formData.codiceFiscale)
      formDataToSend.append('email', formData.email || '')
      formDataToSend.append('cellulare', formData.cellulare || '')
      formDataToSend.append('indirizzoResidenza', formData.indirizzoResidenza || '')
      formDataToSend.append('iban', formData.iban || '')
      formDataToSend.append('codiceAteco', formData.codiceAteco || '')
      formDataToSend.append('modalitaPagamento', formData.modalitaPagamento || '')
      formDataToSend.append('stato', formData.stato)

      if (documento) {
        formDataToSend.append('documento', documento)
      }

      const response = await fetch('/api/clienti', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        const newClienteId = data.cliente.id
        setClienteId(newClienteId)
        
        // Aggiungi referenti se presenti
        for (const referente of referenti) {
          try {
            await fetch(`/api/clienti/${newClienteId}/referenti`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(referente),
            })
          } catch (err) {
            console.error('Errore aggiunta referente:', err)
          }
        }
        
        // Aggiungi forniture se presenti
        for (const fornitura of forniture) {
          try {
            await fetch(`/api/clienti/${newClienteId}/forniture`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...fornitura,
                consumoAnnuale: fornitura.consumoAnnuale ? parseFloat(fornitura.consumoAnnuale) : null,
                prezzo: fornitura.prezzo ? parseFloat(fornitura.prezzo) : null,
                compenso: fornitura.compenso ? parseFloat(fornitura.compenso) : null,
                commissione: fornitura.commissione ? parseFloat(fornitura.commissione) : null,
              }),
            })
          } catch (err) {
            console.error('Errore aggiunta fornitura:', err)
          }
        }
        
        // Reindirizza alla pagina di visualizzazione
        router.push(`/clienti/${newClienteId}`)
      } else {
        setError(data.message || 'Errore durante la creazione del cliente')
        setLoading(false)
      }
    } catch (err) {
      setError('Errore di connessione. Riprova più tardi.')
      setLoading(false)
    }
  }

  const handleAddReferente = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReferente.cognome || !newReferente.nome) {
      alert('Cognome e Nome sono obbligatori')
      return
    }
    setReferenti([...referenti, { ...newReferente }])
    setNewReferente({ cognome: '', nome: '', cellulare: '' })
    setShowAddReferente(false)
  }

  const handleDeleteReferente = (index: number) => {
    setReferenti(referenti.filter((_, i) => i !== index))
  }

  const handleAddFornitura = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingFornituraIndex !== null) {
      const updated = [...forniture]
      updated[editingFornituraIndex] = { ...newFornitura }
      setForniture(updated)
      setEditingFornituraIndex(null)
    } else {
      setForniture([...forniture, { ...newFornitura }])
    }
    setNewFornitura({
      podPdr: '',
      indirizzoFornitura: '',
      consumoAnnuale: '',
      tipologiaContratto: 'Residenziale',
      stato: 'Attivo'
    })
    setShowAddFornitura(false)
  }

  const handleEditFornitura = (index: number) => {
    setEditingFornituraIndex(index)
    setNewFornitura({ ...forniture[index] })
    setShowAddFornitura(true)
  }

  const handleDeleteFornitura = (index: number) => {
    if (confirm('Sei sicuro di voler eliminare questa fornitura?')) {
      setForniture(forniture.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuovo Cliente</h1>
          <p className="text-gray-600">Aggiungi un nuovo cliente al sistema</p>
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
        <form onSubmit={handleCreateCliente} className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dati Anagrafici</h2>

            {/* Tipo Cliente */}
            <div className="mb-6">
              <label htmlFor="tipoCliente" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Cliente *
              </label>
                <select
                  id="tipoCliente"
                  required
                  value={tipoCliente}
                  onChange={(e) => {
                    setTipoCliente(e.target.value as 'domestico' | 'partita_iva')
                    if (e.target.value === 'domestico') {
                      setFormData({
                        ...formData,
                        ragioneSociale: '',
                        pec: '',
                        nomePersonaFisica: '',
                        piva: '',
                        codiceDestinatario: '',
                        codiceAteco: '',
                      })
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                >
                <option value="domestico">Domestico</option>
                <option value="partita_iva">Partita IVA</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ragione Sociale - Solo Partita IVA */}
              {tipoCliente === 'partita_iva' && (
                <div className="md:col-span-2">
                  <label htmlFor="ragioneSociale" className="block text-sm font-medium text-gray-700 mb-2">
                    Ragione Sociale *
                  </label>
                  <input
                    id="ragioneSociale"
                    type="text"
                    required={tipoCliente === 'partita_iva'}
                    value={formData.ragioneSociale}
                    onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="Ragione Sociale"
                  />
                </div>
              )}

              {/* PEC - Solo Partita IVA */}
              {tipoCliente === 'partita_iva' && (
                <div>
                  <label htmlFor="pec" className="block text-sm font-medium text-gray-700 mb-2">
                    PEC
                  </label>
                  <input
                    id="pec"
                    type="email"
                    value={formData.pec}
                    onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="pec@example.com"
                  />
                </div>
              )}

              {/* Nome Persona Fisica - Solo Partita IVA */}
              {tipoCliente === 'partita_iva' && (
                <div>
                  <label htmlFor="nomePersonaFisica" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Persona Fisica
                  </label>
                  <input
                    id="nomePersonaFisica"
                    type="text"
                    value={formData.nomePersonaFisica}
                    onChange={(e) => setFormData({ ...formData, nomePersonaFisica: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="Nome Persona Fisica"
                  />
                </div>
              )}

              {/* P.IVA - Solo Partita IVA */}
              {tipoCliente === 'partita_iva' && (
                <div>
                  <label htmlFor="piva" className="block text-sm font-medium text-gray-700 mb-2">
                    P.IVA
                  </label>
                  <input
                    id="piva"
                    type="text"
                    value={formData.piva}
                    onChange={(e) => setFormData({ ...formData, piva: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="12345678901"
                  />
                </div>
              )}

              {/* Codice Destinatario - Solo Partita IVA */}
              {tipoCliente === 'partita_iva' && (
                <div>
                  <label htmlFor="codiceDestinatario" className="block text-sm font-medium text-gray-700 mb-2">
                    Codice Destinatario
                  </label>
                  <input
                    id="codiceDestinatario"
                    type="text"
                    value={formData.codiceDestinatario}
                    onChange={(e) => setFormData({ ...formData, codiceDestinatario: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="XXXXXXX"
                  />
                </div>
              )}

              {/* Nome - Obbligatorio */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  id="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="Mario"
                />
              </div>

              {/* Cognome - Obbligatorio */}
              <div>
                <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-2">
                  Cognome *
                </label>
                <input
                  id="cognome"
                  type="text"
                  required
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="Rossi"
                />
              </div>

              {/* Codice Fiscale - Obbligatorio */}
              <div>
                <label htmlFor="codiceFiscale" className="block text-sm font-medium text-gray-700 mb-2">
                  Codice Fiscale *
                </label>
                <input
                  id="codiceFiscale"
                  type="text"
                  required
                  value={formData.codiceFiscale}
                  onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="RSSMRA80A01H501U"
                  maxLength={16}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="email@example.com"
                />
              </div>

              {/* Cellulare */}
              <div>
                <label htmlFor="cellulare" className="block text-sm font-medium text-gray-700 mb-2">
                  Cellulare
                </label>
                <input
                  id="cellulare"
                  type="tel"
                  value={formData.cellulare}
                  onChange={(e) => setFormData({ ...formData, cellulare: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="+39 123 456 7890"
                />
              </div>

              {/* Indirizzo di Residenza */}
              <div className="md:col-span-2">
                <label htmlFor="indirizzoResidenza" className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo di Residenza
                </label>
                <input
                  id="indirizzoResidenza"
                  type="text"
                  value={formData.indirizzoResidenza}
                  onChange={(e) => setFormData({ ...formData, indirizzoResidenza: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="Via Roma 1, 00100 Roma (RM)"
                />
              </div>

              {/* IBAN */}
              <div className="md:col-span-2">
                <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  id="iban"
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  placeholder="IT60 X054 2811 1010 0000 0123 456"
                />
              </div>

              {/* Codice ATECO - Solo Partita IVA */}
              {tipoCliente === 'partita_iva' && (
                <div>
                  <label htmlFor="codiceAteco" className="block text-sm font-medium text-gray-700 mb-2">
                    Codice ATECO
                  </label>
                  <input
                    id="codiceAteco"
                    type="text"
                    value={formData.codiceAteco}
                    onChange={(e) => setFormData({ ...formData, codiceAteco: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="62.01.00"
                  />
                </div>
              )}

              {/* Modalità Pagamento */}
              <div>
                <label htmlFor="modalitaPagamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Modalità Pagamento
                </label>
                <select
                  id="modalitaPagamento"
                  value={formData.modalitaPagamento}
                  onChange={(e) => setFormData({ ...formData, modalitaPagamento: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                >
                  <option value="">Seleziona modalità</option>
                  <option value="Bonifico">Bonifico</option>
                  <option value="RID">RID</option>
                  <option value="Carta">Carta</option>
                  <option value="Contanti">Contanti</option>
                  <option value="Assegno">Assegno</option>
                </select>
              </div>

              {/* Stato */}
              <div>
                <label htmlFor="stato" className="block text-sm font-medium text-gray-700 mb-2">
                  Stato *
                </label>
                <select
                  id="stato"
                  required
                  value={formData.stato}
                  onChange={(e) => setFormData({ ...formData, stato: e.target.value as 'attivo' | 'inattivo' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white !text-gray-900"
                >
                  <option value="attivo">Attivo</option>
                  <option value="inattivo">Inattivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Referenti */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Referenti</h2>
              {!showAddReferente && (
                <button
                  type="button"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Aggiungi
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
                {referenti.map((referente, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">{referente.cognome} {referente.nome}</p>
                      {referente.cellulare && (
                        <p className="text-sm text-gray-600">{referente.cellulare}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReferente(index)}
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
            <div className="space-y-4">
              <div>
                <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-2">
                  Carica Documento
                </label>
                <input
                  id="documento"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setDocumento(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Formati supportati: PDF, PNG, JPG, JPEG. Dimensione massima: 5MB
                </p>
                {documento && (
                  <p className="mt-2 text-sm text-gray-600">
                    File selezionato: {documento.name} ({(documento.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Salvataggio...' : 'Salva Cliente'}
            </button>
          </div>
        </form>
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
                    setEditingFornituraIndex(null)
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
                  {editingFornituraIndex !== null ? 'Modifica Fornitura' : 'Nuova Fornitura'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">POD/PDR</label>
                    <input
                      type="text"
                      value={newFornitura.podPdr}
                      onChange={(e) => setNewFornitura({ ...newFornitura, podPdr: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo Fornitura</label>
                    <input
                      type="text"
                      value={newFornitura.indirizzoFornitura}
                      onChange={(e) => setNewFornitura({ ...newFornitura, indirizzoFornitura: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consumo Annuo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.consumoAnnuale}
                      onChange={(e) => setNewFornitura({ ...newFornitura, consumoAnnuale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornitore</label>
                    <input
                      type="text"
                      value={newFornitura.fornitore}
                      onChange={(e) => setNewFornitura({ ...newFornitura, fornitore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offerta</label>
                    <input
                      type="text"
                      value={newFornitura.offerta}
                      onChange={(e) => setNewFornitura({ ...newFornitura, offerta: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.prezzo}
                      onChange={(e) => setNewFornitura({ ...newFornitura, prezzo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CCV</label>
                    <input
                      type="text"
                      value={newFornitura.ccv}
                      onChange={(e) => setNewFornitura({ ...newFornitura, ccv: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
                    <input
                      type="date"
                      value={newFornitura.scadenza}
                      onChange={(e) => setNewFornitura({ ...newFornitura, scadenza: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compenso</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.compenso}
                      onChange={(e) => setNewFornitura({ ...newFornitura, compenso: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commissione</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newFornitura.commissione}
                      onChange={(e) => setNewFornitura({ ...newFornitura, commissione: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operatore</label>
                    <input
                      type="text"
                      value={newFornitura.operatore}
                      onChange={(e) => setNewFornitura({ ...newFornitura, operatore: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr. Pratica</label>
                    <input
                      type="text"
                      value={newFornitura.nrPratica}
                      onChange={(e) => setNewFornitura({ ...newFornitura, nrPratica: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Portale</label>
                    <input
                      type="url"
                      value={newFornitura.linkPortale}
                      onChange={(e) => setNewFornitura({ ...newFornitura, linkPortale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Esito Contratto</label>
                    <input
                      type="text"
                      value={newFornitura.esitoContratto}
                      onChange={(e) => setNewFornitura({ ...newFornitura, esitoContratto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia</label>
                    <input
                      type="text"
                      value={newFornitura.tipologia}
                      onChange={(e) => setNewFornitura({ ...newFornitura, tipologia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <textarea
                      value={newFornitura.note}
                      onChange={(e) => setNewFornitura({ ...newFornitura, note: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingFornituraIndex !== null ? 'Aggiorna' : 'Aggiungi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFornitura(false)
                      setEditingFornituraIndex(null)
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
                {forniture.map((fornitura, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                          onClick={() => handleEditFornitura(index)}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDeleteFornitura(index)}
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

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('anagrafica')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Torna a Dati Anagrafici
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
