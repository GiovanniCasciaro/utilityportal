import { NextRequest, NextResponse } from 'next/server'
import { signToken } from '@/lib/jwt'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()

    // Cerca l'utente nel database
    const user = db.prepare('SELECT * FROM utenti WHERE email = ? AND attivo = 1').get(email) as any

    if (!user) {
      return NextResponse.json(
        { message: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Verifica la password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Crea il token JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.nome,
    })

    // Crea la risposta
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.nome,
        ruolo: user.ruolo,
        puntoVenditaId: user.puntoVenditaId,
      },
    })

    // Imposta il cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Errore del server' },
      { status: 500 }
    )
  }
}

