'use client'

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, Eye, EyeOff, User, Building2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { authApi } from "@/lib/api"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, login } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(searchParams.get('redirect') || '/dashboard')
    }
  }, [user, authLoading, router, searchParams])
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual')
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, completa todos los campos")
      setLoading(false)
      return
    }

    if (accountType === 'business' && !companyName.trim()) {
      setError("El nombre de la empresa es requerido")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      // 1. Registrar usuario
      await authApi.register({ 
        name, 
        email, 
        password,
        accountType,
        companyName: accountType === 'business' ? companyName : undefined
      })
      toast.success("Cuenta creada exitosamente")
      
      // 2. Iniciar sesión automáticamente
      const redirect = searchParams.get('redirect') || undefined
      try {
        await login(email, password, redirect)
        // El login ya maneja la redirección, no necesitamos router.push aquí
      } catch {
        toast.error("Cuenta creada, pero falló el inicio de sesión automático. Por favor inicia sesión.")
        const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
        router.push(`/login${redirectParam}`)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear la cuenta"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-32 h-14 relative mb-2">
            <Image
              src="/logo_nexoScribe.svg"
              alt="NexoScribe Logo"
              fill
              className="object-contain dark:brightness-0 dark:invert"
              priority
            />
          </div>
          <CardTitle className="text-2xl text-primary dark:text-primary-foreground">Crear cuenta</CardTitle>
          <CardDescription>
            Elige el tipo de cuenta que mejor se adapte a tus necesidades
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selector de tipo de cuenta */}
          <Tabs value={accountType} onValueChange={(v) => setAccountType(v as 'individual' | 'business')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Usuario Individual
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual" className="space-y-2 mt-4">
              <p className="text-sm text-muted-foreground text-center">
                Perfecto para probar NexoScribe y gestionar tus proyectos personales
              </p>
            </TabsContent>
            
            <TabsContent value="business" className="space-y-2 mt-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Ideal para equipos que necesitan colaborar y gestionar organizaciones
              </p>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input 
                  id="companyName" 
                  type="text" 
                  placeholder="Mi Empresa S.A."
                  className="bg-muted/50"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                  required={accountType === 'business'}
                />
              </div>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="Juan Pérez"
                className="bg-muted/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-muted/50 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input 
                id="confirmPassword" 
                type={showPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                className="bg-muted/50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
            <Link 
              href={searchParams.get('redirect') ? `/login?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : '/login'} 
              className="text-primary font-semibold hover:underline dark:text-primary-foreground"
            >
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
