'use client'

import * as React from "react"
import {
    Settings,
    Search,
    Plus,
    CheckSquare,
    FileText,
    FolderKanban,
    PenTool
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function CommandPalette() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            {/* Desktop: barra completa */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    "hidden md:flex items-center gap-3 w-full max-w-md h-10 px-4 rounded-xl",
                    "bg-muted/40 hover:bg-muted/60 border border-transparent hover:border-border/50",
                    "text-muted-foreground hover:text-foreground/80 transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Buscar (Ctrl+K)"
            >
                <Search className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left text-sm">Buscar...</span>
                <kbd className="pointer-events-none hidden sm:inline-flex h-6 select-none items-center gap-0.5 rounded-md border border-border/60 bg-background/80 px-2 font-mono text-[10px] font-medium text-muted-foreground">
                    <span>⌘</span>K
                </kbd>
            </button>
            {/* Móvil: icono compacto */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    "md:hidden flex h-9 w-9 items-center justify-center rounded-lg",
                    "bg-muted/40 hover:bg-muted/60 border border-transparent hover:border-border/50",
                    "text-muted-foreground hover:text-foreground/80 transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Buscar (Ctrl+K)"
            >
                <Search className="h-4 w-4" />
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Escribe un comando o busca algo..." />
                <CommandList>
                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    <CommandGroup heading="Sugerencias">
                        <CommandItem onSelect={() => runCommand(() => router.push('/tasks'))}>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            <span>Mis Tareas</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/projects'))}>
                            <FolderKanban className="mr-2 h-4 w-4" />
                            <span>Proyectos</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/notes'))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Notas</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/board'))}>
                            <PenTool className="mr-2 h-4 w-4" />
                            <span>Pizarra</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Acciones">
                        <CommandItem onSelect={() => runCommand(() => router.push('/tasks?action=new'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Nueva Tarea</span>
                            <CommandShortcut>⌘N</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configuración</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
