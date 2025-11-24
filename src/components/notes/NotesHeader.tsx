'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface NotesHeaderProps {
  title: string
  subtitle: string
  searchQuery: string
  selectedFolderId?: string | null
  onSearchChange: (query: string) => void
}

export function NotesHeader({ title, subtitle, searchQuery, selectedFolderId, onSearchChange }: NotesHeaderProps) {
  const router = useRouter()

  const handleNewNote = () => {
    const url = selectedFolderId 
      ? `/notes/new?folder=${selectedFolderId}`
      : '/notes/new'
    router.push(url)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto shrink-0" onClick={handleNewNote}>
          <Plus className="h-4 w-4"/>
          <span className="hidden sm:inline">Nueva Nota</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar notas..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </>
  )
}

