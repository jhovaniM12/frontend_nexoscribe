'use client'

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Image, CheckSquare, PenTool } from "lucide-react"
import { notesApi } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface QuickNoteInputProps {
    onNoteCreated: () => void
    selectedFolderId?: string | null
}

export function QuickNoteInput({ onNoteCreated, selectedFolderId }: QuickNoteInputProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const expandedRef = useRef<HTMLDivElement>(null)

    // Cerrar al hacer clic fuera de la tarjeta expandida
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                expandedRef.current &&
                !expandedRef.current.contains(event.target as Node)
            ) {
                setIsExpanded(false)
            }
        }

        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside)
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.body.style.overflow = ""
        }
    }, [isExpanded])

    const handleCreate = async () => {
        if (!title.trim() && !content.trim()) {
            setIsExpanded(false)
            return
        }

        try {
            setIsSubmitting(true)
            await notesApi.create({
                title,
                content,
                folderId: selectedFolderId === 'all' ? undefined : selectedFolderId
            })

            toast.success("Nota creada")
            setTitle("")
            setContent("")
            setIsExpanded(false)
            onNoteCreated()
        } catch (error) {
            toast.error("Error al crear la nota")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {/* Colapsado: ocupa solo una barra compacta en el flujo */}
            <div ref={containerRef} className="w-full max-w-2xl mx-auto mb-6">
                <Card
                    className={cn(
                        "shadow-md border-border/40 overflow-hidden transition-shadow duration-200 hover:shadow-lg cursor-text"
                    )}
                    onClick={() => setIsExpanded(true)}
                >
                    <div className="flex items-center justify-between p-3 sm:p-4 text-muted-foreground">
                        <span className="font-medium text-sm sm:text-base px-1">Crear una nota...</span>
                        <div className="flex items-center gap-2 sm:gap-4 opacity-60">
                            <CheckSquare className="h-5 w-5 hover:text-foreground transition-colors" />
                            <PenTool className="h-5 w-5 hover:text-foreground transition-colors" />
                            <Image className="h-5 w-5 hover:text-foreground transition-colors" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Expandido: flotante sobre el contenido, no ocupa espacio */}
            {isExpanded &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-[2px]"
                        onClick={(e) => e.target === e.currentTarget && setIsExpanded(false)}
                    >
                        <div
                            ref={expandedRef}
                            className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card className="shadow-xl border-border/40 overflow-hidden">
                                <div className="flex flex-col">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Título"
                                        className="border-0 focus-visible:ring-0 text-base sm:text-lg font-semibold px-4 pt-4 pb-2 bg-transparent placeholder:text-muted-foreground/70"
                                    />
                                    <Textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Escribe una nota..."
                                        className="border-0 focus-visible:ring-0 min-h-[120px] resize-none px-4 py-2 bg-transparent text-sm sm:text-base"
                                        autoFocus
                                    />
                                    <div className="flex items-center justify-between px-2 py-2 bg-muted/10 border-t border-border/30">
                                        <div className="flex items-center gap-1 px-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled>
                                                <Image className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled>
                                                <CheckSquare className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button
                                            onClick={handleCreate}
                                            className="h-8 px-6 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                                            disabled={isSubmitting || (!title.trim() && !content.trim())}
                                        >
                                            {isSubmitting ? "Guardando..." : "Guardar"}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    )
}
