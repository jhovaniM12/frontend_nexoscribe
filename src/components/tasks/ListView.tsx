'use client'

import { useState } from "react"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Plus, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, MoreVertical, CheckCircle2 } from "lucide-react"
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

// Componente fuera del render para evitar recreación
function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (currentField !== field) {
    return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />
  }
  return direction === 'asc' ? 
    <ArrowUp className="h-3.5 w-3.5 ml-1" /> : 
    <ArrowDown className="h-3.5 w-3.5 ml-1" />
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

  const sortedTasks = [...tasks].sort((a, b) => {
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
      case 'priority':
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
        aValue = (a.priority && priorityOrder[a.priority]) || 0
        bValue = (b.priority && priorityOrder[b.priority]) || 0
        break
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

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
      case 'done': return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getDateStatus = (dueDate: string | undefined, status: string) => {
    if (!dueDate || status === 'done') return null
    
    const due = new Date(dueDate)
    const dueLocal = startOfDay(new Date(due.getFullYear(), due.getMonth(), due.getDate()))
    
    if (isPast(dueLocal) && !isToday(dueLocal)) {
      return { text: 'Atrasada', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' }
    }
    if (isToday(dueLocal)) {
      return { text: 'Hoy', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' }
    }
    if (isTomorrow(dueLocal)) {
      return { text: 'Mañana', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto border rounded-lg bg-card shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10 border-b">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px] h-12">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  Estado
                  <SortIcon field="status" currentField={sortField} direction={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="h-12">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  Tarea
                  <SortIcon field="title" currentField={sortField} direction={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[100px] h-12">
                <button
                  onClick={() => handleSort('priority')}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  Prioridad
                  <SortIcon field="priority" currentField={sortField} direction={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[140px] h-12">
                <button
                  onClick={() => handleSort('assignedTo')}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  Asignado
                  <SortIcon field="assignedTo" currentField={sortField} direction={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[140px] h-12">
                <button
                  onClick={() => handleSort('dueDate')}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  Fecha
                  <SortIcon field="dueDate" currentField={sortField} direction={sortDirection} />
                </button>
              </TableHead>
              <TableHead className="w-[120px] h-12">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etiquetas</span>
              </TableHead>
              <TableHead className="w-[80px] h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm">No hay tareas</p>
                    <Button onClick={onNewTask} size="sm" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear primera tarea
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => {
                const dateStatus = getDateStatus(task.dueDate, task.status)
                return (
                  <TableRow 
                    key={task._id} 
                    className={cn(
                      "group cursor-pointer transition-colors border-b",
                      task.status === 'done' && "opacity-60"
                    )}
                    onClick={() => onEditTask(task)}
                  >
                    <TableCell className="py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onStatusToggle) onStatusToggle(task)
                        }}
                        className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all",
                          task.status === 'done' 
                            ? "bg-green-500 border-green-500 hover:bg-green-600" 
                            : "border-gray-300 dark:border-gray-600 hover:border-primary"
                        )}
                      >
                        {task.status === 'done' && (
                          <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.5} />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-2 min-w-0">
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            "font-medium text-sm truncate flex-1",
                            task.status === 'done' && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.projectId && typeof task.projectId !== 'string' && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50">
                              <FolderKanban className="h-2.5 w-2.5 mr-1" />
                              {task.projectId.name}
                            </Badge>
                          )}
                          {task.attachments && task.attachments.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              📎 {task.attachments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={cn("text-xs px-2 py-0.5 border font-medium", getPriorityColor(task.priority || 'low'))}>
                        {(() => {
                          const priority = task.priority || 'low'
                          return priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'
                        })()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                      {task.assignedTo ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                              <Avatar className="h-6 w-6">
                                {task.assignedTo?.avatar && task.assignedTo.avatar.trim() !== "" ? (
                                  <AvatarImage 
                                    src={task.assignedTo.avatar} 
                                    alt={task.assignedTo?.name || 'Usuario'} 
                                  />
                                ) : null}
                                <AvatarFallback className="text-[9px]">
                                  {(task.assignedTo?.name || 'U').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-[100px]">{task.assignedTo?.name || 'Sin nombre'}</span>
                            </button>
                          </DropdownMenuTrigger>
                          {onQuickAssign && (
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onQuickAssign(task._id, null)}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                Sin asignar
                              </DropdownMenuItem>
                              {owner && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onQuickAssign(task._id, owner._id)}>
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
                              {availableMembers && availableMembers.length > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  {availableMembers.map((member) => {
                                    const userData = typeof member.userId === 'object' ? member.userId : null
                                    if (!userData) return null
                                    if (owner && owner._id === userData._id) return null
                                    return (
                                      <DropdownMenuItem key={userData._id} onClick={() => onQuickAssign(task._id, userData._id)}>
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
                            </DropdownMenuContent>
                          )}
                        </DropdownMenu>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                              <div className="h-6 w-6 rounded-full bg-muted/40 flex items-center justify-center border border-dashed">
                                <UserIcon className="h-3 w-3" />
                              </div>
                              <span>Sin asignar</span>
                            </button>
                          </DropdownMenuTrigger>
                          {onQuickAssign && (
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                              {owner && (
                                <DropdownMenuItem onClick={() => onQuickAssign(task._id, owner._id)}>
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
                              )}
                              {availableMembers && availableMembers.length > 0 && (
                                <>
                                  {owner && <DropdownMenuSeparator />}
                                  {availableMembers.map((member) => {
                                    const userData = typeof member.userId === 'object' ? member.userId : null
                                    if (!userData) return null
                                    if (owner && owner._id === userData._id) return null
                                    return (
                                      <DropdownMenuItem key={userData._id} onClick={() => onQuickAssign(task._id, userData._id)}>
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
                            </DropdownMenuContent>
                          )}
                        </DropdownMenu>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        {task.dueDate ? (
                          <>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar className={cn(
                                "h-3.5 w-3.5",
                                dateStatus ? dateStatus.color : "text-muted-foreground"
                              )} />
                              <span className={dateStatus ? dateStatus.color : ""}>
                                {format(new Date(task.dueDate), "d MMM, yyyy", { locale: es })}
                              </span>
                            </div>
                            {dateStatus && (
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 w-fit", dateStatus.bg, dateStatus.color, "border-current/20")}>
                                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                {dateStatus.text}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                        {task.estimatedTime && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(task.estimatedTime)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {task.tags && task.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50">
                              <TagIcon className="h-2.5 w-2.5 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                              +{task.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs px-2 py-0.5 capitalize font-medium", getStatusColor(task.status))}>
                          {task.status === 'todo' ? 'Por hacer' : task.status === 'in_progress' ? 'En progreso' : 'Completado'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditTask(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("¿Eliminar esta tarea?")) {
                                  onDeleteTask(task)
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

