'use client'

import { useState, useEffect } from 'react'
import UploadDocumento from './UploadDocumento'
import ListaDocumenti from './ListaDocumenti'
import DocumentPreviewModal from './DocumentPreviewModal'

interface Documento {
  id: string
  nome: string
  tipo: string
  dimensione: string
  createdAt: string
  categoria: string
  clienteId?: string
  contrattoId?: string
}

export default function DocumentiContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('tutte')
  const [documenti, setDocumenti] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    documentoId: string
    documentoNome: string
    documentoTipo: string
  }>({
    isOpen: false,
    documentoId: '',
    documentoNome: '',
    documentoTipo: '',
  })

  const loadDocumenti = () => {
    setLoading(true)
    fetch('/api/documenti')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDocumenti(data.documenti)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadDocumenti()
  }, [])

  const filteredDocumenti = documenti.filter(doc => {
    const matchesSearch = `${doc.nome} ${doc.categoria}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterCategoria === 'tutte' || doc.categoria === filterCategoria
    return matchesSearch && matchesFilter
  })

  const categorie = ['tutte', ...Array.from(new Set(documenti.map(d => d.categoria)))]

  const handlePreview = (doc: Documento) => {
    setPreviewModal({
      isOpen: true,
      documentoId: doc.id,
      documentoNome: doc.nome,
      documentoTipo: doc.tipo,
    })
  }

  const canPreview = (tipo: string) => {
    return tipo.startsWith('image/') || tipo === 'application/pdf'
  }

  const totalSize = documenti.reduce((sum, doc) => {
    const size = parseFloat(doc.dimensione.replace(' MB', '').replace(' KB', ''))
    return sum + (doc.dimensione.includes('MB') ? size : size / 1024)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Documenti</h1>
          <p className="text-gray-600">Carica e gestisci tutti i documenti</p>
        </div>
        <div className="hidden">
          <UploadDocumento onUploadSuccess={loadDocumenti} />
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Totale Documenti</div>
          <div className="text-2xl font-bold text-gray-900">{documenti.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Spazio Utilizzato</div>
          <div className="text-2xl font-bold text-blue-600">{totalSize.toFixed(2)} MB</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Documenti Questo Mese</div>
          <div className="text-2xl font-bold text-green-600">
            {documenti.filter(d => {
              const docDate = new Date(d.createdAt)
              const now = new Date()
              return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear()
            }).length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">Categorie</div>
          <div className="text-2xl font-bold text-purple-600">{categorie.length - 1}</div>
        </div>
      </div>

      {/* Ricerca e Filtri */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 neon-search-container">
            <div className="outer-glow"></div>
            <input
              type="text"
              placeholder="Cerca documenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder:text-gray-400 neon-search-input"
            />
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            {categorie.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'tutte' ? 'Tutte le categorie' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Griglia Documenti */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Caricamento documenti...</p>
        </div>
      ) : filteredDocumenti.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Nessun documento trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocumenti.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                {doc.tipo === 'PDF' ? (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                {doc.categoria}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 truncate">{doc.nome}</h3>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{doc.dimensione}</span>
              <span>{new Date(doc.createdAt).toLocaleDateString('it-IT')}</span>
            </div>
            <div className="flex space-x-2">
              {canPreview(doc.tipo) && (
                <button 
                  onClick={() => handlePreview(doc)}
                  className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                  title="Visualizza anteprima"
                >
                  Visualizza
                </button>
              )}
              <button 
                onClick={() => window.open(`/api/documenti/download/${doc.id}`, '_blank')}
                className={`px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium ${canPreview(doc.tipo) ? '' : 'flex-1'}`}
              >
                Scarica
              </button>
              <button 
                onClick={async () => {
                  if (confirm('Sei sicuro di voler eliminare questo documento?')) {
                    try {
                      const response = await fetch(`/api/documenti/${doc.id}`, { method: 'DELETE' })
                      if (response.ok) {
                        loadDocumenti()
                      }
                    } catch (error) {
                      alert('Errore durante l\'eliminazione')
                    }
                  }
                }}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal Anteprima */}
      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        documentoId={previewModal.documentoId}
        documentoNome={previewModal.documentoNome}
        documentoTipo={previewModal.documentoTipo}
      />
    </div>
  )
}

