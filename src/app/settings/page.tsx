'use client'

import { useState, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { uploadApi } from "@/lib/api"
import { Loader2, Camera, User } from "lucide-react"
import { Layout } from "@/components/Layout"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado local para la imagen, inicia con la del usuario o vacía
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validaciones simples
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB")
      return
    }

    try {
      setUploading(true)
      const response = await uploadApi.uploadAvatar(file)
      
      setAvatarUrl(response.url)
      toast.success("Foto de perfil actualizada correctamente")
      
      // Opcional: recargar la página o actualizar el contexto de usuario
      // window.location.reload() 
    } catch (error) {
      console.error(error)
      toast.error("Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  if (authLoading) {
      return (
        <Layout>
           <div className="flex items-center justify-center h-full">
             <Loader2 className="h-8 w-8 animate-spin" />
           </div>
        </Layout>
      )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
          <p className="text-muted-foreground">
            Gestiona tu perfil y preferencias de la cuenta.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perfil de Usuario</CardTitle>
            <CardDescription>
              Actualiza tu foto y revisa tu información personal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-24 w-24 border-2 border-muted">
                        <AvatarImage src={avatarUrl || user?.avatar} alt={user?.name} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {user?.name?.charAt(0).toUpperCase() || <User />}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                    </div>
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-medium text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">Rol: {user?.role || 'Usuario'}</p>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                    >
                        Cambiar foto
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" defaultValue={user?.name} disabled />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" defaultValue={user?.email} disabled />
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

