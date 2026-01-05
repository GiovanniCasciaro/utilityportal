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

    const search = request.nextUrl.searchParams.get('search') || ''
    
    let query = `
      SELECT c.*, u.nome as agenteNome, u.email as agenteEmail
      FROM clienti c
      LEFT JOIN utenti u ON c.agenteId = u.id
      WHERE 1=1
    `
    const params: any[] = []

    // Filtra per agente o punto vendita
    if (user.ruolo === 'agente') {
      // Agenti vedono solo i loro clienti (non quelli creati da punto_vendita/admin)
      // Verifica che l'agenteId corrisponda e che l'utente associato sia un agente (non punto_vendita)
      query += ` AND c.agenteId = ? AND EXISTS (
        SELECT 1 FROM utenti u2 WHERE u2.id = c.agenteId AND u2.ruolo = 'agente'
      )`
      params.push(user.id)
    } else if (user.ruolo === 'punto_vendita') {
      // Il punto vendita vede tutti i clienti degli agenti + i propri
      query += ' AND (u.puntoVenditaId = ? OR c.agenteId = ?)'
      params.push(user.id, user.id)
    }

    // Filtro di ricerca
    if (search) {
      query += ` AND (
        c.ragioneSociale LIKE ? OR
        c.nome LIKE ? OR
        c.cognome LIKE ? OR
        c.email LIKE ? OR
        c.codiceFiscale LIKE ? OR
        c.piva LIKE ?
      )`
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam)
    }

    query += ' ORDER BY c.createdAt DESC'

    const clienti = db.prepare(query).all(...params)
    
    return NextResponse.json({
      success: true,
      clienti: clienti.map((c: any) => ({
        id: c.id,
        agenteId: c.agenteId,
        agenteNome: c.agenteNome,
        ragioneSociale: c.ragioneSociale,
        pec: c.pec,
        nomePersonaFisica: c.nomePersonaFisica,
        piva: c.piva,
        codiceDestinatario: c.codiceDestinatario,
        nome: c.nome,
        cognome: c.cognome,
        codiceFiscale: c.codiceFiscale,
        email: c.email,
        cellulare: c.cellulare,
        codiceAteco: c.codiceAteco,
        modalitaPagamento: c.modalitaPagamento,
        stato: c.stato,
        dataRegistrazione: c.dataRegistrazione,
      })),
    })
  } catch (error) {
    console.error('Error fetching clienti:', error)
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

    // Sia gli agenti che i punto_vendita possono creare clienti
    if (user.ruolo !== 'agente' && user.ruolo !== 'punto_vendita') {
      return NextResponse.json(
        { message: 'Non autorizzato a creare clienti' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const documento = formData.get('documento') as File | null

    // Estrai i dati dal form
    const ragioneSociale = formData.get('ragioneSociale') as string || ''
    const pec = formData.get('pec') as string || ''
    const nomePersonaFisica = formData.get('nomePersonaFisica') as string || ''
    const piva = formData.get('piva') as string || ''
    const codiceDestinatario = formData.get('codiceDestinatario') as string || ''
    const nome = formData.get('nome') as string
    const cognome = formData.get('cognome') as string
    const codiceFiscale = formData.get('codiceFiscale') as string
    const email = formData.get('email') as string || ''
    const cellulare = formData.get('cellulare') as string || ''
    const codiceAteco = formData.get('codiceAteco') as string || ''
    const modalitaPagamento = formData.get('modalitaPagamento') as string || ''
    const stato = (formData.get('stato') as string) || 'attivo'

    // Valida i campi obbligatori
    if (!nome || !cognome || !codiceFiscale) {
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
    const finalRagioneSociale = ragioneSociale || `${nome} ${cognome}`

    const id = uuidv4()
    const dataRegistrazione = new Date().toISOString()

    const indirizzoResidenza = (formData.get('indirizzoResidenza') as string || '').trim()
    const iban = (formData.get('iban') as string || '').trim()

    try {
      db.prepare(`
        INSERT INTO clienti (
          id, agenteId, ragioneSociale, pec, nomePersonaFisica, piva,
          codiceDestinatario, nome, cognome, codiceFiscale, email, cellulare,
          codiceAteco, modalitaPagamento, stato, dataRegistrazione, indirizzoResidenza, iban
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        user.id, // agenteId = user.id (se punto_vendita crea, usa il suo ID così gli agenti non lo vedono)
        finalRagioneSociale,
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
        dataRegistrazione,
        indirizzoResidenza || null,
        iban || null
      )
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
          id
        )
      } catch (uploadError) {
        console.error('Error uploading documento:', uploadError)
        // Non bloccare la creazione del cliente se l'upload fallisce
      }
    }

    return NextResponse.json({
      success: true,
      cliente: {
        id,
        agenteId: user.id,
        ragioneSociale: finalRagioneSociale,
        pec,
        nomePersonaFisica,
        piva,
        codiceDestinatario,
        nome,
        cognome,
        codiceFiscale,
        email,
        cellulare,
        codiceAteco,
        modalitaPagamento,
        stato: stato || 'attivo',
        dataRegistrazione,
      },
    })
  } catch (error: any) {
    console.error('Error creating cliente:', error)
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { message: 'Cliente già esistente' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}
