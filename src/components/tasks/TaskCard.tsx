'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  User as UserIcon,
  Edit,
  Paperclip,
  Clock,
  CheckCircle2,
  FolderKanban,
  MessageSquare
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onStatusToggle?: (task: Task) => void
  onQuickAssign?: (taskId: string, userId: string | null) => void
  availableMembers?: Array<{ userId: { _id: string; name: string; email: string; avatar?: string } | string; role: string }>
  owner?: { _id: string; name: string; email: string; avatar?: string } | null
  currentUserId?: string
}

// Funciones de fecha
const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const isTomorrow = (date: Date) => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
}

const isPast = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const formatDate = (date: Date) => {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// Configuración de prioridades
const PRIORITY_CONFIG = {
  high: {
    label: 'Alto',
    className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
  },
  medium: {
    label: 'Medio',
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  low: {
    label: 'Bajo',
    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  default: {
    label: 'Normal',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
  }
} as const

export function TaskCard({
  task,
  onEdit,
  onDragStart,
  onStatusToggle,
  onQuickAssign,
  availableMembers = [],
  owner
}: TaskCardProps) {

  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.default
  const isDone = task.status === 'done'

  // Calcular si está atrasada
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isDone

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStatusToggle) {
      onStatusToggle(task)
    }
  }

  const getDateInfo = () => {
    if (!task.dueDate) return null
    const due = new Date(task.dueDate)
    const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate())

    let text = formatDate(dueLocal)
    let className = 'text-muted-foreground'

    if (isToday(dueLocal)) {
      text = 'Hoy'
      className = 'text-primary font-medium'
    } else if (isTomorrow(dueLocal)) {
      text = 'Mañana'
      className = 'text-amber-600 dark:text-amber-400'
    } else if (isPast(dueLocal) && !isDone) {
      className = 'text-destructive font-medium'
    }

    return { text, className }
  }


  const dateInfo = getDateInfo()

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onEdit(task)}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "border border-border/40 bg-card rounded-2xl shadow-sm",
        "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
        "active:scale-[0.99] active:shadow-sm",
        isDone && "opacity-60 bg-muted/20",
        isOverdue && "border-destructive/10 bg-destructive/5"
      )}
    >
      <CardContent className="p-5 space-y-4">
        {/* Title & Description */}
        <div className="space-y-1">
          <h4 className={cn(
            "text-base font-bold text-foreground tracking-tight leading-tight",
            isDone && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
          <p className="text-sm text-muted-foreground/80 line-clamp-2 font-medium">
            {task.description ? task.description.replace(/<[^>]*>?/gm, '') : "No description provided."}
          </p>
        </div>

        {/* Avatars Section */}
        <div className="flex items-center pt-1">
          <div className="flex items-center -space-x-2">
            {task.assignedTo ? (
              <div
                className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden z-20 shadow-sm"
                title={task.assignedTo.name}
              >
                {task.assignedTo.avatar ? (
                  <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {(task.assignedTo.name || 'U').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 z-20">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            )}
            {/* Added a decorative second avatar to match reference visual stack if multiple would exist */}
            {task.assignedTo && <div className="h-8 w-8 rounded-full bg-violet-400 border-2 border-background z-10 hidden sm:block shadow-sm" />}
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="h-px bg-border/40 -mx-5" />

        {/* Footer: Priority & Meta Icons */}
        <div className="flex items-center justify-between pt-1">
          <Badge
            variant="outline"
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold shadow-none border-border/60",
              priority.className
            )}
          >
            {priority.label}
          </Badge>

          <div className="flex items-center gap-4 text-muted-foreground/60">
            {dateInfo && (
              <div className={cn("flex items-center gap-1.5 text-xs font-bold", dateInfo.className)}>
                <Calendar className="h-4 w-4" strokeWidth={2.5} />
                <span>{dateInfo.text}</span>
              </div>
            )}

            {(task.attachments?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <Paperclip className="h-4 w-4" strokeWidth={2.5} />
                <span>{task.attachments?.length}</span>
              </div>
            )}

            {(task.commentsCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
                <span>{task.commentsCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}