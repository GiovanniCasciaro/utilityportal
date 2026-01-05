import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che il cliente esista e appartenga all'utente
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(params.id) as any
    if (!cliente) {
      return NextResponse.json({ message: 'Cliente non trovato' }, { status: 404 })
    }

    if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 })
    }

    const referenti = db.prepare('SELECT * FROM referenti WHERE clienteId = ? ORDER BY createdAt DESC').all(params.id)

    return NextResponse.json({
      success: true,
      referenti,
    })
  } catch (error: any) {
    console.error('Error fetching referenti:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Verifica che il cliente esista e appartenga all'utente
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(params.id) as any
    if (!cliente) {
      return NextResponse.json({ message: 'Cliente non trovato' }, { status: 404 })
    }

    if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 })
    }

    const id = uuidv4()
    db.prepare(`
      INSERT INTO referenti (id, clienteId, cognome, nome, cellulare)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, params.id, cognome, nome, cellulare || null)

    const referente = db.prepare('SELECT * FROM referenti WHERE id = ?').get(id)

    return NextResponse.json({
      success: true,
      referente,
    })
  } catch (error: any) {
    console.error('Error creating referente:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

