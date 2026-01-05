import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { uploadToS3, isS3Configured } from '@/lib/s3'
import { canUserUpload, MAX_UPLOAD_SIZE } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    let query = `
      SELECT c.*, cl.ragioneSociale || ' - ' || cl.nome || ' ' || cl.cognome as cliente
      FROM contratti c
      LEFT JOIN clienti cl ON c.clienteId = cl.id
      WHERE 1=1
    `
    const params: any[] = []

    // Filtra per agente o punto vendita
    if (user.ruolo === 'agente') {
      query += ' AND c.agenteId = ?'
      params.push(user.id)
    } else if (user.ruolo === 'punto_vendita') {
      // Il punto vendita vede i contratti dove:
      // 1. agenteId = id punto_vendita (contratti creati dal punto_vendita)
      // 2. agenteId appartiene a un agente con puntoVenditaId = id punto_vendita
      query += ` AND (
        c.agenteId = ? OR 
        EXISTS (SELECT 1 FROM utenti u WHERE u.id = c.agenteId AND u.puntoVenditaId = ?)
      )`
      params.push(user.id, user.id)
    }

    query += ' ORDER BY c.createdAt DESC'

    const contratti = db.prepare(query).all(...params)
    
    return NextResponse.json({
      success: true,
      contratti: contratti.map((c: any) => ({
        id: c.id,
        numero: c.numero,
        cliente: c.cliente,
        clienteId: c.clienteId,
        tipo: c.tipo,
        dataInizio: c.dataInizio,
        dataScadenza: c.dataScadenza,
        importo: c.importo,
        stato: c.stato,
        note: c.note,
      })),
    })
  } catch (error) {
    console.error('Error fetching contratti:', error)
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    // Sia gli agenti che i punto_vendita possono creare contratti
    if (user.ruolo !== 'agente' && user.ruolo !== 'punto_vendita') {
      return NextResponse.json(
        { message: 'Non autorizzato a creare contratti' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const documento = formData.get('documento') as File | null
    const numero = formData.get('numero') as string
    const clienteId = formData.get('clienteId') as string
    const tipo = formData.get('tipo') as string
    const dataInizio = formData.get('dataInizio') as string
    const dataScadenza = formData.get('dataScadenza') as string
    const importo = parseFloat(formData.get('importo') as string)
    const note = formData.get('note') as string || ''
    const stato = (formData.get('stato') as string) || 'attivo'
    const tipoCliente = formData.get('tipoCliente') as string || null

    // Valida
    if (!numero || !clienteId || !tipo || !dataInizio || !dataScadenza || isNaN(importo)) {
      return NextResponse.json(
        { message: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      )
    }

    // Valida e gestisci documento se presente
    if (documento && documento.size > 0) {
      // Valida dimensione
      if (documento.size > MAX_UPLOAD_SIZE) {
        return NextResponse.json(
          { message: `File troppo grande. Dimensione massima: ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB` },
          { status: 400 }
        )
      }

      // Valida tipo file
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(documento.type)) {
        return NextResponse.json(
          { message: 'Formato file non supportato. Usa PDF, PNG, JPG o JPEG' },
          { status: 400 }
        )
      }

      // Verifica spazio disponibile
      const storageCheck = canUserUpload(user.id, documento.size)
      if (!storageCheck.canUpload) {
        return NextResponse.json(
          { message: storageCheck.message },
          { status: 400 }
        )
      }
    }

    // Ottieni il cliente e verifica l'autorizzazione
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(clienteId) as any
    if (!cliente) {
      return NextResponse.json(
        { message: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    let finalAgenteId = cliente.agenteId

    // Verifica l'autorizzazione
    if (user.ruolo === 'agente') {
      // L'agente può creare contratti solo per i propri clienti
      if (cliente.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Cliente non autorizzato' },
          { status: 403 }
        )
      }
    } else if (user.ruolo === 'punto_vendita') {
      // Il punto vendita può creare contratti per:
      // 1. Clienti creati dal punto_vendita direttamente (agenteId = id punto_vendita)
      // 2. Clienti dei loro agenti (agenteId appartiene a un agente con puntoVenditaId = id punto_vendita)
      if (cliente.agenteId === user.id) {
        // Cliente creato dal punto_vendita
        finalAgenteId = user.id
      } else {
        // Controlla se il cliente appartiene a uno degli agenti del punto_vendita
        const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(cliente.agenteId) as any
        if (!agente || agente.puntoVenditaId !== user.id) {
          return NextResponse.json(
            { message: 'Cliente non autorizzato' },
            { status: 403 }
          )
        }
        // Usa l'agenteId del cliente (l'agente che ha creato il cliente)
        finalAgenteId = cliente.agenteId
      }
    }

    // Controlla se il numero esiste
    const existing = db.prepare('SELECT id FROM contratti WHERE numero = ?').get(numero)
    if (existing) {
      return NextResponse.json(
        { message: 'Numero contratto già esistente' },
        { status: 400 }
      )
    }

    const id = uuidv4()

    db.prepare(`
      INSERT INTO contratti (id, numero, clienteId, agenteId, tipo, dataInizio, dataScadenza, importo, note, stato, tipoCliente)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, numero, clienteId, finalAgenteId, tipo, dataInizio, dataScadenza, importo, note || null, stato || 'attivo', tipoCliente || null)

    // Gestisci upload documento se presente
    if (documento && documento.size > 0) {
      try {
        const bytes = await documento.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const fileExtension = documento.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExtension}`
        
        let storagePath: string
        if (isS3Configured()) {
          const s3Key = `documenti/${user.id}/${fileName}`
          storagePath = await uploadToS3(s3Key, buffer, documento.type || 'application/octet-stream')
        } else {
          const { writeFile, mkdir } = await import('fs/promises')
          const { join } = await import('path')
          const { existsSync } = await import('fs')
          
          const uploadsDir = join(process.cwd(), 'uploads')
          if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
          }
          
          const filePath = join(uploadsDir, fileName)
          await writeFile(filePath, buffer)
          storagePath = `/uploads/${fileName}`
        }

        const fileSizeInBytes = buffer.length
        const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2)
        const documentoId = uuidv4()

        // Salva il documento nel database
        db.prepare(`
          INSERT INTO documenti (id, nome, tipo, categoria, dimensione, dimensioneBytes, path, userId, contrattoId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          documentoId,
          documento.name,
          documento.type || 'application/octet-stream',
          'Contratti',
          `${fileSizeInMB} MB`,
          fileSizeInBytes,
          storagePath,
          user.id,
          id
        )
      } catch (uploadError) {
        console.error('Error uploading documento:', uploadError)
        // Non bloccare la creazione del contratto se l'upload fallisce
      }
    }

    return NextResponse.json({
      success: true,
      contratto: {
        id,
        numero,
        clienteId,
        agenteId: finalAgenteId,
        tipo,
        dataInizio,
        dataScadenza,
        importo,
        stato: stato || 'attivo',
        note,
        tipoCliente: tipoCliente || null,
      },
    })
  } catch (error: any) {
    console.error('Error creating contratto:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    })
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { message: 'Numero contratto già esistente' },
        { status: 400 }
      )
    }
    if (error.message?.includes('no such column')) {
      return NextResponse.json(
        { message: 'Errore database: colonna mancante. Ricarica la pagina.' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

