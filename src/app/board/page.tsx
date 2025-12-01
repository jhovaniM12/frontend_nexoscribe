'use client'

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Plus, 
  Trash2, 
  MoreVertical, 
  PenSquare,
  Calendar,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { whiteboardApi, type Whiteboard } from "@/lib/api"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AuthGuard } from "@/components/AuthGuard"
import Image from "next/image"

export default function BoardGallery() {
  const router = useRouter()
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const loadBoards = async () => {
    try {
      setLoading(true)
      const { whiteboards } = await whiteboardApi.getAll()
      setWhiteboards(whiteboards)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar tableros")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoards()
  }, [])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    
    setIsCreating(true)
    try {
      const { whiteboard } = await whiteboardApi.create(newTitle)
      toast.success("Tablero creado")
      router.push(`/board/${whiteboard._id}`)
    } catch {
      toast.error("Error al crear tablero")
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!confirm("¿Estás seguro de eliminar este tablero?")) return

    try {
      await whiteboardApi.delete(id)
      setWhiteboards(prev => prev.filter(b => b._id !== id))
      toast.success("Tablero eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mis Pizarras</h1>
              <p className="text-muted-foreground">Espacios visuales para tus ideas</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Tablero
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : whiteboards.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tienes tableros aún</h3>
              <p className="text-muted-foreground mb-4">Crea uno nuevo para empezar a dibujar y planificar.</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                Crear mi primer tablero
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {whiteboards.map((board) => (
                <Card 
                  key={board._id} 
                  className="group cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary/50 hover:border-l-primary"
                  onClick={() => router.push(`/board/${board._id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg truncate pr-2">{board.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(board._id, e)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 aspect-video relative overflow-hidden bg-muted/20">
                    {board.thumbnail ? (
                      <Image 
                        src={board.thumbnail} 
                        alt={board.title} 
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center border-b">
                        <PenSquare className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2 text-xs text-muted-foreground flex gap-2 items-center">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(board.updatedAt), "d MMM, yyyy", { locale: es })}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Tablero</DialogTitle>
                <DialogDescription>Dale un nombre a tu espacio creativo.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input 
                  placeholder="Ej: Lluvia de ideas Q4" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={isCreating || !newTitle.trim()}>
                  {isCreating ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </AuthGuard>
  )
}
