'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { organizationApi } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AcceptInvitationPage() {
  const { token } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [organizationName, setOrganizationName] = useState<string>('')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      toast.error('Debes iniciar sesión para aceptar la invitación')
      router.push(`/login?redirect=/invite/accept/${token}`)
      return
    }

    const acceptInvitation = async () => {
      try {
        const response = await organizationApi.acceptInvitation(token as string)
        setOrganizationName(response.organizationName)
        setStatus('success')
        toast.success('¡Invitación aceptada!')
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard')
          window.location.reload() // Forzar recarga para actualizar la lista de organizaciones
        }, 2000)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error al aceptar invitación"
        setStatus('error')
        setErrorMessage(errorMessage)
        toast.error(errorMessage)
      }
    }

    acceptInvitation()
  }, [user, authLoading, token, router])

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Procesando invitación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-center">¡Invitación Aceptada!</CardTitle>
            <CardDescription className="text-center">
              Ya eres miembro de <strong>{organizationName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/dashboard')}>
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-center">Error al Aceptar Invitación</CardTitle>
          <CardDescription className="text-center">
            {errorMessage || 'La invitación no es válida o ha expirado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center space-x-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Ir al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

