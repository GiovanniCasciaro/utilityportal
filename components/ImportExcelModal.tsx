'use client'

interface ImportExcelModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ImportExcelModal({
  isOpen,
  onConfirm,
  onCancel,
}: ImportExcelModalProps) {
  if (!isOpen) return null

  const requiredColumns = [
    { name: 'Nome', description: 'Nome del cliente' },
    { name: 'Cognome', description: 'Cognome del cliente' },
    { name: 'Codice Fiscale', description: 'Codice fiscale (deve essere unico)' },
  ]

  const optionalColumns = [
    { name: 'Email', variants: ['Email', 'email', 'E-mail'] },
    { name: 'Cellulare', variants: ['Cellulare', 'Telefono', 'Phone'] },
    { name: 'Ragione Sociale', variants: ['Ragione Sociale', 'Company', 'Azienda'] },
    { name: 'P.IVA', variants: ['P.IVA', 'Partita IVA', 'VAT'] },
    { name: 'PEC', variants: ['PEC', 'pec'] },
    { name: 'Codice ATECO', variants: ['Codice ATECO', 'ATECO'] },
    { name: 'Modalità Pagamento', variants: ['Modalità Pagamento', 'Payment'] },
    { name: 'Stato', variants: ['Stato', 'Status'] },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />
      
      {/* Modale */}
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 z-50 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          📊 Import Excel - Formato Richiesto
        </h3>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Prima di procedere con l'import, assicurati che il file Excel contenga le colonne richieste.
            <strong className="text-red-600 block mt-2">
              ⚠️ Se mancano le colonne obbligatorie, l'import fallirà!
            </strong>
          </p>
        </div>

        {/* Colonne Obbligatorie */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
            <span className="bg-red-100 text-red-600 px-2 py-1 rounded mr-2">OBBLIGATORIE</span>
            Queste colonne DEVONO essere presenti:
          </h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            {requiredColumns.map((col, index) => (
              <div key={index} className="flex items-start">
                <span className="text-red-600 font-bold mr-2">•</span>
                <div>
                  <span className="font-semibold text-gray-900">{col.name}</span>
                  <span className="text-gray-600 text-sm ml-2">- {col.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne Opzionali */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-blue-600 mb-3 flex items-center">
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded mr-2">OPZIONALI</span>
            Queste colonne possono essere incluse:
          </h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {optionalColumns.map((col, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <div>
                    <span className="font-medium text-gray-900">{col.name}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      ({col.variants.slice(0, 2).join(', ')}...)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Esempio Formato */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">📋 Esempio Formato:</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border border-gray-300 font-semibold text-red-600">Nome*</th>
                  <th className="px-3 py-2 text-left border border-gray-300 font-semibold text-red-600">Cognome*</th>
                  <th className="px-3 py-2 text-left border border-gray-300 font-semibold text-red-600">Codice Fiscale*</th>
                  <th className="px-3 py-2 text-left border border-gray-300 font-semibold text-blue-600">Email</th>
                  <th className="px-3 py-2 text-left border border-gray-300 font-semibold text-blue-600">Cellulare</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-gray-300">Mario</td>
                  <td className="px-3 py-2 border border-gray-300">Rossi</td>
                  <td className="px-3 py-2 border border-gray-300">RSSMRA80A01H501U</td>
                  <td className="px-3 py-2 border border-gray-300">mario@email.com</td>
                  <td className="px-3 py-2 border border-gray-300">3331234567</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              * = Campo obbligatorio
            </p>
          </div>
        </div>

        {/* Note Importanti */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Note Importanti:</h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>La prima riga del file deve contenere i nomi delle colonne (header)</li>
            <li>I dati iniziano dalla seconda riga</li>
            <li>Il Codice Fiscale deve essere unico (i duplicati verranno saltati)</li>
            <li>I nomi delle colonne sono case-insensitive (Nome = nome = NOME)</li>
            <li>Formato file supportato: .xlsx o .xls</li>
          </ul>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            ✓ Continua e Seleziona File
          </button>
        </div>
      </div>
    </div>
  )
}

