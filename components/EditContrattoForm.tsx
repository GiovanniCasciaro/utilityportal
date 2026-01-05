'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Cliente {
  id: string
  ragioneSociale: string
  nome: string
  cognome: string
  email?: string
}

interface Contratto {
  id: string
  numero: string
  clienteId: string
  tipo: string
  tipoCliente: string
  dataInizio: string
  dataScadenza: string
  importo: number
  note?: string
  stato: string
}

interface EditContrattoFormProps {
  contrattoId: string
  onSuccess?: () => void
}

export default function EditContrattoForm({ contrattoId, onSuccess }: EditContrattoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [loadingClienti, setLoadingClienti] = useState(true)
  const [formData, setFormData] = useState({
    numero: '',
    clienteId: '',
    tipo: '',
    tipoCliente: 'domestico' as 'domestico' | 'partita_iva',
    dataInizio: '',
    dataScadenza: '',
    importo: '',
    note: '',
    stato: 'attivo' as 'attivo' | 'in_scadenza' | 'scaduto',
  })
  const [documento, setDocumento] = useState<File | null>(null)

  useEffect(() => {
    // Carica i clienti
    fetch('/api/clienti')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClienti(data.clienti)
        }
        setLoadingClienti(false)
      })
      .catch(() => setLoadingClienti(false))

    // Carica i dati del contratto
    fetch(`/api/contratti/${contrattoId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const contratto = data.contratto
          // Converti le date in formato YYYY-MM-DD per gli input HTML
          const formatDateForInput = (dateString: string) => {
            if (!dateString) return ''
            const date = new Date(dateString)
            return date.toISOString().split('T')[0]
          }
          setFormData({
            numero: contratto.numero,
            clienteId: contratto.clienteId,
            tipo: contratto.tipo,
            tipoCliente: (contratto.tipoCliente || 'domestico') as 'domestico' | 'partita_iva',
            dataInizio: formatDateForInput(contratto.dataInizio),
            dataScadenza: formatDateForInput(contratto.dataScadenza),
            importo: contratto.importo.toString(),
            note: contratto.note || '',
            stato: contratto.stato as 'attivo' | 'in_scadenza' | 'scaduto',
          })
        }
        setLoadingData(false)
      })
      .catch(() => setLoadingData(false))
  }, [contrattoId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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
      formDataToSend.append('numero', formData.numero)
      formDataToSend.append('clienteId', formData.clienteId)
      formDataToSend.append('tipo', formData.tipo)
      formDataToSend.append('tipoCliente', formData.tipoCliente)
      formDataToSend.append('dataInizio', formData.dataInizio)
      formDataToSend.append('dataScadenza', formData.dataScadenza)
      formDataToSend.append('importo', formData.importo)
      formDataToSend.append('note', formData.note || '')
      formDataToSend.append('stato', formData.stato)

      if (documento) {
        formDataToSend.append('documento', documento)
      }

      const response = await fetch(`/api/contratti/${contrattoId}`, {
        method: 'PUT',
        body: formDataToSend,
      })

      const data = await response.json()

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/contratti/${contrattoId}`)
          router.refresh()
        }
      } else {
        setError(data.message || 'Errore durante l\'aggiornamento del contratto')
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
        <p className="text-gray-500">Caricamento dati contratto...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Modifica Contratto</h1>
        <p className="text-gray-600">Aggiorna i dati del contratto</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
                Numero Contratto *
              </label>
              <input
                id="numero"
                type="text"
                required
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="CTR-2024-001"
              />
            </div>

            <div>
              <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              {loadingClienti ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  Caricamento clienti...
                </div>
              ) : (
                <select
                  id="clienteId"
                  required
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                >
                  <option value="">Seleziona un cliente</option>
                  {clienti.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.ragioneSociale} - {cliente.nome} {cliente.cognome} {cliente.email ? `(${cliente.email})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="tipoCliente" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Cliente *
              </label>
              <select
                id="tipoCliente"
                required
                value={formData.tipoCliente}
                onChange={(e) => setFormData({ ...formData, tipoCliente: e.target.value as 'domestico' | 'partita_iva' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
              >
                <option value="domestico">Domestico</option>
                <option value="partita_iva">Partita IVA</option>
              </select>
            </div>

            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Contratto *
              </label>
              <select
                id="tipo"
                required
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
              >
                <option value="">Seleziona tipo</option>
                <option value="Solo Fisso">Solo Fisso</option>
                <option value="Solo Mobile">Solo Mobile</option>
                <option value="Fisso + Mobile">Fisso + Mobile</option>
                <option value="Fisso + Mobile + Internet">Fisso + Mobile + Internet</option>
                <option value="Solo Internet">Solo Internet</option>
              </select>
            </div>

            <div>
              <label htmlFor="importo" className="block text-sm font-medium text-gray-700 mb-2">
                Importo Mensile (€) *
              </label>
              <input
                id="importo"
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.importo}
                onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="29.90"
              />
            </div>

            <div>
              <label htmlFor="dataInizio" className="block text-sm font-medium text-gray-700 mb-2">
                Data Inizio *
              </label>
              <input
                id="dataInizio"
                type="date"
                required
                value={formData.dataInizio}
                onChange={(e) => setFormData({ ...formData, dataInizio: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="dataScadenza" className="block text-sm font-medium text-gray-700 mb-2">
                Data Scadenza *
              </label>
              <input
                id="dataScadenza"
                type="date"
                required
                value={formData.dataScadenza}
                onChange={(e) => setFormData({ ...formData, dataScadenza: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="stato" className="block text-sm font-medium text-gray-700 mb-2">
                Stato *
              </label>
              <select
                id="stato"
                required
                value={formData.stato}
                onChange={(e) => setFormData({ ...formData, stato: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
              >
                <option value="attivo">Attivo</option>
                <option value="in_scadenza">In Scadenza</option>
                <option value="scaduto">Scaduto</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <textarea
                id="note"
                rows={4}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                placeholder="Note aggiuntive sul contratto..."
              />
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

