import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import { deleteFromS3, isS3Configured } from '@/lib/s3'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const documento = db.prepare('SELECT * FROM documenti WHERE id = ?').get(params.id) as any
    if (!documento) {
      return NextResponse.json(
        { message: 'Documento non trovato' },
        { status: 404 }
      )
    }

    // Verifica l'autorizzazione
    if (documento.clienteId) {
      const cliente = db.prepare('SELECT agenteId FROM clienti WHERE id = ?').get(documento.clienteId) as any
      if (user.ruolo === 'agente' && cliente.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    }

    if (documento.contrattoId) {
      const contratto = db.prepare('SELECT agenteId FROM contratti WHERE id = ?').get(documento.contrattoId) as any
      if (user.ruolo === 'agente' && contratto.agenteId !== user.id) {
        return NextResponse.json(
          { message: 'Non autorizzato' },
          { status: 403 }
        )
      }
    }

    // Elimina il file da S3 o filesystem locale
    if (documento.path) {
      if (isS3Configured() && documento.path.startsWith('documenti/')) {
        // File su S3
        await deleteFromS3(documento.path)
      } else {
        // File locale (fallback)
        const { unlink } = await import('fs/promises')
        const { join } = await import('path')
        const { existsSync } = await import('fs')
        
        const filePath = join(process.cwd(), documento.path.replace('/uploads/', 'uploads/'))
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      }
    }

    // Elimina dal database
    db.prepare('DELETE FROM documenti WHERE id = ?').run(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting documento:', error)
    return NextResponse.json(
      { message: error.message || 'Errore del server' },
      { status: 500 }
    )
  }
}


