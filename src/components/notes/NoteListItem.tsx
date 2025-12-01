'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Folder, Calendar, Clock, Tag as TagIcon, MoreVertical } from "lucide-react"
import Link from "next/link"
import { type Note } from "@/lib/api"
import { stripHtml } from "@/utils/noteUtils"

interface NoteListItemProps {
  note: Note
  onDelete: (noteId: string, e: React.MouseEvent) => void
}

export function NoteListItem({ note, onDelete }: NoteListItemProps) {
  return (
    <Card className="shadow-card hover:shadow-elevated transition-smooth overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/notes/${note._id}`} className="flex-1 space-y-3 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer mb-1 line-clamp-2 break-words">
                  {note.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                  {stripHtml(note.content)}
                </p>
              </div>
            </div>
            
            {/* Folder indicator */}
            {note.folderId && typeof note.folderId === 'object' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                <Folder className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{note.folderId.name}</span>
              </div>
            )}
            
            {/* Tags and Dates */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 overflow-hidden">
                  {note.tags.slice(0, 5).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs gap-1 max-w-full truncate"
                    >
                      <TagIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{tag}</span>
                    </Badge>
                  ))}
                  {note.tags.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{note.tags.length - 5}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1 truncate min-w-0">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Creada {new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 truncate min-w-0">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Actualizada {new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/notes/${note._id}`}>Ver detalles</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/notes/${note._id}?edit=true`}>Editar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => onDelete(note._id, e)}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

