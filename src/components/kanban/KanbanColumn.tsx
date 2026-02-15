
'use client'

import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMemo, useState } from "react"
import { Task } from "@/lib/api"
import { KanbanCard } from "./KanbanCard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export interface Column {
    id: string
    title: string
    color?: string
    tasks: Task[]
}

interface KanbanColumnProps {
    column: Column
    tasks: Task[]
    isOverlay?: boolean
    onAddTask?: (columnId: string) => void
    onEditTask?: (task: Task) => void
    onDeleteTask?: (task: Task) => void
    onUpdateColumn?: (id: string, title: string) => void
    onDeleteColumn?: (id: string) => void
}

export function KanbanColumn({
    column,
    tasks,
    isOverlay,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onUpdateColumn,
    onDeleteColumn
}: KanbanColumnProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(column.title)

    const tasksIds = useMemo(() => {
        return tasks
            .map((task) => task._id || task.id)
            .filter((id): id is string => Boolean(id))
    }, [tasks])

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
        disabled: isEditing
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    }

    const handleRename = () => {
        if (!editTitle.trim()) {
            setEditTitle(column.title)
        } else {
            onUpdateColumn?.(column.id, editTitle)
        }
        setIsEditing(false)
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 border-2 border-primary bg-primary/10 w-[300px] md:w-[350px] h-[500px] rounded-xl flex-shrink-0"
            />
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "w-[300px] md:w-[350px] h-full max-h-full flex flex-col gap-3 flex-shrink-0 overflow-hidden",
                isOverlay ? "ring-2 ring-primary rounded-xl bg-background/50 backdrop-blur" : ""
            )}
        >
            {/* Header Clean Minimalist */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-between cursor-grab active:cursor-grabbing px-1 py-2 group"
            >
                <div className="flex gap-2 items-center flex-1 min-w-0">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider truncate flex items-center gap-2">
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: column.color || '#6b7280' }}
                        />
                        {column.title}
                        <span className="text-muted-foreground/60 ml-1 font-normal normal-case tracking-normal">
                            {tasks.length}
                        </span>
                    </h3>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddTask?.(column.id);
                        }}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                                setEditTitle(column.title)
                                setIsEditing(true)
                            }}>
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Renombrar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDeleteColumn?.(column.id)}
                            >
                                <Trash className="h-3.5 w-3.5 mr-2" />
                                Eliminar columna
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-grow pr-3 -mr-3">
                <div className="flex flex-col gap-3 p-1 pb-2">
                    <SortableContext items={tasksIds}>
                        {tasks.filter(t => Boolean(t._id || t.id)).map((task) => (
                            <KanbanCard
                                key={task._id || task.id}
                                task={task}
                                onEdit={onEditTask}
                                onDelete={onDeleteTask}
                            />
                        ))}
                    </SortableContext>
                </div>
            </ScrollArea>



        </div>
    )
}
