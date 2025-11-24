'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Folder, Plus, MoreVertical, Edit, Trash2 } from "lucide-react"
import { type Folder as FolderType, type Note } from "@/lib/api"

interface FoldersSidebarProps {
  folders: FolderType[]
  notes: Note[]
  loading: boolean
  selectedFolderId: string | null
  onFolderClick: (folderId: string | null) => void
  onCreateFolder: () => void
  onEditFolder: (folder: FolderType) => void
  onDeleteFolder: (folderId: string) => void
}

export function FoldersSidebar({
  folders,
  notes,
  loading,
  selectedFolderId,
  onFolderClick,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}: FoldersSidebarProps) {
  return (
    <aside className="w-full lg:w-64 border-r bg-muted/30 p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto lg:h-[calc(100vh-8rem)] max-h-[300px] lg:max-h-none">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Carpetas</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCreateFolder}
          title="Nueva carpeta"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <nav className="space-y-1">
          {/* Todas las notas */}
          <button
            onClick={() => onFolderClick(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              !selectedFolderId || selectedFolderId === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <Folder className="h-4 w-4" />
            <span className="flex-1 text-left">Todas las notas</span>
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          </button>

          {/* Carpetas */}
          {folders.map((folder) => (
            <div key={folder._id} className="group relative">
              <button
                onClick={() => onFolderClick(folder._id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedFolderId === folder._id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: folder.color || '#3B82F6' }}
                />
                <span className="flex-1 text-left">{folder.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {folder.noteCount || 0}
                </Badge>
              </button>
              
              {/* Menú de opciones de carpeta */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteFolder(folder._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </nav>
      )}
    </aside>
  )
}

