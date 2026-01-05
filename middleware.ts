import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')

  // Salta il middleware per le route API, i file statici e gli interni di Next.js
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Proteggi dashboard e altre route protette
  const protectedRoutes = ['/dashboard', '/clienti', '/contratti', '/fatturazione', '/report', '/documenti', '/notifiche', '/settings', '/simulatore']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Se si accede a una route protetta senza token, reindirizza al login
  if (isProtectedRoute && !token) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url, 302)
  }

  // NON fare redirect automatico da / a /dashboard nel middleware
  // La validazione del token viene fatta nelle pagine stesse
  // Questo evita loop di redirect quando il token non è valido

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Abbina tutti i percorsi delle richieste eccetto quelli che iniziano con:
     * - api (route API)
     * - _next/static (file statici)
     * - _next/image (file di ottimizzazione immagini)
     * - favicon.ico (file favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


