'use client'

import { useState, useRef } from 'react'
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/auth-context"
import { uploadApi } from "@/lib/api"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { user, checkAuth } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo y tamaño
    if (!file.type.startsWith('image/')) {
        toast.error("Por favor selecciona una imagen válida")
        return
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error("La imagen no debe superar los 5MB")
        return
    }

    setIsUploading(true)
    try {
      await uploadApi.uploadAvatar(file)
      
      toast.success("Foto de perfil actualizada")
      // Recargar la sesión para ver el cambio inmediatamente
      await checkAuth() 
    } catch (error) {
      console.error(error)
      toast.error("Error al actualizar la foto")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
            <h1 className="text-3xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">Gestiona tu cuenta y preferencias.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Actualiza tu información personal y foto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-sm cursor-pointer" onClick={handleAvatarClick}>
                        <AvatarImage src={user?.avatar} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-muted">{user?.name?.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div 
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={handleAvatarClick}
                    >
                        {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                
                <div className="space-y-1 text-center sm:text-left flex-1">
                    <h3 className="font-medium">Foto de perfil</h3>
                    <p className="text-sm text-muted-foreground">
                        Haz clic en la imagen para cambiarla. Se recomienda una imagen cuadrada de al menos 400x400px.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAvatarClick} disabled={isUploading}>
                        {isUploading ? "Subiendo..." : "Subir nueva foto"}
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input id="name" defaultValue={user?.name} disabled />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" defaultValue={user?.email} disabled />
                </div>
            </div>

          </CardContent>
          <CardFooter className="border-t px-6 py-4 bg-muted/50">
             <p className="text-xs text-muted-foreground">
                Para cambiar tu nombre o correo, por favor contacta a soporte.
             </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  )
}
