'use client'

import { useAuth } from '@/context/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Si terminó de cargar y no hay usuario, redirigir a login
    if (!loading && !user) {
      const params = new URLSearchParams()
      params.set('from', pathname)
      router.push(`/login?${params.toString()}`)
    }
  }, [user, loading, router, pathname])

  // Mostrar loading mientras verificamos la sesión
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si no hay usuario (y ya pasó el efecto de redirección), no renderizar nada
  if (!user) {
    return null
  }

  // Si hay usuario, mostrar el contenido protegido
  return <>{children}</>
}

