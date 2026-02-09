'use client'

import { Card } from "@/components/ui/card"
import { CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { type Note } from "@/lib/api"
import { NoteCard } from "./NoteCard"

export interface NotesGridProps {
  notes: Note[]
  loading: boolean
  searchQuery: string
  selectedFolderId?: string | null
  onDelete: (noteId: string, e: React.MouseEvent) => void
  onPin?: (noteId: string, e: React.MouseEvent) => void
  onArchive?: (noteId: string, e: React.MouseEvent) => void
  showArchived?: boolean
}

function NoteCardSkeleton() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  )
}

export function NotesGrid({
  notes,
  loading,
  searchQuery,
  selectedFolderId,
  onDelete,
  onPin,
  onArchive,
  showArchived
}: NotesGridProps) {
  const router = useRouter()

  const handleNewNote = () => {
    const url = selectedFolderId
      ? `/notes/new?folder=${selectedFolderId}`
      : '/notes/new'
    router.push(url)
  }

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="break-inside-avoid mb-4">
            <NoteCardSkeleton />
          </div>
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-sm sm:text-base text-muted-foreground">
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
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {notes.map((note) => (
        <div key={note._id} className="break-inside-avoid mb-4">
          <NoteCard
            note={note}
            onDelete={onDelete}
            onPin={onPin}
            onArchive={onArchive}
            showArchived={showArchived}
          />
        </div>
      ))}
    </div>
  )
}

