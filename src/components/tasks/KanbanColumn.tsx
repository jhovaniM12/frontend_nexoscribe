'use client'

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import {
    Plus,
    MoreHorizontal,
    ChevronDown,
    ChevronRight,
    Palette,
    Trash2,
    Edit3,
    GripVertical,
    } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Colores predefinidos para columnas
const COLUMN_COLORS = [
    { name: 'Gray', value: '#6b7280' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
]

export interface KanbanColumnData {
    id: string
    title: string
    color: string
    wipLimit?: number
    collapsed?: boolean
    order?: number
}

interface KanbanColumnProps {
    column: KanbanColumnData
    taskCount: number
    isOver?: boolean
    onUpdate: (id: string, updates: Partial<KanbanColumnData>) => void
    onDelete: (id: string) => void
    onAddTask: (columnId: string) => void
    onDragStart?: (e: React.DragEvent, columnId: string) => void
    onDragOver?: (e: React.DragEvent) => void
    onDrop?: (e: React.DragEvent, columnId: string) => void
    children: React.ReactNode
    className?: string
}

export function KanbanColumn({
    column,
    taskCount,
    isOver = false,
    onUpdate,
    onDelete,
    onAddTask,
    onDragStart,
    onDragOver,
    onDrop,
    children,
    className
}: KanbanColumnProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(column.title)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleTitleSubmit = () => {
        if (editTitle.trim()) {
            onUpdate(column.id, { title: editTitle.trim() })
        } else {
            setEditTitle(column.title)
        }
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSubmit()
        } else if (e.key === 'Escape') {
            setEditTitle(column.title)
            setIsEditing(false)
        }
    }

    const toggleCollapse = () => {
        onUpdate(column.id, { collapsed: !column.collapsed })
    }

    return (
        <div
            className={cn(
                "flex-shrink-0 flex flex-col rounded-xl transition-all duration-200 group",
                "h-full max-h-full", // Removed bg-card and heavy borders for transparency
                column.collapsed ? "w-12 items-center bg-muted/30" : "w-[300px] lg:w-[340px] xl:w-[360px]",
                isOver && "ring-2 ring-primary/20",
                className
            )}
            onDragOver={(e) => {
                e.preventDefault()
                onDragOver?.(e)
            }}
            onDrop={(e) => onDrop?.(e, column.id)}
        >
            {column.collapsed ? (
                // Collapsed Column View
                <div className="flex flex-col items-center py-4 h-full">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mb-3"
                        onClick={toggleCollapse}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div
                        className="h-3 w-3 rounded-full mb-3"
                        style={{ backgroundColor: column.color }}
                    />
                    <span
                        className="text-xs font-medium text-muted-foreground writing-mode-vertical transform rotate-180"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        {column.title}
                    </span>
                    <Badge
                        variant="secondary"
                        className="mt-3 text-[10px] px-1.5 py-0.5 rounded-md"
                    >
                        {taskCount}
                    </Badge>
                </div>
            ) : (
                <>
                    {/* Column Header (Clean & Minimal) */}
                    <div className="flex items-center justify-between px-3 py-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded-md border border-transparent hover:border-border/50 transition-colors">
                                <div
                                    className="h-2 w-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: column.color }}
                                />
                                {isEditing ? (
                                    <Input
                                        ref={inputRef}
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={handleTitleSubmit}
                                        onKeyDown={handleKeyDown}
                                        className="h-6 w-32 text-sm font-semibold px-1 py-0 border-none focus-visible:ring-0 bg-transparent p-0 m-0"
                                        autoFocus
                                    />
                                ) : (
                                    <h3
                                        className="font-medium text-sm truncate cursor-pointer"
                                        onClick={() => {
                                            setIsEditing(true)
                                            setTimeout(() => inputRef.current?.select(), 0)
                                        }}
                                    >
                                        {column.title}
                                    </h3>
                                )}
                                <span className="text-xs text-muted-foreground font-medium ml-1">
                                    {taskCount}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <div
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                draggable
                                onDragStart={(e) => onDragStart?.(e, column.id)}
                            >
                                <GripVertical
                                    className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-all"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => onAddTask(column.id)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Renombrar
                                    </DropdownMenuItem>
                                    {/* ... rest of menu items same as before ... */}
                                    <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                                        <PopoverTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Palette className="h-4 w-4 mr-2" />
                                                Cambiar color
                                                <div
                                                    className="h-3 w-3 rounded-full ml-auto"
                                                    style={{ backgroundColor: column.color }}
                                                />
                                            </DropdownMenuItem>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-3" align="start">
                                            <div className="grid grid-cols-6 gap-2">
                                                {COLUMN_COLORS.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        className={cn(
                                                            "h-6 w-6 rounded-full transition-transform hover:scale-110",
                                                            column.color === color.value && "ring-2 ring-offset-2 ring-primary"
                                                        )}
                                                        style={{ backgroundColor: color.value }}
                                                        onClick={() => {
                                                            onUpdate(column.id, { color: color.value })
                                                            setShowColorPicker(false)
                                                        }}
                                                        title={color.name}
                                                    />
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={toggleCollapse}>
                                        <ChevronDown className="h-4 w-4 mr-2 rotate-90" />
                                        Colapsar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => onDelete(column.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar columna
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Tasks Container (Transparent) */}
                    <div className="flex-1 h-full overflow-y-auto px-2 pb-2 scrollbar-thin">
                        <div className="flex flex-col gap-3">
                            {children}

                            {/* Invisible Drop Zone / Empty State */}
                            {taskCount === 0 && (
                                <div className={cn(
                                    "h-full min-h-[150px] border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground/40 text-sm font-medium transition-colors",
                                    isOver ? "border-primary/30 bg-primary/5" : "border-muted/40 hover:border-muted-foreground/20"
                                )}>
                                    Arrastra tareas aquí
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export { COLUMN_COLORS }
