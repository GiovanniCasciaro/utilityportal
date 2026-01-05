'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Cliente {
  id: string
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
  indirizzoResidenza?: string
  iban?: string
  codiceAteco?: string
  modalitaPagamento?: string
  stato: 'attivo' | 'inattivo'
}

interface EditClienteFormProps {
  clienteId: string
  onSuccess?: () => void
}

export default function EditClienteForm({ clienteId, onSuccess }: EditClienteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [tipoCliente, setTipoCliente] = useState<'domestico' | 'partita_iva'>('domestico')
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

  useEffect(() => {
    // Carica i dati del cliente
    fetch(`/api/clienti/${clienteId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const cliente = data.cliente
          setFormData({
            ragioneSociale: cliente.ragioneSociale || '',
            pec: cliente.pec || '',
            nomePersonaFisica: cliente.nomePersonaFisica || '',
            piva: cliente.piva || '',
            codiceDestinatario: cliente.codiceDestinatario || '',
            nome: cliente.nome,
            cognome: cliente.cognome,
            codiceFiscale: cliente.codiceFiscale,
            email: cliente.email || '',
            cellulare: cliente.cellulare || '',
            indirizzoResidenza: cliente.indirizzoResidenza || '',
            iban: cliente.iban || '',
            codiceAteco: cliente.codiceAteco || '',
            modalitaPagamento: cliente.modalitaPagamento || '',
            stato: cliente.stato,
          })
          // Determina tipo cliente
          if (cliente.piva || cliente.ragioneSociale !== `${cliente.nome} ${cliente.cognome}`) {
            setTipoCliente('partita_iva')
          }
        }
        setLoadingData(false)
      })
      .catch(() => setLoadingData(false))
  }, [clienteId])

  const handleSubmit = async (e: FormEvent) => {
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

      // Debug log
      console.log('EditClienteForm - Invio dati:', {
        nome: formData.nome,
        cognome: formData.cognome,
        codiceFiscale: formData.codiceFiscale,
        ragioneSociale: tipoCliente === 'partita_iva' ? formData.ragioneSociale : '',
        tipoCliente
      })

      const response = await fetch(`/api/clienti/${clienteId}`, {
        method: 'PUT',
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/clienti/${clienteId}`)
          router.refresh()
        }
      } else {
        setError(data.message || 'Errore durante l\'aggiornamento del cliente')
      }
    } catch (err) {
      setError('Errore di connessione. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
        <p className="text-gray-500">Caricamento dati cliente...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Modifica Cliente</h1>
        <p className="text-gray-600">Aggiorna i dati del cliente</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo Cliente */}
          <div className="md:col-span-2">
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
            {/* Ragione Sociale - Obbligatorio solo per Partita IVA */}
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

            {/* Upload Documento */}
            <div className="md:col-span-2">
              <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-2">
                Aggiungi Documento (opzionale)
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
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

