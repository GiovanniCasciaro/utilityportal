import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    let puntoVenditaId: string

    if (user.ruolo === 'punto_vendita') {
      puntoVenditaId = user.id
    } else if (user.ruolo === 'agente') {
      // Gli agenti possono vedere gli altri agenti dello stesso punto vendita
      if (!user.puntoVenditaId) {
        return NextResponse.json(
          { message: 'Agente non associato a un punto vendita' },
          { status: 403 }
        )
      }
      puntoVenditaId = user.puntoVenditaId
    } else {
      return NextResponse.json(
        { message: 'Ruolo non autorizzato' },
        { status: 403 }
      )
    }

    const agenti = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.nome,
        u.attivo,
        COUNT(DISTINCT c.id) as clientiCount,
        COUNT(DISTINCT ct.id) as contrattiCount
      FROM utenti u
      LEFT JOIN clienti c ON c.agenteId = u.id
      LEFT JOIN contratti ct ON ct.agenteId = u.id
      WHERE u.puntoVenditaId = ? AND u.ruolo = 'agente' AND u.attivo = 1
      GROUP BY u.id, u.email, u.nome, u.attivo
      ORDER BY u.nome
    `).all(puntoVenditaId) as any

    return NextResponse.json({
      success: true,
      agenti: agenti.map((a: any) => ({
        id: a.id,
        email: a.email,
        nome: a.nome,
        attivo: a.attivo,
        clientiCount: a.clientiCount || 0,
        contrattiCount: a.contrattiCount || 0,
      })),
    })
  } catch (error) {
    console.error('Error fetching agenti:', error)
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}


