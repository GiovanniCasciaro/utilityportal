import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; fornituraId: string } }
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

    // Verifica che la fornitura esista e appartenga al cliente
    const fornitura = db.prepare('SELECT * FROM forniture WHERE id = ? AND clienteId = ?').get(params.fornituraId, params.id) as any
    if (!fornitura) {
      return NextResponse.json({ message: 'Fornitura non trovata' }, { status: 404 })
    }

    // Verifica autorizzazione sul cliente
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(params.id) as any
    if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 })
    }

    db.prepare(`
      UPDATE forniture 
      SET podPdr = ?, indirizzoFornitura = ?, consumoAnnuale = ?, 
          tipologiaContratto = ?, stato = ?,
          prestazione = ?, fornitore = ?, offerta = ?, prezzo = ?, ccv = ?, scadenza = ?,
          compenso = ?, commissione = ?, operatore = ?, nrPratica = ?, linkPortale = ?,
          checkPagamento = ?, checkStorno = ?, esitoContratto = ?, tipologia = ?, note = ?,
          updatedAt = datetime('now')
      WHERE id = ?
    `).run(
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
      note || null,
      params.fornituraId
    )

    const updated = db.prepare('SELECT * FROM forniture WHERE id = ?').get(params.fornituraId)

    return NextResponse.json({
      success: true,
      fornitura: updated,
    })
  } catch (error: any) {
    console.error('Error updating fornitura:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fornituraId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che la fornitura esista e appartenga al cliente
    const fornitura = db.prepare('SELECT * FROM forniture WHERE id = ? AND clienteId = ?').get(params.fornituraId, params.id) as any
    if (!fornitura) {
      return NextResponse.json({ message: 'Fornitura non trovata' }, { status: 404 })
    }

    // Verifica autorizzazione sul cliente
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(params.id) as any
    if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 })
    }

    db.prepare('DELETE FROM forniture WHERE id = ?').run(params.fornituraId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting fornitura:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

