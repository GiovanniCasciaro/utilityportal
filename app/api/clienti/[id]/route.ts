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

    const cliente = db.prepare(`
      SELECT c.*, u.nome as agenteNome, u.email as agenteEmail
      FROM clienti c
      LEFT JOIN utenti u ON c.agenteId = u.id
      WHERE c.id = ?
    `).get(params.id) as any

    if (!cliente) {
      return NextResponse.json(
        { message: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Verifica autorizzazione
    if (user.ruolo === 'agente') {
      if (cliente.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    } else if (user.ruolo === 'punto_vendita') {
      if (cliente.agenteId !== user.id) {
        const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(cliente.agenteId) as any
        if (!agente || agente.puntoVenditaId !== user.id) {
          return NextResponse.json(
            { message: 'Non autorizzato' },
            { status: 403 }
          )
        }
      }
    }

    // Carica referenti e forniture
    const referenti = db.prepare('SELECT * FROM referenti WHERE clienteId = ? ORDER BY createdAt DESC').all(params.id)
    const forniture = db.prepare('SELECT * FROM forniture WHERE clienteId = ? ORDER BY createdAt DESC').all(params.id)

    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        agenteId: cliente.agenteId,
        agenteNome: cliente.agenteNome,
        ragioneSociale: cliente.ragioneSociale,
        pec: cliente.pec,
        nomePersonaFisica: cliente.nomePersonaFisica,
        piva: cliente.piva,
        codiceDestinatario: cliente.codiceDestinatario,
        nome: cliente.nome,
        cognome: cliente.cognome,
        codiceFiscale: cliente.codiceFiscale,
        email: cliente.email,
        cellulare: cliente.cellulare,
        codiceAteco: cliente.codiceAteco,
        modalitaPagamento: cliente.modalitaPagamento,
        stato: cliente.stato,
        dataRegistrazione: cliente.dataRegistrazione,
        indirizzoResidenza: cliente.indirizzoResidenza || null,
        iban: cliente.iban || null,
      },
      referenti,
      forniture,
    })
  } catch (error) {
    console.error('Error fetching cliente:', error)
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

    // Verifica che il cliente esista
    const existingCliente = db.prepare('SELECT * FROM clienti WHERE id = ?').get(params.id) as any
    if (!existingCliente) {
      return NextResponse.json(
        { message: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Verifica autorizzazione
    if (user.ruolo === 'agente') {
      if (existingCliente.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    } else if (user.ruolo === 'punto_vendita') {
      if (existingCliente.agenteId !== user.id) {
        const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(existingCliente.agenteId) as any
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

    // Estrai i dati dal form e applica trim
    const ragioneSociale = (formData.get('ragioneSociale') as string || '').trim()
    const pec = (formData.get('pec') as string || '').trim()
    const nomePersonaFisica = (formData.get('nomePersonaFisica') as string || '').trim()
    const piva = (formData.get('piva') as string || '').trim()
    const codiceDestinatario = (formData.get('codiceDestinatario') as string || '').trim()
    const nome = (formData.get('nome') as string || '').trim()
    const cognome = (formData.get('cognome') as string || '').trim()
    const codiceFiscale = (formData.get('codiceFiscale') as string || '').trim()
    const email = (formData.get('email') as string || '').trim()
    const cellulare = (formData.get('cellulare') as string || '').trim()
    const codiceAteco = (formData.get('codiceAteco') as string || '').trim()
    const modalitaPagamento = (formData.get('modalitaPagamento') as string || '').trim()
    const stato = ((formData.get('stato') as string) || 'attivo').trim()

    // Debug log per verificare i valori ricevuti
    console.log('PUT /api/clienti/[id] - Dati ricevuti:', {
      id: params.id,
      nome,
      cognome,
      codiceFiscale,
      ragioneSociale,
      email,
    })

    // Valida i campi obbligatori
    if (!nome || !cognome || !codiceFiscale) {
      console.error('Validazione fallita:', { nome, cognome, codiceFiscale })
      return NextResponse.json(
        { message: 'Nome, Cognome e Codice Fiscale sono obbligatori' },
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

    // Per domestico, ragioneSociale potrebbe essere vuoto, usa nome + cognome
    // Ma solo se non è stato fornito un valore esplicito
    const finalRagioneSociale = ragioneSociale || `${nome} ${cognome}`

    // Aggiorna il cliente
    try {
      const result = db.prepare(`
        UPDATE clienti SET
          ragioneSociale = ?,
          pec = ?,
          nomePersonaFisica = ?,
          piva = ?,
          codiceDestinatario = ?,
          nome = ?,
          cognome = ?,
          codiceFiscale = ?,
          email = ?,
          cellulare = ?,
          codiceAteco = ?,
          modalitaPagamento = ?,
          stato = ?,
          updatedAt = datetime('now')
        WHERE id = ?
      `).run(
        finalRagioneSociale || null,
        pec || null,
        nomePersonaFisica || null,
        piva || null,
        codiceDestinatario || null,
        nome,
        cognome,
        codiceFiscale,
        email || null,
        cellulare || null,
        codiceAteco || null,
        modalitaPagamento || null,
        stato || 'attivo',
        params.id
      )
      
      // Verifica che l'aggiornamento sia avvenuto
      console.log('UPDATE eseguito:', { changes: result.changes, nome, cognome })
      if (result.changes === 0) {
        console.error('Nessuna modifica effettuata nel database')
        return NextResponse.json(
          { message: 'Nessuna modifica effettuata' },
          { status: 400 }
        )
      }
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      if (dbError.message?.includes('UNIQUE constraint')) {
        return NextResponse.json(
          { message: 'Cliente già esistente (CF o email duplicati)' },
          { status: 400 }
        )
      }
      throw dbError
    }

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
          INSERT INTO documenti (id, nome, tipo, categoria, dimensione, dimensioneBytes, path, userId, clienteId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          documentoId,
          documento.name,
          documento.type || 'application/octet-stream',
          'Clienti',
          `${fileSizeInMB} MB`,
          fileSizeInBytes,
          storagePath,
          user.id,
          params.id
        )
      } catch (uploadError) {
        console.error('Error uploading documento:', uploadError)
        // Non bloccare l'aggiornamento del cliente se l'upload fallisce
      }
    }

    // Recupera il cliente aggiornato
    const updatedCliente = db.prepare(`
      SELECT c.*, u.nome as agenteNome
      FROM clienti c
      LEFT JOIN utenti u ON c.agenteId = u.id
      WHERE c.id = ?
    `).get(params.id) as any

    // Carica referenti e forniture
    const referenti = db.prepare('SELECT * FROM referenti WHERE clienteId = ? ORDER BY createdAt DESC').all(params.id)
    const forniture = db.prepare('SELECT * FROM forniture WHERE clienteId = ? ORDER BY createdAt DESC').all(params.id)

    return NextResponse.json({
      success: true,
      cliente: {
        id: updatedCliente.id,
        agenteId: updatedCliente.agenteId,
        agenteNome: updatedCliente.agenteNome,
        ragioneSociale: updatedCliente.ragioneSociale,
        pec: updatedCliente.pec,
        nomePersonaFisica: updatedCliente.nomePersonaFisica,
        piva: updatedCliente.piva,
        codiceDestinatario: updatedCliente.codiceDestinatario,
        nome: updatedCliente.nome,
        cognome: updatedCliente.cognome,
        codiceFiscale: updatedCliente.codiceFiscale,
        email: updatedCliente.email,
        cellulare: updatedCliente.cellulare,
        codiceAteco: updatedCliente.codiceAteco,
        modalitaPagamento: updatedCliente.modalitaPagamento,
        stato: updatedCliente.stato,
        dataRegistrazione: updatedCliente.dataRegistrazione,
        indirizzoResidenza: updatedCliente.indirizzoResidenza || null,
        iban: updatedCliente.iban || null,
      },
      referenti,
      forniture,
    })
  } catch (error: any) {
    console.error('Error updating cliente:', error)
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

    const cliente = db.prepare('SELECT * FROM clienti WHERE id = ?').get(params.id) as any
    if (!cliente) {
      return NextResponse.json(
        { message: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Verifica l'autorizzazione
    if (user.ruolo === 'agente') {
      if (cliente.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    } else if (user.ruolo === 'punto_vendita') {
      if (cliente.agenteId !== user.id) {
        const agente = db.prepare('SELECT puntoVenditaId FROM utenti WHERE id = ?').get(cliente.agenteId) as any
        if (!agente || agente.puntoVenditaId !== user.id) {
          return NextResponse.json(
            { message: 'Non autorizzato' },
            { status: 403 }
          )
        }
      }
    }

    // Controlla se il cliente ha contratti
    const contratti = db.prepare('SELECT id FROM contratti WHERE clienteId = ?').all(params.id) as any[]
    if (contratti.length > 0) {
      return NextResponse.json(
        { message: 'Impossibile eliminare: il cliente ha contratti associati. Elimina prima i contratti.' },
        { status: 400 }
      )
    }

    // Elimina i documenti associati
    const documenti = db.prepare('SELECT path FROM documenti WHERE clienteId = ?').all(params.id) as any[]
    for (const doc of documenti) {
      if (doc.path) {
        const filePath = join(process.cwd(), doc.path.replace('/uploads/', 'uploads/'))
        if (existsSync(filePath)) {
          await unlink(filePath).catch(() => {})
        }
      }
    }
    db.prepare('DELETE FROM documenti WHERE clienteId = ?').run(params.id)

    // Elimina il cliente
    db.prepare('DELETE FROM clienti WHERE id = ?').run(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting cliente:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}
