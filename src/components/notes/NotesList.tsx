'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Note } from "@/lib/api"
import { NoteListItem } from "./NoteListItem"

export interface NotesListProps {
  notes: Note[]
  loading: boolean
  searchQuery: string
  selectedFolderId?: string | null
  onDelete: (noteId: string, e: React.MouseEvent) => void
  onPin?: (noteId: string, e: React.MouseEvent) => void
  onArchive?: (noteId: string, e: React.MouseEvent) => void
  showArchived?: boolean
}

export function NotesList({
  notes,
  loading,
  searchQuery,
  selectedFolderId,
  onDelete,
  onPin,
  onArchive,
  showArchived
}: NotesListProps) {
  const router = useRouter()

  const handleNewNote = () => {
    const url = selectedFolderId
      ? `/notes/new?folder=${selectedFolderId}`
      : '/notes/new'
    router.push(url)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery
            ? "No se encontraron notas con ese criterio"
            : showArchived
              ? "No tienes notas archivadas"
              : "No tienes notas todavía"}
        </p>
        {!searchQuery && !showArchived && (
          <Button className="mt-4 gap-2" onClick={handleNewNote}>
            <Plus className="h-4 w-4" />
            Crear primera nota
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <NoteListItem
          key={note._id}
          note={note}
          onDelete={onDelete}
          onPin={onPin}
          onArchive={onArchive}
          showArchived={showArchived}
        />
      ))}
    </div>
  )
}


