'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Folder, Pin, Archive, ArchiveRestore, Trash2 } from "lucide-react"
import React from 'react'
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { type Note } from "@/lib/api"
import { stripHtml } from "@/utils/noteUtils"

// Helper to extract first image
const getFirstImage = (html: string) => {
  if (typeof window === 'undefined') return null
  const div = document.createElement('div')
  div.innerHTML = html
  const img = div.querySelector('img')
  return img ? img.src : null
}


export interface NoteCardProps {
  note: Note
  onDelete: (noteId: string, e: React.MouseEvent) => void
  onPin?: (noteId: string, e: React.MouseEvent) => void
  onArchive?: (noteId: string, e: React.MouseEvent) => void
  showArchived?: boolean
}

export function NoteCard({ note, onDelete, onPin, onArchive, showArchived }: NoteCardProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const coverImage = mounted ? getFirstImage(note.content) : null
  const plainText = mounted ? stripHtml(note.content) : ''

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border/40 hover:-translate-y-1 block h-fit",
      "bg-card text-card-foreground",
      note.isPinned && "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
    )}>
      {/* Cover Image if available */}
      {coverImage && (
        <div className="w-full h-48 overflow-hidden relative border-b border-border/20">
          <Image
            src={coverImage}
            alt="Note cover"
            width={400}
            height={192}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Hover Actions Overlay (Top Right) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-background/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-border/50">
        {onPin && !showArchived && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7 rounded-full hover:bg-muted", note.isPinned && "text-primary bg-primary/10")}
            onClick={(e) => { e.preventDefault(); onPin(note._id, e) }}
            title={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Pin className="h-3.5 w-3.5 fill-current" />
          </Button>
        )}
        {onArchive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.preventDefault(); onArchive(note._id, e) }}
            title={showArchived ? "Restore note" : "Archive note"}
          >
            {showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.preventDefault(); onDelete(note._id, e) }}
          title="Delete note"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Link href={`/notes/${note._id}`} className="block h-full">
        <CardContent className={cn("p-5 flex flex-col gap-3", coverImage ? "pt-4" : "pt-5")}>
          <div className="space-y-1.5">
            <h3 className={cn(
              "font-bold text-base leading-tight tracking-tight text-foreground/90 group-hover:text-primary transition-colors",
              note.isPinned && "text-primary"
            )}>
              {note.title || "Untitled Note"}
            </h3>

            <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-[8] font-medium break-words">
              {plainText || "No additional text"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 mt-auto">
            {/* Folder Badge */}
            {note.folderId && typeof note.folderId === 'object' && (
              <Badge variant="outline" className="px-2 py-0.5 h-6 text-[10px] font-semibold bg-secondary/50 border-border/60 text-secondary-foreground gap-1.5 hover:bg-secondary transition-colors">
                <Folder className="h-3 w-3 opacity-70" />
                {note.folderId.name}
              </Badge>
            )}

            {/* Tags */}
            {note.tags && note.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="px-2 py-0.5 h-6 text-[10px] font-medium bg-muted/50 text-muted-foreground border-transparent">
                #{tag}
              </Badge>
            ))}
            {note.tags && note.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-medium">+{note.tags.length - 3}</span>
            )}
          </div>

          <div className="text-[10px] text-muted-foreground/40 font-medium pt-1">
            Parsed {new Date(note.updatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}


