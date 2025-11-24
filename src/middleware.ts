import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ✅ Array de rutas protegidas - Solo agrega aquí las rutas que necesitas proteger
const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/notes',
  '/tasks',
  '/board',
  '/settings'
]

// ✅ Rutas públicas (si estás logueado, redirigir al dashboard)
const PUBLIC_ROUTES = ['/login']

export function middleware(request: NextRequest) {
  // Permitir que todas las rutas carguen y que el cliente maneje la auth
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas de API
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

