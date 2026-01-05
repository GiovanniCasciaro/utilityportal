'use client'

import { useState, FormEvent } from 'react'

interface UploadDocumentoProps {
  clienteId?: string
  contrattoId?: string
  categoria?: string
  onUploadSuccess?: () => void
}

export default function UploadDocumento({ clienteId, contrattoId, categoria: defaultCategoria, onUploadSuccess }: UploadDocumentoProps) {
  const [file, setFile] = useState<File | null>(null)
  const [categoria, setCategoria] = useState(defaultCategoria || 'Altro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!file) {
      setError('Seleziona un file')
      return
    }

    // Valida dimensione file (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError(`File troppo grande. Dimensione massima consentita: 5MB`)
      return
    }

    if (!clienteId && !contrattoId) {
      setError('Devi specificare un cliente o un contratto')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('categoria', categoria)
      if (clienteId) formData.append('clienteId', clienteId)
      if (contrattoId) formData.append('contrattoId', contrattoId)

      const response = await fetch('/api/documenti', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFile(null)
        if (onUploadSuccess) {
          onUploadSuccess()
        }
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.message || 'Errore durante il caricamento')
      }
    } catch (err) {
      setError('Errore di connessione. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Carica Documento</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Documento caricato con successo!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            disabled={!!defaultCategoria}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="Documento Identità">Documento Identità</option>
            <option value="Contratti">Contratti</option>
            <option value="Fatture">Fatture</option>
            <option value="Clienti">Clienti</option>
            <option value="Preventivi">Preventivi</option>
            <option value="Report">Report</option>
            <option value="Altro">Altro</option>
          </select>
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            File
          </label>
          <input
            id="file"
            type="file"
            multiple
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          />
          <p className="mt-1 text-xs text-gray-500">
            Puoi selezionare più file (tieni premuto Ctrl/Cmd)
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Dimensione massima: 5MB
          </p>
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              File selezionato: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Caricamento...' : 'Carica Documento'}
        </button>
      </form>
    </div>
  )
}


