import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { uploadToS3, isS3Configured } from '@/lib/s3'
import { canUserUpload, MAX_UPLOAD_SIZE } from '@/lib/storage'
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

    const contratto = db.prepare(`
      SELECT c.*, cl.ragioneSociale || ' - ' || cl.nome || ' ' || cl.cognome as cliente
      FROM contratti c
      LEFT JOIN clienti cl ON c.clienteId = cl.id
      WHERE c.id = ?
    `).get(params.id) as any

    if (!contratto) {
      return NextResponse.json(
        { message: 'Contratto non trovato' },
        { status: 404 }
      )
    }

    // Verifica autorizzazione
    if (user.ruolo === 'agente') {
      if (contratto.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    } else if (user.ruolo === 'punto_vendita') {
      if (contratto.agenteId !== user.id) {
        const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(contratto.agenteId) as any
        if (!agente || agente.puntoVenditaId !== user.id) {
          return NextResponse.json(
            { message: 'Non autorizzato' },
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      contratto: {
        id: contratto.id,
        numero: contratto.numero,
        clienteId: contratto.clienteId,
        cliente: contratto.cliente,
        tipo: contratto.tipo,
        tipoCliente: contratto.tipoCliente,
        dataInizio: contratto.dataInizio,
        dataScadenza: contratto.dataScadenza,
        importo: contratto.importo,
        stato: contratto.stato,
        note: contratto.note,
        agenteId: contratto.agenteId,
      },
    })
  } catch (error) {
    console.error('Error fetching contratto:', error)
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    // Verifica che il contratto esista
    const existingContratto = db.prepare('SELECT * FROM contratti WHERE id = ?').get(params.id) as any
    if (!existingContratto) {
      return NextResponse.json(
        { message: 'Contratto non trovato' },
        { status: 404 }
      )
    }

    // Verifica autorizzazione
    if (user.ruolo === 'agente') {
      if (existingContratto.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    } else if (user.ruolo === 'punto_vendita') {
      if (existingContratto.agenteId !== user.id) {
        const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(existingContratto.agenteId) as any
        if (!agente || agente.puntoVenditaId !== user.id) {
          return NextResponse.json(
            { message: 'Non autorizzato' },
            { status: 403 }
          )
        }
      }
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

    // Verifica che il cliente esista e l'autorizzazione
    const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(clienteId) as any
    if (!cliente) {
      return NextResponse.json(
        { message: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    let finalAgenteId = existingContratto.agenteId

    // Verifica l'autorizzazione sul nuovo cliente se è cambiato
    if (clienteId !== existingContratto.clienteId) {
      if (user.ruolo === 'agente') {
        if (cliente.agenteId !== user.id) {
          return NextResponse.json(
            { message: 'Cliente non autorizzato' },
            { status: 403 }
          )
        }
        finalAgenteId = user.id
      } else if (user.ruolo === 'punto_vendita') {
        if (cliente.agenteId === user.id) {
          finalAgenteId = user.id
        } else {
          const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(cliente.agenteId) as any
          if (!agente || agente.puntoVenditaId !== user.id) {
            return NextResponse.json(
              { message: 'Cliente non autorizzato' },
              { status: 403 }
            )
          }
          finalAgenteId = cliente.agenteId
        }
      }
    }

    // Verifica se il numero contratto esiste già (se è cambiato)
    if (numero !== existingContratto.numero) {
      const existing = db.prepare('SELECT id FROM contratti WHERE numero = ?').get(numero)
      if (existing) {
        return NextResponse.json(
          { message: 'Numero contratto già esistente' },
          { status: 400 }
        )
      }
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

    // Aggiorna il contratto
    db.prepare(`
      UPDATE contratti SET
        numero = ?,
        clienteId = ?,
        agenteId = ?,
        tipo = ?,
        dataInizio = ?,
        dataScadenza = ?,
        importo = ?,
        note = ?,
        stato = ?,
        tipoCliente = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `).run(
      numero,
      clienteId,
      finalAgenteId,
      tipo,
      dataInizio,
      dataScadenza,
      importo,
      note || null,
      stato || 'attivo',
      tipoCliente || null,
      params.id
    )

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
          params.id
        )
      } catch (uploadError) {
        console.error('Error uploading documento:', uploadError)
        // Non bloccare l'aggiornamento del contratto se l'upload fallisce
      }
    }

    // Recupera il contratto aggiornato
    const updatedContratto = db.prepare(`
      SELECT c.*, cl.ragioneSociale || ' - ' || cl.nome || ' ' || cl.cognome as cliente
      FROM contratti c
      LEFT JOIN clienti cl ON c.clienteId = cl.id
      WHERE c.id = ?
    `).get(params.id) as any

    return NextResponse.json({
      success: true,
      contratto: {
        id: updatedContratto.id,
        numero: updatedContratto.numero,
        clienteId: updatedContratto.clienteId,
        cliente: updatedContratto.cliente,
        tipo: updatedContratto.tipo,
        tipoCliente: updatedContratto.tipoCliente,
        dataInizio: updatedContratto.dataInizio,
        dataScadenza: updatedContratto.dataScadenza,
        importo: updatedContratto.importo,
        stato: updatedContratto.stato,
        note: updatedContratto.note,
        agenteId: updatedContratto.agenteId,
      },
    })
  } catch (error: any) {
    console.error('Error updating contratto:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const contratto = db.prepare('SELECT * FROM contratti WHERE id = ?').get(params.id) as any
    if (!contratto) {
      return NextResponse.json(
        { message: 'Contratto non trovato' },
        { status: 404 }
      )
    }

    // Verifica l'autorizzazione
    if (user.ruolo === 'agente') {
      if (contratto.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    } else if (user.ruolo === 'punto_vendita') {
      if (contratto.agenteId !== user.id) {
        const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(contratto.agenteId) as any
        if (!agente || agente.puntoVenditaId !== user.id) {
          return NextResponse.json(
            { message: 'Non autorizzato' },
            { status: 403 }
          )
        }
      }
    }

    // Elimina i documenti associati
    const documenti = db.prepare('SELECT path FROM documenti WHERE contrattoId = ?').all(params.id) as any[]
    for (const doc of documenti) {
      if (doc.path) {
        const filePath = join(process.cwd(), doc.path.replace('/uploads/', 'uploads/'))
        if (existsSync(filePath)) {
          await unlink(filePath).catch(() => {})
        }
      }
    }
    db.prepare('DELETE FROM documenti WHERE contrattoId = ?').run(params.id)

    // Elimina il contratto
    db.prepare('DELETE FROM contratti WHERE id = ?').run(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting contratto:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}


