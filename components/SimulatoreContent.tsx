'use client'

import { useState } from 'react'

interface Offerta {
  id: string
  fornitore: string
  nome: string
  prezzoMensile: number
  risparmioAnnuale: number
  risparmioPercentuale: number
  caratteristiche: string[]
  logo?: string
}

interface AnalisiBolletta {
  consumoAnnuale: number
  costoAttuale: number
  costoMensile: number
  tipoBolletta: 'luce' | 'gas' | 'entrambi'
  offerte: Offerta[]
  miglioreOfferta: Offerta | null
}

export default function SimulatoreContent() {
  const [step, setStep] = useState<'form' | 'analisi' | 'risultati'>('form')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    bolletta: null as File | null,
    privacy: false,
    termini: false,
  })
  const [analisi, setAnalisi] = useState<AnalisiBolletta | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file' && files && files[0]) {
      setFormData(prev => ({ ...prev, bolletta: files[0] }))
      setErrors(prev => ({ ...prev, bolletta: '' }))
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
      setErrors(prev => ({ ...prev, [name]: '' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nome.trim()) newErrors.nome = 'Il nome è obbligatorio'
    if (!formData.cognome.trim()) newErrors.cognome = 'Il cognome è obbligatorio'
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email è obbligatoria'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Inserisci un indirizzo email valido'
    }
    if (!formData.bolletta) newErrors.bolletta = 'Carica la tua bolletta'
    if (!formData.privacy) newErrors.privacy = 'Devi accettare l\'informativa privacy'
    if (!formData.termini) newErrors.termini = 'Devi accettare i termini e condizioni'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setStep('analisi')

    try {
      const formDataToSend = new FormData()
      if (formData.bolletta) {
        formDataToSend.append('bolletta', formData.bolletta)
      }
      formDataToSend.append('nome', formData.nome)
      formDataToSend.append('cognome', formData.cognome)
      formDataToSend.append('email', formData.email)

      const response = await fetch('/api/simulatore/analyze', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (data.success && data.analisi) {
        setAnalisi(data.analisi)
        setStep('risultati')
      } else {
        alert(data.message || 'Errore durante l\'analisi della bolletta')
        setStep('form')
      }
    } catch (error) {
      console.error('Errore:', error)
      alert('Errore di connessione. Riprova più tardi.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('form')
    setFormData({
      nome: '',
      cognome: '',
      email: '',
      bolletta: null,
      privacy: false,
      termini: false,
    })
    setAnalisi(null)
    setErrors({})
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Simulatore Bollette</h1>
        <p className="text-xl text-gray-600">
          Analizza la tua bolletta LUCE o GAS in pochi secondi grazie all'intelligenza artificiale
        </p>
        <p className="text-lg text-gray-500">
          Carica la tua bolletta e scopri subito se puoi risparmiare con un'offerta migliore!
        </p>
      </div>

      {/* Vantaggi */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="text-3xl mb-2">🆓</div>
          <h3 className="font-semibold text-gray-900 mb-1">Gratis</h3>
          <p className="text-sm text-gray-600">Servizio completamente gratuito</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="text-3xl mb-2">🔓</div>
          <h3 className="font-semibold text-gray-900 mb-1">Senza Vincoli</h3>
          <p className="text-sm text-gray-600">Nessun impegno o vincolo</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="text-3xl mb-2">👁️</div>
          <h3 className="font-semibold text-gray-900 mb-1">Trasparente</h3>
          <p className="text-sm text-gray-600">Solo offerte chiare e trasparenti</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="text-3xl mb-2">🔒</div>
          <h3 className="font-semibold text-gray-900 mb-1">Sicuro</h3>
          <p className="text-sm text-gray-600">I tuoi dati sono protetti</p>
        </div>
      </div>

      {/* Form o Risultati */}
      {step === 'form' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            CARICA LA BOLLETTA E SCOPRI IL RISPARMIO
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Bolletta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bolletta <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleInputChange}
                  className="hidden"
                  id="bolletta"
                />
                <label
                  htmlFor="bolletta"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium text-blue-600">
                    {formData.bolletta ? formData.bolletta.name : 'Scegli file'}
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, JPEG o PNG (max 5MB)
                  </span>
                </label>
              </div>
              {errors.bolletta && (
                <p className="mt-1 text-sm text-red-600">{errors.bolletta}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Non salviamo la tua bolletta
              </p>
            </div>

            {/* Nome e Cognome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Inserisci il tuo nome"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cognome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleInputChange}
                  placeholder="Inserisci il tuo cognome"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.cognome ? 'border-red-500' : 'border-gray-300'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.cognome && (
                  <p className="mt-1 text-sm text-red-600">{errors.cognome}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indirizzo mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Inserisci un indirizzo email valido"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Riceverai via mail l'analisi della bolletta
              </p>
            </div>

            {/* Privacy e Termini */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="privacy"
                  checked={formData.privacy}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Vista l'informativa privacy, prendo atto che il trattamento dei miei dati è necessario all'erogazione dei servizi per le finalità descritte.{' '}
                  {errors.privacy && <span className="text-red-500">*</span>}
                </span>
              </label>
              {errors.privacy && (
                <p className="text-sm text-red-600 ml-7">{errors.privacy}</p>
              )}

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="termini"
                  checked={formData.termini}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Acconsento al trattamento dei miei dati personali, forniti mediante la scansione della bolletta.{' '}
                  {errors.termini && <span className="text-red-500">*</span>}
                </span>
              </label>
              {errors.termini && (
                <p className="text-sm text-red-600 ml-7">{errors.termini}</p>
              )}

              <p className="text-xs text-gray-500">
                Proseguendo si accettano i Termini e condizioni del servizio
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg"
            >
              ANALIZZA BOLLETTA
            </button>
          </form>
        </div>
      )}

      {/* Analisi in corso */}
      {step === 'analisi' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center max-w-2xl mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            L'IA sta analizzando la bolletta...
          </h2>
          <p className="text-gray-600">
            Stiamo analizzando i tuoi consumi e confrontando le migliori offerte disponibili
          </p>
        </div>
      )}

      {/* Risultati */}
      {step === 'risultati' && analisi && (
        <div className="space-y-6">
          {/* Riepilogo Analisi */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Analisi Completata</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm opacity-90">Consumo Annuale</p>
                <p className="text-3xl font-bold">{analisi.consumoAnnuale} {analisi.tipoBolletta === 'luce' ? 'kWh' : 'smc'}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Costo Attuale Annuale</p>
                <p className="text-3xl font-bold">€{analisi.costoAttuale.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Costo Mensile</p>
                <p className="text-3xl font-bold">€{analisi.costoMensile.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Migliore Offerta */}
          {analisi.miglioreOfferta && (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-green-900 mb-1">
                    🎉 Migliore Offerta Trovata!
                  </h3>
                  <p className="text-green-700">
                    Potresti risparmiare fino a €{analisi.miglioreOfferta.risparmioAnnuale.toFixed(2)} all'anno
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">
                    -{analisi.miglioreOfferta.risparmioPercentuale}%
                  </p>
                  <p className="text-sm text-green-700">di risparmio</p>
                </div>
              </div>
            </div>
          )}

          {/* Lista Offerte */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Offerte Disponibili
            </h3>
            {analisi.offerte.map((offerta) => (
              <div
                key={offerta.id}
                className={`bg-white rounded-xl shadow-lg border-2 p-6 ${
                  offerta.id === analisi.miglioreOfferta?.id
                    ? 'border-green-500'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-900">
                        {offerta.nome}
                      </h4>
                      {offerta.id === analisi.miglioreOfferta?.id && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          MIGLIORE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{offerta.fornitore}</p>
                    <ul className="space-y-1">
                      {offerta.caratteristiche.map((car, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          {car}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-sm text-gray-600 mb-1">Prezzo Mensile</p>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      €{offerta.prezzoMensile.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">Risparmio Annuale</p>
                    <p className="text-xl font-bold text-green-600">
                      €{offerta.risparmioAnnuale.toFixed(2)}
                    </p>
                    <button className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
                      Scopri di più
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottone Reset */}
          <div className="text-center">
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Analizza un'altra bolletta
            </button>
          </div>
        </div>
      )}

      {/* Sezione Informazioni */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Perché scegliere il nostro simulatore?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Risparmia Tempo</h3>
            <p className="text-sm text-gray-600">
              Analizziamo la tua bolletta in pochi secondi grazie alla nostra intelligenza artificiale.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-2">Trova l'offerta migliore</h3>
            <p className="text-sm text-gray-600">
              Confrontiamo le offerte più convenienti per te, personalizzate in base ai tuoi consumi.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 mb-2">Risparmia Denaro</h3>
            <p className="text-sm text-gray-600">
              Scopri subito quanto puoi risparmiare cambiando fornitore o mantenendo la tua attuale offerta.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">👁️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Trasparenza totale</h3>
            <p className="text-sm text-gray-600">
              Ti mostriamo solo offerte chiare e senza costi nascosti.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

