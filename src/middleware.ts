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
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Verificar si la ruta actual está protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )

  // Verificar si la ruta actual es pública
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  // Si intenta acceder a ruta protegida sin token → redirigir a login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si ya está autenticado y va a login → redirigir al dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas de API
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

