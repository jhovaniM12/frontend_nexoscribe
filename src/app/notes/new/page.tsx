'use client'

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LexicalEditorComponent from "@/components/editor/LexicalEditor"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { notesApi, foldersApi, type Folder as FolderType } from "@/lib/api"
import { toast } from "sonner"

function NewNoteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const folderIdFromUrl = searchParams.get('folder')
  
  const [loading, setLoading] = useState(false)
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderIdFromUrl || null)
  const [folders, setFolders] = useState<FolderType[]>([])

  // Cargar carpetas
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true)
        const response = await foldersApi.getAll()
        setFolders(response.folders || [])
        // Asegurar que el folderId de la URL se establezca después de cargar las carpetas
        if (folderIdFromUrl && !selectedFolderId) {
          setSelectedFolderId(folderIdFromUrl)
        }
      } catch (error) {
        console.error("Error loading folders:", error)
      } finally {
        setLoadingFolders(false)
      }
    }
    loadFolders()
  }, [])

  // Sincronizar selectedFolderId con folderIdFromUrl cuando cambia
  useEffect(() => {
    if (folderIdFromUrl !== selectedFolderId) {
      setSelectedFolderId(folderIdFromUrl || null)
    }
  }, [folderIdFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      toast.error("El título y contenido son requeridos")
      return
    }

    setLoading(true)

    try {
      // Convertir tags de string a array
      const tagsArray = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await notesApi.create({
        title: title.trim(),
        content: content.trim(),
        tags: tagsArray,
        folderId: selectedFolderId || null,
      })

      toast.success("Nota creada exitosamente")
      // Si hay una carpeta seleccionada, regresar a la vista de esa carpeta
      if (selectedFolderId) {
        router.push(`/notes?folder=${selectedFolderId}`)
      } else {
        router.push(`/notes/${response.note._id}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al crear la nota"
      toast.error(errorMessage)
      console.error("Error creating note:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              const backUrl = folderIdFromUrl ? `/notes?folder=${folderIdFromUrl}` : '/notes'
              router.push(backUrl)
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Nueva Nota</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la nota..."
              className="text-xl"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <LexicalEditorComponent
              onChange={(html) => setContent(html)}
              placeholder="Escribe tu nota aquí..."
            />
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label htmlFor="folder">
              {selectedFolderId && folderIdFromUrl 
                ? `Carpeta: ${folders.find(f => f._id === selectedFolderId)?.name || 'Cargando...'}` 
                : 'Carpeta (opcional)'}
            </Label>
            <Select
              value={selectedFolderId || "none"}
              onValueChange={(value) => setSelectedFolderId(value === "none" ? null : value)}
              disabled={loadingFolders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingFolders ? "Cargando carpetas..." : "Selecciona una carpeta"}>
                  {selectedFolderId && folders.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: folders.find(f => f._id === selectedFolderId)?.color || '#3B82F6' }}
                      />
                      <span>{folders.find(f => f._id === selectedFolderId)?.name}</span>
                    </div>
                  ) : (
                    loadingFolders ? "Cargando..." : "Sin carpeta"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin carpeta</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder._id} value={folder._id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: folder.color || '#3B82F6' }}
                      />
                      <span>{folder.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separados por comas)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="reunión, proyecto, importante"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Nota
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default function NewNote() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Layout>
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-3xl font-bold">Nueva Nota</h1>
          </div>
        </div>
      </Layout>
    )
  }

  return <NewNoteContent />
}