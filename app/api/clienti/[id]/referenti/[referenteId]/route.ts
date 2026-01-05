import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; referenteId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const { cognome, nome, cellulare } = await request.json()

    if (!cognome || !nome) {
      return NextResponse.json(
        { message: 'Cognome e Nome sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica che il referente esista e appartenga al cliente
    const referente = db.prepare('SELECT * FROM referenti WHERE id = ? AND clienteId = ?').get(params.referenteId, params.id) as any
    if (!referente) {
      return NextResponse.json({ message: 'Referente non trovato' }, { status: 404 })
    }

    // Verifica autorizzazione sul cliente
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(params.id) as any
    if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 })
    }

    db.prepare(`
      UPDATE referenti 
      SET cognome = ?, nome = ?, cellulare = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(cognome, nome, cellulare || null, params.referenteId)

    const updated = db.prepare('SELECT * FROM referenti WHERE id = ?').get(params.referenteId)

    return NextResponse.json({
      success: true,
      referente: updated,
    })
  } catch (error: any) {
    console.error('Error updating referente:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; referenteId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che il referente esista e appartenga al cliente
    const referente = db.prepare('SELECT * FROM referenti WHERE id = ? AND clienteId = ?').get(params.referenteId, params.id) as any
    if (!referente) {
      return NextResponse.json({ message: 'Referente non trovato' }, { status: 404 })
    }

    // Verifica autorizzazione sul cliente
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(params.id) as any
    if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 })
    }

    db.prepare('DELETE FROM referenti WHERE id = ?').run(params.referenteId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting referente:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

