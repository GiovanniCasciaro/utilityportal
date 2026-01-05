'use client'

import { useEffect } from 'react'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  documentoId: string
  documentoNome: string
  documentoTipo: string
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  documentoId,
  documentoNome,
  documentoTipo,
}: DocumentPreviewModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const isImage = documentoTipo.startsWith('image/')
  const isPDF = documentoTipo === 'application/pdf'

  const previewUrl = `/api/documenti/view/${documentoId}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-4">
            {documentoNome}
          </h3>
          <div className="flex items-center space-x-2">
            <a
              href={`/api/documenti/download/${documentoId}`}
              download={documentoNome}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Scarica
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Chiudi"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {isImage ? (
            <div className="flex items-center justify-center min-h-full">
              <img
                src={previewUrl}
                alt={documentoNome}
                className="max-w-full max-h-[calc(90vh-120px)] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPDF ? (
            <div className="w-full h-full">
              <iframe
                src={previewUrl}
                className="w-full h-[calc(90vh-120px)] border-0 rounded-lg"
                title={documentoNome}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 mb-4">Anteprima non disponibile per questo tipo di file</p>
                <a
                  href={`/api/documenti/download/${documentoId}`}
                  download={documentoNome}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Scarica documento
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

