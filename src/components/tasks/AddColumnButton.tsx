'use client'

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { COLUMN_COLORS, type KanbanColumnData } from "./KanbanColumn"
import { cn } from "@/lib/utils"

interface AddColumnButtonProps {
    onAdd: (column: Omit<KanbanColumnData, 'id'>) => void
}

export function AddColumnButton({ onAdd }: AddColumnButtonProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[11].value) // Blue default
    const [wipLimit, setWipLimit] = useState<string>("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        onAdd({
            title: title.trim(),
            color: selectedColor,
            wipLimit: wipLimit ? parseInt(wipLimit) : undefined,
            collapsed: false,
        })

        // Reset form
        setTitle("")
        setSelectedColor(COLUMN_COLORS[11].value)
        setWipLimit("")
        setOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex-shrink-0 w-[320px] lg:w-[360px] xl:w-[380px] h-12 border-2 border-dashed border-muted-foreground/20",
                        "hover:border-primary/40 hover:bg-accent/50 transition-all rounded-xl",
                        "text-muted-foreground hover:text-primary",
                        "group"
                    )}
                >
                    <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Agregar sección
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start" onKeyDown={handleKeyDown}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="column-title">Nombre de la sección</Label>
                        <Input
                            id="column-title"
                            placeholder="Ej: En revisión, Bloqueado..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="grid grid-cols-9 gap-1.5">
                            {COLUMN_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    className={cn(
                                        "h-6 w-6 rounded-full transition-all hover:scale-110",
                                        selectedColor === color.value && "ring-2 ring-offset-2 ring-primary scale-110"
                                    )}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => setSelectedColor(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="wip-limit">
                            Límite WIP <span className="text-muted-foreground text-xs">(opcional)</span>
                        </Label>
                        <Input
                            id="wip-limit"
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Sin límite"
                            value={wipLimit}
                            onChange={(e) => setWipLimit(e.target.value)}
                            className="w-24"
                        />
                        <p className="text-xs text-muted-foreground">
                            Máximo de tareas permitidas en esta columna
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!title.trim()}
                        >
                            Agregar
                        </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    )
}
