'use client'

export default function FatturazioneContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fatturazione</h1>
        <p className="text-gray-600">Gestisci fatture e pagamenti</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pagina in Manutenzione</h2>
          <p className="text-gray-600 mb-6">
            Questa sezione è temporaneamente non disponibile. Stiamo lavorando per migliorare il servizio.
          </p>
          <p className="text-sm text-gray-500">
            Torneremo presto operativi. Grazie per la pazienza.
          </p>
        </div>
      </div>
    </div>
  )
}
