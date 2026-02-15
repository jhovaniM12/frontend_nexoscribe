'use client'

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Calendar,
    MessageSquare,
    Paperclip,
    Clock,
    User as UserIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Task } from "@/lib/api"

interface KanbanCardProps {
    task: Task
    isOverlay?: boolean
    onEdit?: (task: Task) => void
    onDelete?: (task: Task) => void
}

const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
}

const getDateInfo = (dueDate?: string, status?: string) => {
    if (!dueDate) return { text: "Sin fecha", className: "text-muted-foreground/60" }
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

    let text = `${dueLocal.getDate()} ${months[dueLocal.getMonth()]}`
    let className = "text-muted-foreground"

    if (dueLocal.getTime() === today.getTime()) {
        text = "Hoy"
        className = "text-primary font-medium"
    } else if (dueLocal.getTime() === today.getTime() + 86400000) {
        text = "Mañana"
        className = "text-amber-600 dark:text-amber-400"
    } else if (dueLocal < today && status !== "done") {
        className = "text-destructive font-medium"
    }

    return { text, className }
}

const PRIORITY_CONFIG = {
    high: { label: "Alto", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20" },
    medium: { label: "Medio", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    low: { label: "Bajo", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    default: { label: "Normal", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
} as const

const STATUS_CONFIG = {
    todo: { label: "Por hacer", className: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20" },
    in_progress: { label: "En progreso", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    done: { label: "Completado", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
} as const

export function KanbanCard({ task, isOverlay, onEdit }: KanbanCardProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task._id || task.id || "",
        data: {
            type: "Task",
            task,
        },
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-primary/10 border-2 border-primary border-dashed rounded-xl min-h-[180px] w-full"
            />
        )
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group relative bg-card hover:bg-accent/10 hover:border-primary/20 transition-all duration-200 border-border/40 rounded-lg shadow-sm cursor-grab active:cursor-grabbing",
                isOverlay ? "rotate-2 scale-105 shadow-xl cursor-grabbing z-50 ring-1 ring-border" : ""
            )}
            onClick={() => onEdit?.(task)}
        >
            <CardContent className="p-3 flex flex-col gap-2.5">
                {/* Top: Estado (izq) | Prioridad (der) */}
                <div className="flex items-center justify-between gap-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-md px-2 py-0 text-[10px] font-semibold shrink-0 border",
                            (STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.todo).className
                        )}
                    >
                        {(STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.todo).label}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-md px-2 py-0 text-[10px] font-semibold shrink-0 border",
                            (PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.default).className
                        )}
                    >
                        {(PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.default).label}
                    </Badge>
                </div>

                {/* Middle: Título + Descripción */}
                <div className="space-y-0.5">
                    <h4 className={cn(
                        "font-semibold text-sm text-foreground leading-snug group-hover:text-primary transition-colors",
                        task.status === "done" && "line-through text-muted-foreground"
                    )}>
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description.replace(/<[^>]*>?/gm, "")}
                        </p>
                    )}
                </div>

                {/* Bottom: Avatar | Fecha | Tiempo | Adjuntos | Comentarios (una sola fila) */}
                <div className="flex items-center gap-3 pt-1 flex-wrap text-[10px]">
                    {task.assignedTo ? (
                        <Avatar className="h-5 w-5 border border-background shrink-0">
                            <AvatarImage src={task.assignedTo.avatar} />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                {(task.assignedTo.name || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center border border-dashed border-muted-foreground/20 shrink-0">
                            <UserIcon className="h-3 w-3 text-muted-foreground/40" />
                        </div>
                    )}
                    <div className={cn(
                        "flex items-center gap-1 font-medium shrink-0",
                        getDateInfo(task.dueDate, task.status).className
                    )}>
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{getDateInfo(task.dueDate, task.status).text}</span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 font-medium shrink-0",
                        task.estimatedTime ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/60"
                    )}>
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{task.estimatedTime ? formatTime(task.estimatedTime) : "—"}</span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 font-medium shrink-0",
                        (task.attachments?.length ?? 0) > 0 ? "text-foreground/80" : "text-muted-foreground/60"
                    )}>
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span>{task.attachments?.length ?? 0}</span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 font-medium shrink-0",
                        (task.commentsCount ?? 0) > 0 ? "text-foreground/80" : "text-muted-foreground/60"
                    )}>
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span>{task.commentsCount ?? 0}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
