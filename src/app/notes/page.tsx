'use client'

import { Layout } from "@/components/Layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid3x3, List, Archive } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense, useCallback } from "react"
import { notesApi, foldersApi, type Note, type Folder as FolderType } from "@/lib/api"
import { toast } from "sonner"
import { filterNotesBySearch } from "@/utils/noteUtils"
import { FoldersSidebar } from "@/components/notes/FoldersSidebar"
import { FolderDialog } from "@/components/notes/FolderDialog"
import { NotesHeader } from "@/components/notes/NotesHeader"
import { NotesGrid } from "@/components/notes/NotesGrid"
import { NotesList } from "@/components/notes/NotesList"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { QuickNoteInput } from "@/components/notes/QuickNoteInput"

const FOLDER_COLORS = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Morado', value: '#8B5CF6' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Naranja', value: '#F97316' },
  { name: 'Indigo', value: '#6366F1' },
]

function NotesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedFolderId = searchParams.get('folder')

  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  // Estados para el diálogo de carpetas
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null)
  const [folderName, setFolderName] = useState("")
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0].value)
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false)

  // Cargar carpetas
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true)
        const response = await foldersApi.getAll()
        setFolders(response.folders || [])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error al cargar las carpetas"
        toast.error(errorMessage)
        console.error("Error loading folders:", error)
      } finally {
        setLoadingFolders(false)
      }
    }

    loadFolders()
  }, [])

  // Función para recargar notas
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      const folderIdParam = selectedFolderId === 'all' ? undefined : selectedFolderId || undefined
      const response = await notesApi.getAll({
        folderId: folderIdParam,
        archived: showArchived
      })
      setNotes(response.notes || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al cargar las notas"
      toast.error(errorMessage)
      console.error("Error loading notes:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedFolderId, showArchived])

  // Cargar notas desde la API
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Filtrar notas por búsqueda
  const filteredNotes = filterNotesBySearch(notes, searchQuery)

  const handleDelete = async (noteId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
      return
    }

    try {
      await notesApi.delete(noteId)
      setNotes(notes.filter(note => note._id !== noteId))
      toast.success("Nota eliminada exitosamente")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la nota"
      toast.error(errorMessage)
      console.error("Error deleting note:", error)
    }
  }

  const handlePin = async (noteId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await notesApi.togglePin(noteId)
      setNotes(notes.map(note =>
        note._id === noteId ? { ...note, isPinned: response.isPinned } : note
      ))
      toast.success(response.isPinned ? "Nota fijada" : "Nota desfijada")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al cambiar estado"
      toast.error(errorMessage)
    }
  }

  const handleArchive = async (noteId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await notesApi.toggleArchive(noteId)
      // Remover de la lista actual ya que cambia de categoría
      setNotes(notes.filter(note => note._id !== noteId))
      toast.success(response.isArchived ? "Nota archivada" : "Nota restaurada")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al archivar"
      toast.error(errorMessage)
    }
  }

  const handleFolderClick = (folderId: string | null) => {
    if (folderId === null) {
      router.push('/notes')
    } else {
      router.push(`/notes?folder=${folderId}`)
    }
  }

  const handleCreateFolder = () => {
    setFolderDialogMode('create')
    setSelectedFolder(null)
    setFolderName("")
    setFolderColor(FOLDER_COLORS[0].value)
    setFolderDialogOpen(true)
  }

  const handleEditFolder = (folder: FolderType) => {
    setFolderDialogMode('edit')
    setSelectedFolder(folder)
    setFolderName(folder.name)
    setFolderColor(folder.color || FOLDER_COLORS[0].value)
    setFolderDialogOpen(true)
  }

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f._id === folderId)
    if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folder?.name}"? Todas las notas en esta carpeta también se eliminarán.`)) {
      return
    }

    try {
      const response = await foldersApi.delete(folderId)
      setFolders(folders.filter(f => f._id !== folderId))
      if (response.deletedNotesCount) {
        toast.success(`Carpeta eliminada. Se eliminaron ${response.deletedNotesCount} notas.`)
      } else {
        toast.success("Carpeta eliminada exitosamente")
      }

      // Si la carpeta eliminada estaba seleccionada, volver a todas las notas
      if (selectedFolderId === folderId) {
        router.push('/notes')
      } else {
        // Recargar notas
        const folderIdParam = selectedFolderId === 'all' ? undefined : selectedFolderId || undefined
        const notesResponse = await notesApi.getAll({ folderId: folderIdParam, archived: showArchived })
        setNotes(notesResponse.notes || [])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la carpeta"
      toast.error(errorMessage)
      console.error("Error deleting folder:", error)
    }
  }

  const handleSubmitFolder = async () => {
    if (!folderName.trim()) {
      toast.error("El nombre de la carpeta es requerido")
      return
    }

    setIsSubmittingFolder(true)
    try {
      if (folderDialogMode === 'create') {
        const response = await foldersApi.create({
          name: folderName.trim(),
          color: folderColor
        })
        setFolders([...folders, response.folder])
        toast.success("Carpeta creada exitosamente")
      } else {
        if (!selectedFolder) return
        const response = await foldersApi.update(selectedFolder._id, {
          name: folderName.trim(),
          color: folderColor
        })
        setFolders(folders.map(f => f._id === selectedFolder._id ? response.folder : f))
        toast.success("Carpeta actualizada exitosamente")
      }
      setFolderDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al guardar la carpeta"
      toast.error(errorMessage)
      console.error("Error saving folder:", error)
    } finally {
      setIsSubmittingFolder(false)
    }
  }

  const selectedFolderData = folders.find(f => f._id === selectedFolderId)
  const currentFolderName = selectedFolderId === null || selectedFolderId === 'all'
    ? "Todas las notas"
    : selectedFolderData?.name || "Carpeta"

  const currentSubtitle = selectedFolderId
    ? "Gestiona las notas de esta carpeta"
    : "Gestiona y organiza tus ideas"

  return (
    <AuthGuard>
      <Layout>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
          {/* Sidebar de Carpetas */}
          <FoldersSidebar
            folders={folders}
            notes={notes}
            loading={loadingFolders}
            selectedFolderId={selectedFolderId}
            onFolderClick={handleFolderClick}
            onCreateFolder={handleCreateFolder}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
          />

          {/* Contenido principal */}
          <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto min-w-0">
            {/* Quick Note Input */}
            <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
              <QuickNoteInput
                onNoteCreated={loadNotes}
                selectedFolderId={selectedFolderId === 'all' ? null : selectedFolderId}
              />
            </div>

            <NotesHeader
              title={showArchived ? "Notas archivadas" : currentFolderName}
              subtitle={showArchived ? "Notas que has archivado" : currentSubtitle}
              searchQuery={searchQuery}
              selectedFolderId={selectedFolderId}
              onSearchChange={setSearchQuery}
            />

            {/* Tabs for Grid/List View */}
            <Tabs defaultValue="grid" className="w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <TabsList>
                  <TabsTrigger value="grid" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Tablero
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    Lista
                  </TabsTrigger>
                </TabsList>

                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  {showArchived ? "Ver activas" : "Ver archivadas"}
                </Button>
              </div>

              {/* Grid View */}
              <TabsContent value="grid" className="mt-6">
                <NotesGrid
                  notes={filteredNotes}
                  loading={loading}
                  searchQuery={searchQuery}
                  selectedFolderId={selectedFolderId}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  showArchived={showArchived}
                />
              </TabsContent>

              {/* List View */}
              <TabsContent value="list" className="mt-6">
                <NotesList
                  notes={filteredNotes}
                  loading={loading}
                  searchQuery={searchQuery}
                  selectedFolderId={selectedFolderId}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  showArchived={showArchived}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Diálogo para crear/editar carpeta */}
        <FolderDialog
          open={folderDialogOpen}
          mode={folderDialogMode}
          folder={selectedFolder}
          folderName={folderName}
          folderColor={folderColor}
          isSubmitting={isSubmittingFolder}
          onOpenChange={setFolderDialogOpen}
          onNameChange={setFolderName}
          onColorChange={setFolderColor}
          onSubmit={handleSubmitFolder}
        />
      </Layout>
    </AuthGuard>
  )
}

export default function Notes() {
  return (
    <Suspense fallback={
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-muted-foreground">Cargando...</div>
          </div>
        </Layout>
      </AuthGuard>
    }>
      <NotesContent />
    </Suspense>
  )
}
