'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreVertical, Calendar, User as UserIcon, Trash2, Edit, Paperclip, Clock, AlertCircle, CheckCircle2, Circle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onStatusToggle?: (task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete, onDragStart, onStatusToggle }: TaskCardProps) {
  
  // Texto limpio
  const getPreviewText = (html: string) => {
    if (!html) return ""
    const withSpaces = html.replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ').replace(/<\/div>/gi, ' ')
    return withSpaces.replace(/<[^>]*>?/gm, '').trim()
  }

  // Funciones de fecha nativas
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

  // Badge de prioridad
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': 
        return { text: 'Alta', color: 'bg-red-100 text-red-700 border-red-200' }
      case 'medium': 
        return { text: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-200' }
      case 'low': 
        return { text: 'Baja', color: 'bg-blue-100 text-blue-700 border-blue-200' }
      default: 
        return { text: 'Normal', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    }
  }

  // Lógica de estado de fecha
  const getDateStatus = () => {
    if (!task.dueDate) return null
    
    const due = new Date(task.dueDate)
    const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    
    if (task.status === 'done') {
        return { 
          text: formatDate(dueLocal), 
          color: "bg-emerald-100 text-emerald-700 border-emerald-200"
        }
    }

    if (isPast(dueLocal) && !isToday(dueLocal)) {
        return { 
          text: "Atrasada", 
          color: "bg-red-100 text-red-700 border-red-200"
        }
    }
    if (isToday(dueLocal)) {
        return { 
          text: "Hoy", 
          color: "bg-amber-100 text-amber-700 border-amber-200"
        }
    }
    if (isTomorrow(dueLocal)) {
        return { 
          text: "Mañana", 
          color: "bg-blue-100 text-blue-700 border-blue-200"
        }
    }
    
    return { 
      text: "A tiempo", 
      color: "bg-teal-100 text-teal-700 border-teal-200"
    }
  }

  const dateStatus = getDateStatus()
  const priorityBadge = getPriorityBadge(task.priority)

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStatusToggle) {
      onStatusToggle(task)
    }
  }

  return (
    <Card 
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onEdit(task)}
      className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer bg-card group mb-3 border"
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Radio/Checkbox Button */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Evitar que se abra el panel al hacer clic en el botón
              handleToggle(e)
            }}
            className={cn(
              "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              task.status === 'done' 
                ? "bg-emerald-500 border-emerald-500" 
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            {task.status === 'done' && (
              <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Título */}
            <h4 
              className={cn(
                "text-sm font-semibold mb-2",
                task.status === 'done' && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-medium border", priorityBadge.color)}>
                {priorityBadge.text}
              </Badge>
              
              {task.projectId && typeof task.projectId !== 'string' && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium bg-blue-50 text-blue-700 border-blue-200">
                  {task.projectId.name}
                </Badge>
              )}

              {dateStatus && (
                <Badge variant="outline" className={cn("text-xs px-2 py-0.5 font-medium border", dateStatus.color)}>
                  {dateStatus.text}
                </Badge>
              )}
            </div>

            {/* Footer: Fecha y Adjuntos */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {(() => {
                      const due = new Date(task.dueDate)
                      const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate())
                      if (isToday(dueLocal)) return "Hoy"
                      if (isTomorrow(dueLocal)) return "Mañana"
                      return formatDate(dueLocal)
                    })()}
                  </span>
                </div>
              )}

              {task.estimatedTime && (
                <div className="flex items-center gap-1" title="Tiempo estimado">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatTime(task.estimatedTime)}</span>
                </div>
              )}

              {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>{task.attachments.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Avatar y Menú */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()} // Evitar que se abra el panel al hacer clic en el menú
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="mr-2 h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task)}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {task.assignedTo ? (
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarImage src={task.assignedTo.avatar} />
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                  {task.assignedTo.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted/40 flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}