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

    const clienteId = request.nextUrl.searchParams.get('clienteId')
    const contrattoId = request.nextUrl.searchParams.get('contrattoId')
    const categoria = request.nextUrl.searchParams.get('categoria')

    let query = 'SELECT * FROM documenti WHERE 1=1'
    const params: any[] = []

    if (clienteId) {
      query += ' AND clienteId = ?'
      params.push(clienteId)
    }

    if (contrattoId) {
      query += ' AND contrattoId = ?'
      params.push(contrattoId)
    }

    if (categoria) {
      query += ' AND categoria = ?'
      params.push(categoria)
    }

    // Filtra per ruolo
    if (user.ruolo === 'agente') {
      // Gli agenti possono vedere solo i documenti per i propri clienti/contratti
      query += ` AND (
        clienteId IN (SELECT id FROM clienti WHERE agenteId = ?) OR
        contrattoId IN (SELECT id FROM contratti WHERE agenteId = ?)
      )`
      params.push(user.id, user.id)
    } else if (user.ruolo === 'punto_vendita') {
      // Il punto vendita può vedere tutti i documenti per i clienti/contratti dei loro agenti
      query += ` AND (
        clienteId IN (SELECT id FROM clienti WHERE agenteId = ? OR agenteId IN (SELECT id FROM utenti WHERE puntoVenditaId = ?)) OR
        contrattoId IN (SELECT id FROM contratti WHERE agenteId = ? OR agenteId IN (SELECT id FROM utenti WHERE puntoVenditaId = ?))
      )`
      params.push(user.id, user.id, user.id, user.id)
    }

    query += ' ORDER BY createdAt DESC'

    const documenti = db.prepare(query).all(...params)

    return NextResponse.json({
      success: true,
      documenti: documenti.map((d: any) => ({
        id: d.id,
        nome: d.nome,
        tipo: d.tipo,
        categoria: d.categoria,
        dimensione: d.dimensione,
        path: d.path,
        clienteId: d.clienteId,
        contrattoId: d.contrattoId,
        createdAt: d.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching documenti:', error)
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clienteId = formData.get('clienteId') as string | null
    const contrattoId = formData.get('contrattoId') as string | null
    const categoria = formData.get('categoria') as string || 'Altro'

    if (!file) {
      return NextResponse.json(
        { message: 'Nessun file selezionato' },
        { status: 400 }
      )
    }

    // Valida dimensione file (max 5MB)
    const fileSizeInBytes = file.size
    if (fileSizeInBytes > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { message: `File troppo grande. Dimensione massima consentita: ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB` },
        { status: 400 }
      )
    }

    // Verifica spazio disponibile per l'utente
    const storageCheck = canUserUpload(user.id, fileSizeInBytes)
    if (!storageCheck.canUpload) {
      return NextResponse.json(
        { message: storageCheck.message },
        { status: 400 }
      )
    }

    // Valida che almeno uno tra clienteId o contrattoId sia fornito
    if (!clienteId && !contrattoId) {
      return NextResponse.json(
        { message: 'Devi specificare un cliente o un contratto' },
        { status: 400 }
      )
    }

    // Verifica l'autorizzazione
    if (clienteId) {
      const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(clienteId) as any
      if (!cliente) {
        return NextResponse.json(
          { message: 'Cliente non trovato' },
          { status: 404 }
        )
      }

      if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }

      if (user.ruolo === 'punto_vendita') {
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
    }

    if (contrattoId) {
      const contratto = db.prepare('SELECT agenteId FROM contratti WHERE id = ?').get(contrattoId) as any
      if (!contratto) {
        return NextResponse.json(
          { message: 'Contratto non trovato' },
          { status: 404 }
        )
      }

      if (user.ruolo === 'agente' && contratto.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }

      if (user.ruolo === 'punto_vendita') {
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
    }

    // Leggi il file in buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Genera un nome file univoco
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    
    // Determina il path di storage
    let storagePath: string
    
    if (isS3Configured()) {
      // Usa S3 se configurato
      const s3Key = `documenti/${user.id}/${fileName}`
      storagePath = await uploadToS3(s3Key, buffer, file.type || 'application/octet-stream')
    } else {
      // Fallback a storage locale (per compatibilità)
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

    // Calcola la dimensione del file
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2)

    // Salva nel database
    const id = uuidv4()
    db.prepare(`
      INSERT INTO documenti (id, nome, tipo, categoria, dimensione, dimensioneBytes, path, userId, clienteId, contrattoId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      file.name,
      file.type || 'application/octet-stream',
      categoria,
      `${fileSizeInMB} MB`,
      fileSizeInBytes,
      storagePath,
      user.id,
      clienteId || null,
      contrattoId || null
    )

    return NextResponse.json({
      success: true,
      documento: {
        id,
        nome: file.name,
        tipo: file.type,
        categoria,
        dimensione: `${fileSizeInMB} MB`,
        path: storagePath,
        clienteId,
        contrattoId,
      },
    })
  } catch (error: any) {
    console.error('Error uploading documento:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}


