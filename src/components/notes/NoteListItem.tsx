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
    <Card className="shadow-card hover:shadow-elevated transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <Link href={`/notes/${note._id}`} className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer mb-1">
                  {note.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {stripHtml(note.content)}
                </p>
              </div>
            </div>
            
            {/* Folder indicator */}
            {note.folderId && typeof note.folderId === 'object' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Folder className="h-3 w-3" />
                <span>{note.folderId.name}</span>
              </div>
            )}
            
            {/* Tags and Dates */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs gap-1">
                      <TagIcon className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Creada {new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Actualizada {new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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

