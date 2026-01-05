'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name?: string
  ruolo: 'punto_vendita' | 'agente'
  puntoVenditaId?: string
}

interface DashboardContentProps {
  user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [storage, setStorage] = useState<any>(null)
  const [storageLoading, setStorageLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const fetchStorage = () => {
    fetch('/api/storage')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStorage(data.storage)
        }
        setStorageLoading(false)
      })
      .catch(() => setStorageLoading(false))
  }

  useEffect(() => {
    fetchStorage()
    // Aggiorna ogni 5 secondi per vedere i cambiamenti in tempo reale
    const interval = setInterval(fetchStorage, 5000)
    return () => clearInterval(interval)
  }, [])

  // Dati mock per le metriche
  const metrics = [
    { label: user.ruolo === 'punto_vendita' ? 'Agenti Totali' : 'Clienti Totali', value: stats?.clienti || '0', change: '+12%', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'blue' },
    { label: 'Contratti Attivi', value: stats?.contratti || '0', change: '+8%', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'green' },
    { label: 'Fatturato Mensile', value: `€${stats?.fatturato || '0'}`, change: '+15%', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'purple' },
  ]


  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Benvenuto, {user.name || user.email}
          {user.ruolo === 'punto_vendita' && ' - Punto Vendita'}
          {user.ruolo === 'agente' && ' - Agente'}
        </p>
      </div>

      {/* Carte Metriche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          // Determina il link in base alla metrica
          let link = '/dashboard'
          if (metric.label.includes('Agenti')) link = '/agenti'
          else if (metric.label.includes('Contratti')) link = '/contratti'
          else if (metric.label.includes('Fatturato')) link = '/fatturazione'

          return (
            <Link
              key={index}
              href={link}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all cursor-pointer block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={metric.icon} />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-green-600">{metric.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Grafico Spazio Utilizzato */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Spazio Utilizzato</h2>
        {storageLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Caricamento...</p>
          </div>
        ) : storage ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {storage.usedFormatted} / {storage.maxFormatted}
              </span>
              <span className={`text-sm font-semibold ${storage.percentage >= 80 ? 'text-red-600' : storage.percentage >= 60 ? 'text-orange-600' : 'text-green-600'}`}>
                {storage.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  storage.percentage >= 80 ? 'bg-red-500' : storage.percentage >= 60 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(storage.percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Spazio disponibile: {storage.availableFormatted}</span>
              <span>Limite: {storage.maxMB} MB</span>
            </div>
            {storage.percentage >= 80 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Spazio quasi esaurito. Considera di eliminare alcuni documenti.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Errore nel caricamento dei dati di storage
          </div>
        )}
      </div>

      {user.ruolo === 'punto_vendita' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview Agenti</h2>
          <Link
            href="/agenti"
            className="text-blue-600 hover:text-blue-800"
          >
            Visualizza tutti gli agenti →
          </Link>
        </div>
      )}

      {/* Azioni Rapide */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/clienti/new" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
              <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Nuovo Cliente</p>
            </Link>
            <Link href="/contratti/new" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
              <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Nuovo Contratto</p>
            </Link>
            <Link href="/fatturazione/new" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
              <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Nuova Fattura</p>
            </Link>
            <Link href="/report" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
              <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Visualizza Report</p>
            </Link>
        </div>
      </div>
    </div>
  )
}
