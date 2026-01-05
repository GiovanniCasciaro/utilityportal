import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import db from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const format = request.nextUrl.searchParams.get('format') || 'csv'
    const clienti = db.prepare('SELECT * FROM clienti ORDER BY createdAt DESC').all()

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(clienti.map((c: any) => ({
        'ID': c.id,
        'Nome': c.nome,
        'Cognome': c.cognome,
        'Email': c.email,
        'Telefono': c.telefono || '',
        'Azienda': c.azienda || '',
        'Stato': c.stato,
        'Data Registrazione': c.dataRegistrazione,
      })))
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clienti')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="clienti_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    } else {
      // CSV
      const headers = ['ID', 'Nome', 'Cognome', 'Email', 'Telefono', 'Azienda', 'Stato', 'Data Registrazione']
      const rows = clienti.map((c: any) => [
        c.id,
        c.nome,
        c.cognome,
        c.email,
        c.telefono || '',
        c.azienda || '',
        c.stato,
        c.dataRegistrazione,
      ])
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="clienti_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}


