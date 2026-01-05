import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 })
    }

    const { to, subject, html, text } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { message: 'Destinatario, oggetto e contenuto sono obbligatori' },
        { status: 400 }
      )
    }

    const success = await sendEmail({ to, subject, html, text })

    if (success) {
      return NextResponse.json({ success: true, message: 'Email inviata con successo' })
    } else {
      return NextResponse.json(
        { message: 'Errore durante l\'invio dell\'email' },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}


