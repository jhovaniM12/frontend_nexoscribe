'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MoreHorizontal, 
  Calendar, 
  User as UserIcon, 
  Trash2, 
  Edit, 
  FolderKanban,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, isPast, format, isToday, isTomorrow, isYesterday } from "date-fns"
import { es } from "date-fns/locale"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onStatusToggle?: (task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete, onDragStart, onStatusToggle }: TaskCardProps) {
  
  // Configuración de prioridad con colores más visibles
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
          label: 'Alta',
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200'
        }
      case 'medium':
        return {
          icon: <MinusCircle className="h-3.5 w-3.5" />,
          label: 'Media',
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200'
        }
      case 'low':
        return {
          icon: <ArrowDownCircle className="h-3.5 w-3.5" />,
          label: 'Baja',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        }
      default:
        return {
          icon: <MinusCircle className="h-3.5 w-3.5" />,
          label: 'Normal',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        }
    }
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600 fill-green-100" />
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-600 fill-blue-100" />
      default:
        return <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
    }
  }

  const priorityConfig = getPriorityConfig(task.priority)

  // Detectar si está atrasada
  const isOverdue = task.isOverdue && task.status !== 'done'
  const isDueSoon = task.dueDate && !isOverdue && isPast(new Date(task.dueDate)) === false && 
    new Date(task.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000 // menos de 24h

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStatusToggle) {
      onStatusToggle(task)
    }
  }

  const formatDueDate = (dateString: string) => {
    // Como las fechas vienen en UTC 00:00 y esto puede causar problemas de zona horaria
    // (ej. 24 Nov 00:00 UTC = 23 Nov 19:00 Colombia), vamos a normalizar la fecha
    // para tratarla como "día calendario" local.
    
    const utcDate = new Date(dateString);
    // Crear fecha local usando los componentes UTC para forzar el mismo día
    const localDate = new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate()
    );
    
    if (isToday(localDate)) return "Hoy"
    if (isTomorrow(localDate)) return "Mañana"
    if (isYesterday(localDate)) return "Ayer"
    return format(localDate, "d MMM", { locale: es })
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onEdit(task)}
      className={cn(
        "group relative bg-card rounded-lg border shadow-sm transition-all duration-200 cursor-pointer mb-2.5",
        "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
        task.status === 'done' && "opacity-70 bg-muted/30",
        isOverdue && "border-l-4 border-l-red-500 bg-red-50/30"
      )}
    >
      <div className="p-3.5 flex flex-col gap-3">
        
        {/* Top Row: Status + Title + Menu */}
        <div className="flex items-start gap-2.5">
          <button 
            onClick={handleStatusToggle}
            className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
          >
            {getStatusIcon()}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "text-sm font-medium leading-snug text-foreground",
              task.status === 'done' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>
          </div>
          
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 -mr-1 text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                  <Edit className="mr-2 h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive" 
                  onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Badges Row: Priority, Project, Status */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Priority Badge */}
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border",
            priorityConfig.bg,
            priorityConfig.border,
            priorityConfig.color
          )}>
            {priorityConfig.icon}
            <span>{priorityConfig.label}</span>
          </div>

          {/* Project Badge */}
          {task.projectId && typeof task.projectId !== 'string' && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-primary/5 text-primary border border-primary/20">
              <FolderKanban className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{task.projectId.name}</span>
            </div>
          )}

          {/* Status Badges */}
          {task.status === 'done' && (
            <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>Finalizada</span>
            </div>
          )}

          {isOverdue && task.status !== 'done' && (
            <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="h-3 w-3" />
              <span>Atrasada</span>
            </div>
          )}
          
          {isDueSoon && !isOverdue && task.status !== 'done' && (
            <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
              <Clock className="h-3 w-3" />
              <span>Próxima</span>
            </div>
          )}

          {!isOverdue && !isDueSoon && task.dueDate && task.status !== 'done' && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Clock className="h-3 w-3" />
              <span>A tiempo</span>
            </div>
          )}
        </div>

        {/* Footer: Date + Avatar */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Due Date */}
          {task.dueDate ? (
            <div className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium",
              isOverdue ? "text-red-600" : isDueSoon ? "text-orange-600" : "text-muted-foreground"
            )}>
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(task.dueDate)}</span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">Sin fecha</span>
          )}

          {/* Assignee Avatar */}
          {task.assignedTo ? (
            <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border">
              <AvatarImage src={task.assignedTo.avatar} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-medium">
                {task.assignedTo.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center border border-dashed border-muted-foreground/20">
              <UserIcon className="h-3 w-3 text-muted-foreground/40" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
