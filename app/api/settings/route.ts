import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    // Valida il nome (può essere vuoto per rimuoverlo)
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json(
        { message: 'Nome non valido' },
        { status: 400 }
      )
    }

    // Aggiorna il nome utente
    try {
      db.prepare(`
        UPDATE utenti 
        SET nome = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).run(name || null, user.id)

      // Recupera l'utente aggiornato
      const updatedUser = db.prepare('SELECT id, email, nome, ruolo, puntoVenditaId FROM utenti WHERE id = ?').get(user.id) as any

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.nome || undefined,
          ruolo: updatedUser.ruolo,
          puntoVenditaId: updatedUser.puntoVenditaId || undefined,
        },
      })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { message: 'Errore durante il salvataggio' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

