'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { authApi } from "@/lib/api"

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email) {
      setError("Por favor, ingresa tu email")
      setLoading(false)
      return
    }

    try {
      await authApi.verifyEmail(email)
      setEmailSent(true)
      toast.success("Si el email está registrado, recibirás un enlace de recuperación")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al enviar el email de recuperación"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-32 h-14 relative">
            <Image
              src="/logo_nexoScribe.svg"
              alt="NexoScribe Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl text-primary">
            {emailSent ? "Revisa tu correo" : "Recuperar contraseña"}
          </CardTitle>
          <CardDescription>
            {emailSent 
              ? "Hemos enviado un enlace de recuperación a tu email"
              : "Ingresa tu email para recibir un enlace de recuperación"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {emailSent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  El enlace expirará en 15 minutos. Si no encuentras el email, revisa tu carpeta de spam.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                }}
              >
                Enviar a otro email
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Volver al inicio de sesión
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="bg-muted/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar enlace de recuperación
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

