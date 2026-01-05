import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    let stats: any = {}

    if (user.ruolo === 'punto_vendita') {
      // Il punto vendita vede tutti i dati degli agenti
      const agenti = db.prepare(`
        SELECT COUNT(*) as count FROM utenti 
        WHERE puntoVenditaId = ? AND ruolo = 'agente' AND attivo = 1
      `).get(user.id) as any

      const clienti = db.prepare(`
        SELECT COUNT(*) as count FROM clienti c
        LEFT JOIN utenti u ON c.agenteId = u.id
        WHERE u.puntoVenditaId = ?
      `).get(user.id) as any

      const contratti = db.prepare(`
        SELECT COUNT(*) as count FROM contratti c
        LEFT JOIN utenti u ON c.agenteId = u.id
        WHERE u.puntoVenditaId = ? AND c.stato = 'attivo'
      `).get(user.id) as any

      stats = {
        agenti: agenti?.count || 0,
        clienti: clienti?.count || 0,
        contratti: contratti?.count || 0,
        fatturato: '0',
        chiamate: '0',
      }
    } else {
      // L'agente vede solo i propri dati
      const clienti = db.prepare('SELECT COUNT(*) as count FROM clienti WHERE agenteId = ?').get(user.id) as any
      const contratti = db.prepare('SELECT COUNT(*) as count FROM contratti WHERE agenteId = ? AND stato = "attivo"').get(user.id) as any

      stats = {
        clienti: clienti?.count || 0,
        contratti: contratti?.count || 0,
        fatturato: '0',
        chiamate: '0',
      }
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}


