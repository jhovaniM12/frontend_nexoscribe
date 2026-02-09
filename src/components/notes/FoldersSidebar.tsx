'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Folder, Plus, MoreVertical, Edit, Trash2, Archive, Tag as TagIcon } from "lucide-react"
import { type Folder as FolderType, type Note } from "@/lib/api"
import { cn } from "@/lib/utils"

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
    <aside className="w-full lg:w-64 flex-shrink-0 p-2 sm:p-4 space-y-6 lg:h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="space-y-1">
        <Button
          variant={!selectedFolderId ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 px-4 font-semibold text-base",
            !selectedFolderId && "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-100"
          )}
          onClick={() => onFolderClick(null)}
        >
          <Folder className="h-4 w-4" />
          Notas
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 font-medium text-muted-foreground hover:text-foreground"
          disabled
        >
          <Archive className="h-4 w-4" />
          Archivados
        </Button>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etiquetas</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted text-muted-foreground"
            onClick={onCreateFolder}
            title="Nueva etiqueta"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-1 px-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-r-full" />
            ))}
          </div>
        ) : (
          <nav className="space-y-0.5">
            {folders.map((folder) => (
              <div key={folder._id} className="group relative flex items-center pr-2">
                <button
                  onClick={() => onFolderClick(folder._id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-sm font-medium transition-all duration-200",
                    "border-l-4 border-transparent hover:bg-muted/50",
                    selectedFolderId === folder._id
                      ? "bg-primary/10 text-primary border-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TagIcon
                    className={cn("h-4 w-4", selectedFolderId === folder._id ? "fill-current" : "")}
                    style={{ color: selectedFolderId === folder._id ? undefined : folder.color || '#94a3b8' }}
                  />
                  <span className="truncate flex-1 text-left">{folder.name}</span>
                  {(folder.noteCount ?? 0) > 0 && <span className="text-[10px] opacity-60 ml-2">{folder.noteCount}</span>}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer rounded hover:bg-muted">
                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Editar etiqueta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteFolder(folder._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Eliminar etiqueta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </nav>
        )}
      </div>
    </aside>
  )
}

