import { cookies } from 'next/headers'
import { verifyToken } from './jwt'
import db from './db'

export interface User {
  id: string
  email: string
  name?: string
  ruolo: 'punto_vendita' | 'agente'
  puntoVenditaId?: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token) {
      return null
    }

    // Verifica il token JWT
    const decoded = verifyToken(token.value)
    
    if (!decoded) {
      // Cancella il token non valido
      cookieStore.delete('auth-token')
      return null
    }

    // Ottieni l'utente dal database per ottenere il ruolo
    const user = db.prepare('SELECT id, email, nome, ruolo, puntoVenditaId FROM utenti WHERE id = ?').get(decoded.id) as any

    if (!user) {
      cookieStore.delete('auth-token')
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.nome,
      ruolo: user.ruolo,
      puntoVenditaId: user.puntoVenditaId,
    }
  } catch (error) {
    // Cancella il token non valido in caso di errore
    try {
      const cookieStore = await cookies()
      cookieStore.delete('auth-token')
    } catch {}
    return null
  }
}


