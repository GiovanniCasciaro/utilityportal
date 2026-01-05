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
    
    // Leggi con header per ottenere i nomi delle colonne
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '', // Valore di default per celle vuote
      raw: false // Converti tutto in stringhe
    }) as any[]

    if (data.length === 0) {
      return NextResponse.json(
        { message: 'Il file Excel è vuoto o non contiene dati' },
        { status: 400 }
      )
    }

    // Log per debug: mostra le prime righe e i nomi delle colonne
    console.log('Excel columns found:', Object.keys(data[0] || {}))
    console.log('First row sample:', data[0])

    let imported = 0
    let errors: string[] = []

    // Processa ogni riga
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      const rowNumber = rowIndex + 2 // +2 perché Excel inizia da 1 e c'è l'header
      
      try {
        // Funzione helper per trovare il valore ignorando case e spazi
        const getField = (variants: string[]): string => {
          for (const variant of variants) {
            // Cerca esattamente
            if (row[variant] !== undefined && row[variant] !== null && String(row[variant]).trim() !== '') {
              return String(row[variant]).trim()
            }
            // Cerca case-insensitive
            const lowerVariant = variant.toLowerCase()
            for (const key in row) {
              if (key.toLowerCase() === lowerVariant && String(row[key]).trim() !== '') {
                return String(row[key]).trim()
              }
            }
          }
          return ''
        }

        // Mappa i campi Excel ai campi del database con più varianti
        const nome = getField(['Nome', 'nome', 'NOME', 'Name', 'name'])
        const cognome = getField(['Cognome', 'cognome', 'COGNOME', 'Surname', 'surname', 'Last Name', 'lastname'])
        const codiceFiscale = getField(['Codice Fiscale', 'codice_fiscale', 'codice fiscale', 'CF', 'cf', 'CodiceFiscale', 'codiceFiscale', 'CodiceFiscale'])
        const email = getField(['Email', 'email', 'EMAIL', 'E-mail', 'e-mail', 'E-Mail'])
        const cellulare = getField(['Cellulare', 'cellulare', 'Telefono', 'telefono', 'Phone', 'phone', 'Tel', 'tel', 'Mobile', 'mobile'])
        const ragioneSociale = getField(['Ragione Sociale', 'ragione_sociale', 'ragione sociale', 'RagioneSociale', 'ragioneSociale', 'Company', 'company', 'Azienda', 'azienda'])
        const piva = getField(['P.IVA', 'piva', 'PIVA', 'Partita IVA', 'partita_iva', 'partita iva', 'PartitaIVA', 'VAT', 'vat'])
        const pec = getField(['PEC', 'pec', 'Pec'])
        const codiceAteco = getField(['Codice ATECO', 'codice_ateco', 'codice ateco', 'CodiceAteco', 'codiceAteco', 'ATECO', 'ateco'])
        const modalitaPagamento = getField(['Modalità Pagamento', 'modalita_pagamento', 'modalità pagamento', 'ModalitaPagamento', 'modalitaPagamento', 'Payment', 'payment'])
        const stato = getField(['Stato', 'stato', 'Status', 'status']) || 'attivo'

        // Debug per la prima riga
        if (rowIndex === 0) {
          console.log('Parsed first row:', { nome, cognome, codiceFiscale, email, cellulare })
        }

        // Valida campi obbligatori
        if (!nome || !cognome || !codiceFiscale) {
          const missing = []
          if (!nome) missing.push('Nome')
          if (!cognome) missing.push('Cognome')
          if (!codiceFiscale) missing.push('Codice Fiscale')
          errors.push(`Riga ${rowNumber}: Campi obbligatori mancanti: ${missing.join(', ')}. Colonne trovate: ${Object.keys(row).join(', ')}`)
          continue
        }

        const id = uuidv4()
        const dataRegistrazione = new Date().toISOString()
        const finalRagioneSociale = ragioneSociale || `${nome} ${cognome}`

        // Inserisci nel database
        try {
          db.prepare(`
            INSERT INTO clienti (
              id, agenteId, ragioneSociale, pec, nomePersonaFisica, piva,
              codiceDestinatario, nome, cognome, codiceFiscale, email, cellulare,
              codiceAteco, modalitaPagamento, stato, dataRegistrazione
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            user.id,
            finalRagioneSociale,
            pec || null,
            null,
            piva || null,
            null,
            nome,
            cognome,
            codiceFiscale,
            email || null,
            cellulare || null,
            codiceAteco || null,
            modalitaPagamento || null,
            stato || 'attivo',
            dataRegistrazione
          )
          imported++
        } catch (dbError: any) {
          if (dbError.message?.includes('UNIQUE constraint')) {
            errors.push(`Riga ${rowNumber}: Cliente già esistente (${nome} ${cognome} - CF: ${codiceFiscale})`)
          } else {
            errors.push(`Riga ${rowNumber}: Errore database - ${dbError.message || 'Errore sconosciuto'}`)
            console.error(`Database error for row ${rowNumber}:`, dbError)
          }
        }
      } catch (error: any) {
        errors.push(`Riga ${rowNumber}: ${error.message || 'Errore sconosciuto'}`)
        console.error(`Error processing row ${rowNumber}:`, error)
      }
    }

    const responseMessage = imported > 0 
      ? `Import completato: ${imported} clienti importati${errors.length > 0 ? `, ${errors.length} errori` : ''}`
      : `Nessun cliente importato. ${errors.length > 0 ? `${errors.length} errori trovati.` : 'Verifica che il file Excel contenga le colonne: Nome, Cognome, Codice Fiscale'}`

    return NextResponse.json({
      success: imported > 0,
      imported,
      totalRows: data.length,
      errors: errors.length > 0 ? errors : undefined,
      message: responseMessage,
    })
  } catch (error: any) {
    console.error('Error importing Excel:', error)
    return NextResponse.json(
      { message: error.message || 'Errore durante l\'import' },
      { status: 500 }
    )
  }
}

