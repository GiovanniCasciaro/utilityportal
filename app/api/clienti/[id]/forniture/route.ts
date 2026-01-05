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

    const forniture = db.prepare('SELECT * FROM forniture WHERE clienteId = ? ORDER BY createdAt DESC').all(params.id)

    return NextResponse.json({
      success: true,
      forniture,
    })
  } catch (error: any) {
    console.error('Error fetching forniture:', error)
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

    const { 
      podPdr, indirizzoFornitura, consumoAnnuale, tipologiaContratto, stato,
      prestazione, fornitore, offerta, prezzo, ccv, scadenza,
      compenso, commissione, operatore, nrPratica, linkPortale,
      checkPagamento, checkStorno, esitoContratto, tipologia, note
    } = await request.json()

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
      INSERT INTO forniture (
        id, clienteId, podPdr, indirizzoFornitura, consumoAnnuale, tipologiaContratto, stato,
        prestazione, fornitore, offerta, prezzo, ccv, scadenza,
        compenso, commissione, operatore, nrPratica, linkPortale,
        checkPagamento, checkStorno, esitoContratto, tipologia, note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.id,
      podPdr || null,
      indirizzoFornitura || null,
      consumoAnnuale || null,
      tipologiaContratto || 'Residenziale',
      stato || 'Attivo',
      prestazione || null,
      fornitore || null,
      offerta || null,
      prezzo || null,
      ccv || null,
      scadenza || null,
      compenso || null,
      commissione || null,
      operatore || null,
      nrPratica || null,
      linkPortale || null,
      checkPagamento ? 1 : 0,
      checkStorno ? 1 : 0,
      esitoContratto || null,
      tipologia || null,
      note || null
    )

    const fornitura = db.prepare('SELECT * FROM forniture WHERE id = ?').get(id)

    return NextResponse.json({
      success: true,
      fornitura,
    })
  } catch (error: any) {
    console.error('Error creating fornitura:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

