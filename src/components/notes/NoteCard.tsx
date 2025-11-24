'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Folder, Calendar, Tag as TagIcon, MoreVertical } from "lucide-react"
import Link from "next/link"
import { type Note } from "@/lib/api"
import { stripHtml } from "@/utils/noteUtils"

interface NoteCardProps {
  note: Note
  onDelete: (noteId: string, e: React.MouseEvent) => void
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  return (
    <Card className="shadow-card hover:shadow-elevated transition-smooth">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Link href={`/notes/${note._id}`} className="space-y-1 flex-1">
            <CardTitle className="hover:text-primary transition-colors line-clamp-2 cursor-pointer">
              {note.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {stripHtml(note.content)}
            </CardDescription>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </CardHeader>
      <Link href={`/notes/${note._id}`}>
        <CardContent className="space-y-4 cursor-pointer">
          {/* Folder indicator */}
          {note.folderId && typeof note.folderId === 'object' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Folder className="h-3 w-3" />
              <span>{note.folderId.name}</span>
            </div>
          )}
          
          {/* Tags */}
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

          {/* Dates */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Actualizada {new Date(note.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

