'use client'

import { useState, useEffect } from 'react'
import DocumentPreviewModal from './DocumentPreviewModal'

interface Documento {
  id: string
  nome: string
  tipo: string
  categoria: string
  dimensione: string
  createdAt: string
}

interface ListaDocumentiProps {
  clienteId?: string
  contrattoId?: string
  categoria?: string
}

export default function ListaDocumenti({ clienteId, contrattoId, categoria }: ListaDocumentiProps) {
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
    let url = '/api/documenti?'
    if (clienteId) url += `clienteId=${clienteId}`
    if (contrattoId) url += `contrattoId=${contrattoId}`
    if (categoria) url += `&categoria=${encodeURIComponent(categoria)}`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Filtra anche lato client se categoria è specificata
          let filtered = data.documenti
          if (categoria) {
            filtered = filtered.filter((doc: Documento) => doc.categoria === categoria)
          }
          setDocumenti(filtered)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadDocumenti()
  }, [clienteId, contrattoId])

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) {
      return
    }

    try {
      const response = await fetch(`/api/documenti/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadDocumenti()
      } else {
        alert('Errore durante l\'eliminazione')
      }
    } catch (error) {
      alert('Errore di connessione')
    }
  }

  const handleDownload = (id: string, nome: string) => {
    window.open(`/api/documenti/download/${id}`, '_blank')
  }

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <p className="text-gray-500">Caricamento documenti...</p>
      </div>
    )
  }

  if (documenti.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <p className="text-gray-500">Nessun documento caricato</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Documenti</h3>
      <div className="space-y-3">
        {documenti.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {doc.tipo.includes('pdf') ? (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.nome}</p>
                <p className="text-xs text-gray-500">
                  {doc.categoria} • {doc.dimensione} • {new Date(doc.createdAt).toLocaleDateString('it-IT')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canPreview(doc.tipo) && (
                <button
                  onClick={() => handlePreview(doc)}
                  className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                  title="Visualizza anteprima"
                >
                  Visualizza
                </button>
              )}
              <button
                onClick={() => handleDownload(doc.id, doc.nome)}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                Scarica
              </button>
              <button
                onClick={() => handleDelete(doc.id)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

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


