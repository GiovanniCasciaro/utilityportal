import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    // Solo gli agenti possono riassegnare i propri clienti
    if (user.ruolo !== 'agente') {
      return NextResponse.json(
        { message: 'Solo gli agenti possono riassegnare clienti' },
        { status: 403 }
      )
    }

    const { nuovoAgenteId } = await request.json()

    if (!nuovoAgenteId) {
      return NextResponse.json(
        { message: 'Nuovo agente non specificato' },
        { status: 400 }
      )
    }

    // Verifica che il cliente esista e appartenga all'agente corrente
    const cliente = db.prepare('SELECT * FROM clienti WHERE id = ?').get(params.id) as any
    if (!cliente) {
      return NextResponse.json(
        { message: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il cliente appartenga all'agente corrente
    if (cliente.agenteId !== user.id) {
      return NextResponse.json(
        { message: 'Non autorizzato: questo cliente non ti appartiene' },
        { status: 403 }
      )
    }

    // Verifica che il nuovo agente esista e sia dello stesso punto vendita
    const nuovoAgente = db.prepare('SELECT * FROM utenti WHERE id = ? AND ruolo = ?').get(nuovoAgenteId, 'agente') as any
    if (!nuovoAgente) {
      return NextResponse.json(
        { message: 'Nuovo agente non trovato o non valido' },
        { status: 404 }
      )
    }

    // Verifica che il nuovo agente sia dello stesso punto vendita
    if (user.puntoVenditaId && nuovoAgente.puntoVenditaId !== user.puntoVenditaId) {
      return NextResponse.json(
        { message: 'Il nuovo agente deve appartenere allo stesso punto vendita' },
        { status: 400 }
      )
    }

    // Verifica che non si stia riassegnando a se stesso
    if (nuovoAgenteId === user.id) {
      return NextResponse.json(
        { message: 'Non puoi riassegnare il cliente a te stesso' },
        { status: 400 }
      )
    }

    // Verifica che il nuovo agente sia attivo
    if (!nuovoAgente.attivo) {
      return NextResponse.json(
        { message: 'Il nuovo agente non è attivo' },
        { status: 400 }
      )
    }

    // Inizia una transazione per aggiornare cliente e contratti
    const transaction = db.transaction(() => {
      // Aggiorna il cliente con il nuovo agenteId
      db.prepare(`
        UPDATE clienti 
        SET agenteId = ?, updatedAt = datetime('now')
        WHERE id = ?
      `).run(nuovoAgenteId, params.id)

      // Aggiorna tutti i contratti collegati al cliente con il nuovo agenteId
      db.prepare(`
        UPDATE contratti 
        SET agenteId = ?, updatedAt = datetime('now')
        WHERE clienteId = ?
      `).run(nuovoAgenteId, params.id)

      // Aggiorna anche le fatture collegate ai contratti di questo cliente
      db.prepare(`
        UPDATE fatture 
        SET agenteId = ?, updatedAt = datetime('now')
        WHERE clienteId = ?
      `).run(nuovoAgenteId, params.id)
    })

    // Esegui la transazione
    transaction()

    return NextResponse.json({
      success: true,
      message: 'Cliente e contratti riassegnati con successo',
    })
  } catch (error: any) {
    console.error('Error reassigning cliente:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

