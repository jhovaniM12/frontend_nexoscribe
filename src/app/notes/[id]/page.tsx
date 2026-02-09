'use client'

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LexicalEditor } from "@/components/editor/LexicalEditor"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Tag as TagIcon,
  Save,
  Loader2,
  Share2
} from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { notesApi, foldersApi, type Note, type Folder as FolderType } from "@/lib/api"
import { toast } from "sonner"
import { AuthGuard } from "@/components/AuthGuard"
import { ShareDialog } from "@/components/notes/ShareDialog"

// Componente Skeleton para la página de detalle
function NoteDetailSkeleton() {
  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-4 border-t">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default function NoteDetail() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string

  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderType[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  // Verificar query parameter para activar modo edición al cargar
  useEffect(() => {
    const shouldEdit = searchParams.get('edit') === 'true'
    if (shouldEdit) {
      setIsEditing(true)
      // Limpiar el query parameter de la URL sin recargar la página
      router.replace(`/notes/${id}`, { scroll: false })
    }
  }, [id, router, searchParams])

  // Cargar carpetas
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true)
        const response = await foldersApi.getAll()
        setFolders(response.folders || [])
      } catch (error) {
        console.error("Error loading folders:", error)
      } finally {
        setLoadingFolders(false)
      }
    }
    loadFolders()
  }, [])

  // Cargar nota desde la API
  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true)
        const response = await notesApi.getById(id)
        const noteData = response.note
        setNote(noteData)
        setTitle(noteData.title)
        setContent(noteData.content)
        setTags(noteData.tags?.join(", ") || "")
        // Establecer el folderId, manejando si viene como objeto o string
        if (noteData.folderId) {
          let folderIdValue: string | null = null
          if (typeof noteData.folderId === 'object' && noteData.folderId !== null && '_id' in noteData.folderId) {
            folderIdValue = noteData.folderId._id
          } else if (typeof noteData.folderId === 'string') {
            folderIdValue = noteData.folderId
          }
          setSelectedFolderId(folderIdValue)
        } else {
          setSelectedFolderId(null)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al cargar la nota"
        toast.error(errorMessage)
        console.error("Error loading note:", error)
        router.push("/notes")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadNote()
    }
  }, [id, router])

  const handleSave = async () => {
    if (!note) return

    if (!title.trim() || !content.trim()) {
      toast.error("El título y contenido son requeridos")
      return
    }

    setSaving(true)

    try {
      const tagsArray = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await notesApi.update(id, {
        title: title.trim(),
        content: content.trim(),
        tags: tagsArray,
        folderId: selectedFolderId || null,
      })

      setNote(response.note)
      setIsEditing(false)
      toast.success("Nota actualizada exitosamente")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar la nota"
      toast.error(errorMessage)
      console.error("Error updating note:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!note) return

    if (!confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
      return
    }

    setDeleting(true)

    try {
      await notesApi.delete(id)
      toast.success("Nota eliminada exitosamente")
      router.push("/notes")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la nota"
      toast.error(errorMessage)
      console.error("Error deleting note:", error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <NoteDetailSkeleton />
      </AuthGuard>
    )
  }

  if (!note) {
    return (
      <AuthGuard>
        <Layout>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nota no encontrada</p>
            <Button asChild>
              <Link href="/notes">Volver a notas</Link>
            </Button>
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/notes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl sm:text-2xl font-bold"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setTitle(note.title)
                      setContent(note.content)
                      setTags(note.tags?.join(", ") || "")
                    }}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="gap-2" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShareDialogOpen(true)} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="gap-2"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Note Content */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          <TagIcon className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Creada {new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Actualizada {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {/* Content */}
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Contenido</Label>
                    {note && content !== undefined ? (
                      <LexicalEditor
                        key={`editor-${id}-${isEditing ? 'edit' : 'view'}`}
                        initialValue={content}
                        onChange={(html) => setContent(html)}
                        placeholder="Escribe tu nota aquí..."
                      />
                    ) : (
                      <div className="flex items-center justify-center min-h-[200px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="folder">Carpeta (opcional)</Label>
                    <Select
                      value={selectedFolderId || "none"}
                      onValueChange={(value) => setSelectedFolderId(value === "none" ? null : value)}
                      disabled={loadingFolders}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una carpeta" />
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
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separados por comas)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="reunión, proyecto, importante"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Renderizar contenido HTML */}
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          <TagIcon className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Share Dialog */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          noteId={id}
          noteTitle={note.title}
          isCurrentlyShared={note.isPublic}
          currentExpiresAt={note.publicExpiresAt}
          onShareSuccess={async () => {
            // Refresh note data
            const response = await notesApi.getById(id)
            setNote(response.note)
          }}
        />
      </Layout>
    </AuthGuard>
  )
}

