'use client'

import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LexicalEditor } from "@/components/editor/LexicalEditor"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  Flag, 
  FolderKanban, 
  Link as LinkIcon, 
  MoreHorizontal, 
  User, 
  X,
  MessageSquare,
  Paperclip,
  Trash2,
  AlertCircle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { type Task, type Project } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TaskDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null // null = creating new task
  projects: Project[]
  onSave: (taskData: Partial<Task>) => Promise<void>
  onDelete?: (task: Task) => void
}

export function TaskDetailSheet({ 
  open, 
  onOpenChange, 
  task, 
  projects, 
  onSave,
  onDelete
}: TaskDetailSheetProps) {
  // Local state for form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [projectId, setProjectId] = useState<string>("none")
  const [dueDate, setDueDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setStatus(task.status)
        setPriority(task.priority)
        const pId = task.projectId ? (typeof task.projectId === 'object' ? task.projectId._id : task.projectId) : "none"
        setProjectId(pId)
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "")
      } else {
        // New Task Defaults
        setTitle("")
        setDescription("")
        setStatus("todo")
        setPriority("medium")
        setProjectId("none")
        setDueDate("")
      }
    }
  }, [open, task])

  const handleSubmit = async () => {
    if (!title.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSave({
        title,
        description,
        status: status as any,
        priority: priority as any,
        projectId: projectId === "none" ? undefined : projectId,
        dueDate: dueDate || undefined
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper for status badge
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'todo': return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      case 'in_progress': return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      case 'done': return 'bg-green-100 text-green-700 hover:bg-green-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl p-0 overflow-hidden flex flex-col bg-card" side="right">
        <SheetHeader className="sr-only">
          <SheetTitle>Detalle de la tarea</SheetTitle>
          <SheetDescription>Edita los detalles de tu tarea</SheetDescription>
        </SheetHeader>
        {/* Header / Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("h-8 text-xs font-medium border-0 px-2.5", task?.status === 'done' && "bg-green-100 text-green-700")}
              onClick={() => setStatus(status === 'done' ? 'todo' : 'done')}
            >
              <CheckSquare className={cn("mr-1.5 h-3.5 w-3.5", status === 'done' ? "fill-current" : "")} />
              {status === 'done' ? 'Completada' : 'Marcar como finalizada'}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] h-full">
            
            {/* Main Column */}
            <div className="p-6 space-y-8">
              {/* Title */}
              <div className="space-y-4">
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50"
                  placeholder="Escribe el nombre de la tarea..."
                />
                
                {/* Overdue Alert */}
                {task?.isOverdue && status !== 'done' && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-red-900">Esta tarea está atrasada</p>
                      <p className="text-xs text-red-700">
                        {task.overdueAt 
                          ? `Marcada como atrasada ${format(new Date(task.overdueAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}`
                          : `La fecha de entrega era ${task.dueDate ? format(new Date(task.dueDate), "d 'de' MMMM", { locale: es }) : 'anterior'}`
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    en la lista 
                    <Badge variant="secondary" className={cn("ml-1 capitalize font-normal rounded-sm", getStatusColor(status))}>
                      {status === 'todo' ? 'Por hacer' : status === 'in_progress' ? 'En progreso' : 'Completado'}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Descripción</h3>
                </div>
                <div className="border rounded-md overflow-hidden bg-background shadow-sm min-h-[200px]">
                  <LexicalEditor
                    initialValue={description}
                    onChange={setDescription}
                    placeholder="Añade una descripción detallada..."
                    className="h-full"
                  />
                </div>
              </div>

              {/* Subtasks Placeholder (Visual only for now) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Subtareas</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    Ocultar completadas
                  </Button>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-muted-foreground h-9 text-sm font-normal border-dashed">
                    <PlusIcon className="mr-2 h-3.5 w-3.5" /> Agregar subtarea
                  </Button>
                </div>
              </div>

              {/* Activity / Comments Placeholder */}
              <div className="pt-6 border-t">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>YO</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="border rounded-lg p-3 bg-background shadow-sm">
                      <Input 
                        placeholder="Escribe un comentario..." 
                        className="border-0 p-0 shadow-none focus-visible:ring-0 h-auto text-sm"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button size="sm" disabled>Comentar</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="bg-muted/10 border-l p-6 space-y-6">
              
              {/* Project */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proyecto</label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full bg-background border-0 shadow-sm hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2 truncate">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">
                        {projects.find(p => p._id === projectId)?.name || "Sin proyecto"}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proyecto</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Responsable</label>
                <Button variant="outline" className="w-full justify-start font-normal bg-background border-0 shadow-sm hover:bg-accent/50">
                  <Avatar className="h-5 w-5 mr-2">
                    {task?.assignedTo?.avatar ? (
                        <AvatarImage src={task.assignedTo.avatar} />
                    ) : null}
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                        {task?.assignedTo?.name?.slice(0, 2).toUpperCase() || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{task?.assignedTo?.name || "Sin asignar"}</span>
                </Button>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha de entrega</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-background border-0 shadow-sm hover:bg-accent/50 pl-9"
                  />
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridad</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className={cn("w-full border-0 shadow-sm transition-colors", getPriorityColor(priority))}>
                    <div className="flex items-center gap-2">
                      <Flag className={cn("h-4 w-4", priority === 'high' && "fill-current")} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Metadata Readonly */}
              <Separator />
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Creada</span>
                  <span>{task?.createdAt ? format(new Date(task.createdAt), "d MMM, p", { locale: es }) : "Ahora"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>ID</span>
                  <span className="font-mono select-all">#{task?._id?.slice(-4).toUpperCase() || "NEW"}</span>
                </div>
              </div>

              {/* Actions */}
              {task && onDelete && (
                <div className="pt-4 mt-auto">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(task)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar tarea
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer Actions (Mobile mainly, or for explicit Save) */}
        <div className="border-t p-4 flex justify-end gap-2 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : task ? "Guardar cambios" : "Crear tarea"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

