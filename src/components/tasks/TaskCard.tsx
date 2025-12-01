'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, User as UserIcon, Edit, Paperclip, Clock, CheckCircle2, FolderKanban } from "lucide-react"
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

export function TaskCard({ task, onEdit, onDragStart, onStatusToggle, onQuickAssign, availableMembers = [], owner }: TaskCardProps) {

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

  // Badge de prioridad - Mejor contraste de colores sin hover
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high': 
        return { text: 'Alto', color: 'bg-purple-500/30 dark:bg-purple-500/40 text-purple-700 dark:text-purple-200 border-0 hover:bg-purple-500/30 hover:dark:bg-purple-500/40' }
      case 'medium': 
        return { text: 'Medio', color: 'bg-orange-500/30 dark:bg-orange-500/40 text-orange-700 dark:text-orange-200 border-0 hover:bg-orange-500/30 hover:dark:bg-orange-500/40' }
      case 'low': 
        return { text: 'Bajo', color: 'bg-teal-500/30 dark:bg-teal-500/40 text-teal-700 dark:text-teal-200 border-0 hover:bg-teal-500/30 hover:dark:bg-teal-500/40' }
      default: 
        return { text: 'Normal', color: 'bg-gray-500/30 dark:bg-gray-500/40 text-gray-700 dark:text-gray-200 border-0 hover:bg-gray-500/30 hover:dark:bg-gray-500/40' }
    }
  }

  // Badge de estado - Mejor contraste de colores sin hover
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': 
        return { text: 'En curso', color: 'bg-blue-500/30 dark:bg-blue-500/40 text-blue-700 dark:text-blue-200 border-0 hover:bg-blue-500/30 hover:dark:bg-blue-500/40' }
      case 'done': 
        return { text: 'Completado', color: 'bg-green-500/30 dark:bg-green-500/40 text-green-700 dark:text-green-200 border-0 hover:bg-green-500/30 hover:dark:bg-green-500/40' }
      case 'todo':
        // Mostrar "En riesgo" o "Con retraso" si está atrasada
        if (task.dueDate) {
          const due = new Date(task.dueDate)
          if (isPast(due) && !isToday(due)) {
            return { text: 'Con retraso', color: 'bg-red-500/30 dark:bg-red-500/40 text-red-700 dark:text-red-200 border-0 hover:bg-red-500/30 hover:dark:bg-red-500/40' }
          }
        }
        return { text: 'Por hacer', color: 'bg-gray-500/30 dark:bg-gray-500/40 text-gray-700 dark:text-gray-200 border-0 hover:bg-gray-500/30 hover:dark:bg-gray-500/40' }
      default:
        return { text: 'Por hacer', color: 'bg-gray-500/30 dark:bg-gray-500/40 text-gray-700 dark:text-gray-200 border-0 hover:bg-gray-500/30 hover:dark:bg-gray-500/40' }
    }
  }

  const priorityBadge = getPriorityBadge(task.priority || 'low')
  const statusBadge = getStatusBadge(task.status)

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
      className="shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-card group border hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Checkbox a la izquierda */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggle(e)
            }}
            className={cn(
              "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              task.status === 'done' 
                ? "bg-emerald-500 border-emerald-500" 
                : "border-gray-400 hover:border-gray-300"
            )}
          >
            {task.status === 'done' && (
              <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.5} />
            )}
          </button>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Título */}
            <h4 
              className={cn(
                "text-sm font-medium leading-snug",
                task.status === 'done' && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>

            {/* Badges de Prioridad y Estado */}
            <div className="flex flex-wrap gap-2">
              {task.projectId && typeof task.projectId !== 'string' && (
                <Badge className="text-xs px-2 py-0.5 font-normal bg-blue-500/30 dark:bg-blue-500/40 text-blue-700 dark:text-blue-200 border-0 flex items-center gap-1 hover:!bg-blue-500/30 hover:!dark:bg-blue-500/40">
                  <FolderKanban className="h-2.5 w-2.5" />
                  {task.projectId.name}
                </Badge>
              )}
              <Badge className={cn("text-xs px-2 py-0.5 font-normal pointer-events-none", priorityBadge.color)}>
                {priorityBadge.text}
              </Badge>
              <Badge className={cn("text-xs px-2 py-0.5 font-normal pointer-events-none", statusBadge.color)}>
                {statusBadge.text}
              </Badge>
            </div>

            {/* Archivos adjuntos y tiempo estimado */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3 flex-shrink-0" />
                  <span>{task.attachments.length}</span>
                </div>
              )}
              {task.estimatedTime && (
                <div className="flex items-center gap-1" title="Tiempo estimado">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{formatTime(task.estimatedTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Avatar y Fecha a la derecha */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Avatar */}
            {task.assignedTo ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  >
                    <Avatar className="h-8 w-8 border-2 border-background hover:ring-2 hover:ring-primary transition-all">
                      {task.assignedTo?.avatar && task.assignedTo.avatar.trim() !== "" ? (
                        <AvatarImage 
                          src={task.assignedTo.avatar} 
                          alt={task.assignedTo?.name || 'Usuario'} 
                        />
                      ) : null}
                      <AvatarFallback className="text-xs bg-blue-500 text-white font-semibold">
                        {(() => {
                          const name = task.assignedTo?.name;
                          return (name && typeof name === 'string' ? name : 'U').slice(0, 2).toUpperCase();
                        })()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                  {onQuickAssign ? (
                    <>
                      <DropdownMenuItem onClick={() => onQuickAssign(task._id, null)}>
                        <UserIcon className="mr-2 h-3.5 w-3.5" />
                        Sin asignar
                      </DropdownMenuItem>
                      {owner && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onQuickAssign(task._id, owner._id)}
                          >
                            <Avatar className="h-4 w-4 mr-2">
                              {owner.avatar && owner.avatar.trim() !== "" ? (
                                <AvatarImage src={owner.avatar} alt={owner.name} />
                              ) : null}
                              <AvatarFallback className="text-[8px]">
                                {owner.name?.slice(0, 2).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {owner.name} (Owner)
                          </DropdownMenuItem>
                        </>
                      )}
                      {availableMembers.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          {availableMembers.map((member) => {
                            const userData = typeof member.userId === 'object' ? member.userId : null
                            if (!userData) return null
                            if (owner && owner._id === userData._id) return null
                            return (
                              <DropdownMenuItem
                                key={userData._id}
                                onClick={() => onQuickAssign(task._id, userData._id)}
                              >
                                <Avatar className="h-4 w-4 mr-2">
                                  {userData.avatar && userData.avatar.trim() !== "" ? (
                                    <AvatarImage src={userData.avatar} alt={userData.name} />
                                  ) : null}
                                  <AvatarFallback className="text-[8px]">
                                    {userData.name?.slice(0, 2).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                {userData.name}
                              </DropdownMenuItem>
                            )
                          })}
                        </>
                      )}
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="mr-2 h-3.5 w-3.5" />
                      Asignar desde detalles...
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onQuickAssign && availableMembers.length > 0) {
                    // Asignar al primer miembro disponible o abrir dropdown
                    onEdit(task)
                  }
                }}
                className="cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/60 transition-colors">
                  <UserIcon className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </button>
            )}

            {/* Fecha debajo del avatar */}
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}