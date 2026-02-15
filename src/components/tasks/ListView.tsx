'use client'

import { useState, useMemo } from "react"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Plus, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, MoreVertical, MoreHorizontal, CheckCircle2, MessageSquare, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { format, isToday, isTomorrow, isPast, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { User as UserIcon, Calendar, Clock, Tag as TagIcon, AlertCircle, FolderKanban } from "lucide-react"

interface ListViewProps {
  tasks: Task[]
  loading: boolean
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onNewTask: () => void
  onStatusToggle?: (task: Task) => void
  onQuickAssign?: (taskId: string, userId: string | null) => void
  availableMembers?: Array<{ userId: { _id: string; name: string; email: string; avatar?: string } | string; role: string }>
  owner?: { _id: string; name: string; email: string; avatar?: string } | null
  currentUserId?: string
}

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'assignedTo'
type SortDirection = 'asc' | 'desc'

function SortButton({ field, currentField, direction, label, onClick }: {
  field: SortField
  currentField: SortField
  direction: SortDirection
  label: string
  onClick: () => void
}) {
  const isActive = currentField === field
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-8 px-2 gap-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-transparent",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {isActive ? (
        direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </Button>
  )
}

export function ListView({
  tasks,
  loading,
  onEditTask,
  onDeleteTask,
  onNewTask,
  onStatusToggle,
  onQuickAssign,
  availableMembers,
  owner
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Deduplicate and filter tasks with valid ID
  const validTasks = useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter(t => {
      const taskId = t._id || t.id;
      if (!taskId || seen.has(taskId)) return false;
      seen.add(taskId);
      return true;
    });
  }, [tasks]);

  const sortedTasks = [...validTasks].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'priority': {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
        aValue = (a.priority && priorityOrder[a.priority]) || 0
        bValue = (b.priority && priorityOrder[b.priority]) || 0
        break
      }
      case 'dueDate':
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
        break
      case 'assignedTo':
        aValue = a.assignedTo?.name || ''
        bValue = b.assignedTo?.name || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case 'high': return { label: 'Alta', variant: 'destructive' as const, dot: 'bg-red-500' }
      case 'medium': return { label: 'Media', variant: 'secondary' as const, dot: 'bg-amber-500' }
      case 'low': return { label: 'Baja', variant: 'outline' as const, dot: 'bg-blue-500' }
      default: return { label: 'Sin prioridad', variant: 'outline' as const, dot: 'bg-gray-400' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'todo': return { label: 'Por hacer', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
      case 'in_progress': return { label: 'En progreso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' }
      case 'done': return { label: 'Completado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' }
      default: return { label: status, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }
    }
  }

  const getDateStatus = (dueDate: string | undefined, status: string) => {
    if (!dueDate || status === 'done') return null

    const due = new Date(dueDate)
    const dueLocal = startOfDay(new Date(due.getFullYear(), due.getMonth(), due.getDate()))

    if (isPast(dueLocal) && !isToday(dueLocal)) {
      return { text: 'Atrasada', color: 'text-red-600 dark:text-red-400', icon: 'destructive' }
    }
    if (isToday(dueLocal)) {
      return { text: 'Hoy', color: 'text-amber-600 dark:text-amber-400', icon: 'warning' }
    }
    if (isTomorrow(dueLocal)) {
      return { text: 'Mañana', color: 'text-blue-600 dark:text-blue-400', icon: 'info' }
    }
    return null
  }

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  // Render member selection dropdown for assigning
  const renderAssignDropdown = (task: Task, trigger: React.ReactNode) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      {onQuickAssign && (
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Asignar a</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onQuickAssign(task._id || task.id || '', null)} className="gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="h-3 w-3" />
            </div>
            Sin asignar
          </DropdownMenuItem>
          {owner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onQuickAssign(task._id || task.id || '', owner._id)} className="gap-2">
                <Avatar className="h-6 w-6">
                  {owner.avatar && owner.avatar.trim() !== "" ? (
                    <AvatarImage src={owner.avatar} alt={owner.name} />
                  ) : null}
                  <AvatarFallback className="text-[9px] bg-primary/10">
                    {owner.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{owner.name}</span>
                <Badge variant="secondary" className="ml-auto text-[9px] px-1 h-4">Owner</Badge>
              </DropdownMenuItem>
            </>
          )}
          {availableMembers && availableMembers.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {availableMembers.map((member) => {
                const userData = typeof member.userId === 'object' ? member.userId : null
                if (!userData) return null
                if (owner && owner._id === userData._id) return null
                return (
                  <DropdownMenuItem key={userData._id} onClick={() => onQuickAssign(task._id || task.id || '', userData._id)} className="gap-2">
                    <Avatar className="h-6 w-6">
                      {userData.avatar && userData.avatar.trim() !== "" ? (
                        <AvatarImage src={userData.avatar} alt={userData.name} />
                      ) : null}
                      <AvatarFallback className="text-[9px] bg-muted">
                        {userData.name?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{userData.name}</span>
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="w-[40px] h-10">
                  <span className="sr-only">Estado</span>
                </TableHead>
                <TableHead className="h-10 min-w-[300px]">
                  <SortButton field="title" currentField={sortField} direction={sortDirection} label="Tarea" onClick={() => handleSort('title')} />
                </TableHead>
                <TableHead className="w-[100px] h-10">
                  <SortButton field="priority" currentField={sortField} direction={sortDirection} label="Prioridad" onClick={() => handleSort('priority')} />
                </TableHead>
                <TableHead className="w-[150px] h-10">
                  <SortButton field="assignedTo" currentField={sortField} direction={sortDirection} label="Asignado" onClick={() => handleSort('assignedTo')} />
                </TableHead>
                <TableHead className="w-[140px] h-10">
                  <SortButton field="dueDate" currentField={sortField} direction={sortDirection} label="Fecha" onClick={() => handleSort('dueDate')} />
                </TableHead>
                <TableHead className="w-[140px] h-10">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">Etiquetas</span>
                </TableHead>
                <TableHead className="w-[40px] h-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm">No hay tareas</p>
                      <Button onClick={onNewTask} variant="link" size="sm" className="h-auto p-0 text-primary">
                        Crear tarea
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTasks.map((task) => {
                  const dateStatus = getDateStatus(task.dueDate, task.status)
                  const priorityConfig = getPriorityConfig(task.priority || 'low')
                  const isDone = task.status === 'done'

                  return (
                    <TableRow
                      key={task._id || task.id}
                      className={cn(
                        "group cursor-pointer transition-colors border-b border-border/30 hover:bg-muted/30",
                        isDone && "bg-muted/10"
                      )}
                      onClick={() => onEditTask(task)}
                    >
                      {/* Checkbox */}
                      <TableCell className="py-2 pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => onStatusToggle?.(task)}
                          className={cn(
                            "h-4 w-4 transition-all border-muted-foreground/40",
                            isDone && "bg-primary border-primary text-primary-foreground"
                          )}
                        />
                      </TableCell>

                      {/* Título */}
                      <TableCell className="py-2">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "font-medium text-sm text-foreground/90",
                            isDone && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </span>
                          {task.projectId && typeof task.projectId !== 'string' && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50">
                              {task.projectId.name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Prioridad */}
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-1.5 w-1.5 rounded-full", priorityConfig.dot)} />
                          <span className="text-xs text-muted-foreground font-medium">{priorityConfig.label}</span>
                        </div>
                      </TableCell>

                      {/* Asignado */}
                      <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={task.assignedTo.avatar} />
                              <AvatarFallback className="text-[8px]">{task.assignedTo.name?.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">-</span>
                        )}
                      </TableCell>

                      {/* Fecha */}
                      <TableCell className="py-2">
                        {task.dueDate ? (
                          <span className={cn(
                            "text-xs font-medium",
                            dateStatus ? dateStatus.color : "text-muted-foreground"
                          )}>
                            {format(new Date(task.dueDate), "d MMM", { locale: es })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">-</span>
                        )}
                      </TableCell>

                      {/* Etiquetas */}
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {task.tags && task.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded flex items-center gap-1">
                              <TagIcon className="h-2 w-2 opacity-50" /> {tag}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditTask(task)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteTask(task)}>Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}
