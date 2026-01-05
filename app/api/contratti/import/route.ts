import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'Nessun file fornito' },
        { status: 400 }
      )
    }

    // Leggi il file Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    if (data.length === 0) {
      return NextResponse.json(
        { message: 'Il file Excel è vuoto' },
        { status: 400 }
      )
    }

    let imported = 0
    let errors: string[] = []

    // Processa ogni riga
    for (const row of data) {
      try {
        // Mappa i campi Excel ai campi del database
        const numero = row['Numero'] || row['numero'] || row['Numero Contratto'] || ''
        const clienteId = row['Cliente ID'] || row['cliente_id'] || row['ClienteId'] || ''
        const tipo = row['Tipo'] || row['tipo'] || row['Tipo Contratto'] || ''
        const dataInizio = row['Data Inizio'] || row['data_inizio'] || row['DataInizio'] || ''
        const dataScadenza = row['Data Scadenza'] || row['data_scadenza'] || row['DataScadenza'] || ''
        const importo = parseFloat(row['Importo'] || row['importo'] || row['Importo Mensile'] || '0')
        const note = row['Note'] || row['note'] || ''
        const stato = row['Stato'] || row['stato'] || 'attivo'
        const tipoCliente = row['Tipo Cliente'] || row['tipo_cliente'] || 'domestico'

        // Valida campi obbligatori
        if (!numero || !clienteId || !tipo || !dataInizio || !dataScadenza || isNaN(importo)) {
          errors.push(`Riga ${imported + errors.length + 1}: Campi obbligatori mancanti`)
          continue
        }

        // Verifica che il cliente esista
        const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(clienteId) as any
        if (!cliente) {
          errors.push(`Riga ${imported + errors.length + 1}: Cliente non trovato (ID: ${clienteId})`)
          continue
        }

        // Verifica autorizzazione
        let finalAgenteId = cliente.agenteId
        if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
          errors.push(`Riga ${imported + errors.length + 1}: Cliente non autorizzato`)
          continue
        } else if (user.ruolo === 'punto_vendita') {
          if (cliente.agenteId === user.id) {
            finalAgenteId = user.id
          } else {
            const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(cliente.agenteId) as any
            if (!agente || agente.puntoVenditaId !== user.id) {
              errors.push(`Riga ${imported + errors.length + 1}: Cliente non autorizzato`)
              continue
            }
            finalAgenteId = cliente.agenteId
          }
        }

        // Verifica se il numero contratto esiste già
        const existing = db.prepare('SELECT id FROM contratti WHERE numero = ?').get(numero)
        if (existing) {
          errors.push(`Riga ${imported + errors.length + 1}: Numero contratto già esistente (${numero})`)
          continue
        }

        const id = uuidv4()

        // Inserisci nel database
        try {
          db.prepare(`
            INSERT INTO contratti (id, numero, clienteId, agenteId, tipo, dataInizio, dataScadenza, importo, note, stato, tipoCliente)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            numero,
            clienteId,
            finalAgenteId,
            tipo,
            dataInizio,
            dataScadenza,
            importo,
            note || null,
            stato || 'attivo',
            tipoCliente || null
          )
          imported++
        } catch (dbError: any) {
          errors.push(`Riga ${imported + errors.length + 1}: ${dbError.message || 'Errore database'}`)
        }
      } catch (error: any) {
        errors.push(`Riga ${imported + errors.length + 1}: ${error.message || 'Errore sconosciuto'}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Import completato: ${imported} contratti importati${errors.length > 0 ? `, ${errors.length} errori` : ''}`,
    })
  } catch (error: any) {
    console.error('Error importing Excel:', error)
    return NextResponse.json(
      { message: error.message || 'Errore durante l\'import' },
      { status: 500 }
    )
  }
}

