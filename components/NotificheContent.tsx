'use client'

import { useState } from 'react'

interface Notifica {
  id: string
  titolo: string
  messaggio: string
  tipo: 'info' | 'warning' | 'success' | 'error'
  data: string
  letta: boolean
}

export default function NotificheContent() {
  const [notifiche, setNotifiche] = useState<Notifica[]>([
    {
      id: '1',
      titolo: 'Nuovo Contratto Creato',
      messaggio: 'Il contratto CTR-2024-001 è stato creato con successo',
      tipo: 'success',
      data: '2024-03-15T10:30:00',
      letta: false,
    },
    {
      id: '2',
      titolo: 'Scadenza Contratto',
      messaggio: 'Il contratto CTR-2023-045 scadrà tra 3 giorni',
      tipo: 'warning',
      data: '2024-03-15T09:15:00',
      letta: false,
    },
    {
      id: '3',
      titolo: 'Fattura Pagata',
      messaggio: 'La fattura FAT-2024-002 è stata pagata',
      tipo: 'success',
      data: '2024-03-14T16:45:00',
      letta: true,
    },
    {
      id: '4',
      titolo: 'Nuovo Cliente Registrato',
      messaggio: 'Mario Rossi si è registrato come nuovo cliente',
      tipo: 'info',
      data: '2024-03-14T14:20:00',
      letta: true,
    },
    {
      id: '5',
      titolo: 'Errore Pagamento',
      messaggio: 'Errore durante il processo di pagamento per la fattura FAT-2024-004',
      tipo: 'error',
      data: '2024-03-13T11:00:00',
      letta: true,
    },
  ])

  const [filter, setFilter] = useState<'tutte' | 'non_lette'>('tutte')

  const filteredNotifiche = notifiche.filter(n => 
    filter === 'tutte' || !n.letta
  )

  const notificheNonLette = notifiche.filter(n => !n.letta).length

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  }

  const markAsRead = (id: string) => {
    setNotifiche(notifiche.map(n => n.id === id ? { ...n, letta: true } : n))
  }

  const markAllAsRead = () => {
    setNotifiche(notifiche.map(n => ({ ...n, letta: true })))
  }

  const deleteNotifica = (id: string) => {
    setNotifiche(notifiche.filter(n => n.id !== id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} giorno${days > 1 ? 'i' : ''} fa`
    if (hours > 0) return `${hours} ora${hours > 1 ? 'e' : ''} fa`
    return 'Poco fa'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifiche</h1>
          <p className="text-gray-600">
            {notificheNonLette > 0 ? `${notificheNonLette} notifiche non lette` : 'Tutte le notifiche sono state lette'}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'tutte' | 'non_lette')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="tutte">Tutte</option>
            <option value="non_lette">Non Lette</option>
          </select>
          {notificheNonLette > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Segna tutte come lette
            </button>
          )}
        </div>
      </div>

      {/* Notifiche List */}
      <div className="space-y-4">
        {filteredNotifiche.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-500 text-lg">Nessuna notifica</p>
          </div>
        ) : (
          filteredNotifiche.map((notifica) => (
            <div
              key={notifica.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                notifica.letta ? 'border-gray-200' : 'border-blue-300 bg-blue-50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${getTipoColor(notifica.tipo)}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTipoIcon(notifica.tipo)} />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold ${notifica.letta ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notifica.titolo}
                      </h3>
                      <p className={`text-sm mt-1 ${notifica.letta ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notifica.messaggio}
                      </p>
                    </div>
                    {!notifica.letta && (
                      <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">{formatDate(notifica.data)}</span>
                    <div className="flex space-x-2">
                      {!notifica.letta && (
                        <button
                          onClick={() => markAsRead(notifica.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Segna come letta
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotifica(notifica.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

