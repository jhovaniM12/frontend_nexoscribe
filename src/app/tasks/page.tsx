'use client'

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { tasksApi, projectsApi, type Task, type Project, type Attachment } from "@/lib/api"
import { useOrganization } from "@/context/organization-context"
import { KanbanBoard } from "@/components/tasks/KanbanBoard"
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO,
  isBefore,
  startOfDay
} from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function TasksPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get('project')
  
  const { currentOrganization } = useOrganization()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState<string>(projectIdParam || 'all')
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined)
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date())

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!currentOrganization) return
    
    try {
      setLoading(true)
      const [tasksRes, projectsRes] = await Promise.all([
        tasksApi.getAll(filterProject === 'all' ? undefined : filterProject),
        projectsApi.getAll()
      ])
      
      setTasks(tasksRes.tasks || [])
      setProjects(projectsRes.projects || [])
    } catch (error) {
      console.error("Error loading tasks:", error)
      toast.error("Error al cargar tareas")
    } finally {
      setLoading(false)
    }
  }, [currentOrganization, filterProject])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Manejadores
  const handleNewTask = (initialStatus = 'todo', date?: Date) => {
    setDialogMode('create')
    setSelectedTask(null)
    setInitialDate(date)
    setDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setDialogMode('edit')
    setSelectedTask(task)
    setDialogOpen(true)
  }

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    // Optimistic update
    const oldTasks = [...tasks]
    const updatedTasks = tasks.map(t => 
      t._id === taskId ? { ...t, status: newStatus as 'todo' | 'in_progress' | 'done' } : t
    )
    setTasks(updatedTasks)

    try {
      await tasksApi.move(taskId, newStatus, 0) // Posición 0 por defecto al mover
    } catch (error) {
      // Revertir si falla
      setTasks(oldTasks)
      toast.error("Error al mover la tarea")
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (!confirm("¿Eliminar esta tarea?")) return
    
    try {
      await tasksApi.delete(task._id)
      setTasks(tasks.filter(t => t._id !== task._id))
      toast.success("Tarea eliminada")
      setDialogOpen(false)
    } catch (error) {
      toast.error("Error al eliminar")
    }
  }

  const handleSaveTask = async (data: Partial<Task>) => {
    try {
      // Normalizar projectId: si es un objeto, extraer solo el _id
      const normalizedData: Partial<{
        title: string
        description?: string
        projectId?: string
        status?: 'todo' | 'in_progress' | 'done'
        priority?: 'low' | 'medium' | 'high'
        dueDate?: string
        estimatedTime?: number
        attachments?: Attachment[]
      }> = {
        ...data,
        projectId: data.projectId 
          ? (typeof data.projectId === 'object' ? data.projectId._id : data.projectId)
          : undefined,
        estimatedTime: data.estimatedTime,
        attachments: data.attachments,
      }

      if (dialogMode === 'create') {
        const res = await tasksApi.create(normalizedData as any)
        // Si hay filtro por proyecto, solo agregamos la tarea si coincide
        if (
          filterProject === 'all' ||
          !res.task.projectId ||
          (typeof res.task.projectId === 'object'
            ? res.task.projectId._id === filterProject
            : res.task.projectId === filterProject)
        ) {
          setTasks([...tasks, res.task])
        }
        toast.success("Tarea creada")
      } else {
        if (!selectedTask) return
        const res = await tasksApi.update(selectedTask._id, normalizedData)

        // Actualizar o quitar la tarea según el filtro actual
        if (filterProject === 'all') {
          setTasks(tasks.map(t => t._id === selectedTask._id ? res.task : t))
        } else {
          const newProjectId =
            res.task.projectId && typeof res.task.projectId === 'object'
              ? res.task.projectId._id
              : res.task.projectId

          if (newProjectId && newProjectId !== filterProject) {
            // Si la tarea ya no pertenece al proyecto filtrado, la removemos de la lista
            setTasks(tasks.filter(t => t._id !== selectedTask._id))
          } else {
            // Si sigue perteneciendo al proyecto filtrado, solo actualizamos sus datos
            setTasks(tasks.map(t => t._id === selectedTask._id ? res.task : t))
          }
        }
        toast.success("Tarea actualizada")
      }
      setDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Error al guardar")
      throw error
    }
  }

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    
    // Optimistic update
    const oldTasks = [...tasks]
    const updatedTasks = tasks.map(t => 
      t._id === task._id ? { ...t, status: newStatus as 'todo' | 'in_progress' | 'done' } : t
    )
    setTasks(updatedTasks)

    try {
      await tasksApi.update(task._id, { status: newStatus })
      toast.success(newStatus === 'done' ? "Tarea completada" : "Tarea reabierta")
    } catch (error) {
      // Revertir si falla
      setTasks(oldTasks)
      toast.error("Error al actualizar la tarea")
    }
  }

  // Calendar Helpers
  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Lunes
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = parseISO(task.dueDate)
      return isSameDay(taskDate, date)
    })
  }

  return (
    <Layout>
      <div className="flex flex-col h-full space-y-4">
        <Tabs defaultValue="kanban" className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0 mb-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                <LayoutGrid className="h-8 w-8 text-primary" />
                Mis Tareas
                </h1>
                <p className="text-muted-foreground mt-1">
                Gestiona tus tareas y proyectos
                </p>
            </div>
            
            <div className="flex items-center gap-2">
                <TabsList className="grid w-[200px] grid-cols-2 mr-2">
                    <TabsTrigger value="kanban" className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Tablero
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Calendario
                    </TabsTrigger>
                </TabsList>

                <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[200px]">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por proyecto" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projects.map(p => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                
                <Button onClick={() => handleNewTask()}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                </Button>
            </div>
            </div>

            {/* Board Content */}
            <TabsContent value="kanban" className="flex-1 h-full min-h-0 mt-0 border-0 p-0 data-[state=active]:flex flex-col">
                <KanbanBoard
                    tasks={tasks}
                    loading={loading}
                    onTaskMove={handleTaskMove}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onNewTask={handleNewTask}
                    onStatusToggle={handleStatusToggle}
                />
            </TabsContent>

            {/* Calendar Content */}
            <TabsContent value="calendar" className="flex-1 mt-0 border-0 p-0 flex flex-col min-h-0">
                 <div className="flex items-center justify-between px-1 mb-4">
                    <h2 className="text-xl font-bold capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleToday}>Hoy</Button>
                        <div className="flex items-center border rounded-md bg-background">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-border" />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-background border rounded-lg shadow-sm flex flex-col overflow-hidden">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b bg-muted/30">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                        <div key={day} className="p-2 text-xs font-medium text-center text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6 overflow-y-auto">
                        {calendarDays.map((day, dayIdx) => {
                        const dayTasks = getTasksForDay(day)
                        const isCurrentMonth = isSameMonth(day, monthStart)
                        const isDayToday = isToday(day)
                        const isPast = isBefore(day, startOfDay(new Date())) && !isDayToday

                        return (
                            <div
                            key={day.toString()}
                            onClick={() => {
                                if (!isPast) {
                                    handleNewTask('todo', day)
                                } else {
                                    toast.error("No puedes crear tareas en días pasados")
                                }
                            }}
                            className={cn(
                                "border-b border-r p-1.5 relative transition-colors flex flex-col gap-1 min-h-[80px]",
                                !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
                                isPast 
                                    ? isCurrentMonth ? "bg-muted/5 cursor-not-allowed" : "cursor-not-allowed"
                                    : "hover:bg-accent/10 cursor-pointer",
                                dayIdx % 7 === 6 && "border-r-0"
                            )}
                            >
                            <div className="flex items-center justify-between mb-1">
                                <span
                                className={cn(
                                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                    isDayToday 
                                    ? "bg-primary text-primary-foreground" 
                                    : "text-foreground/70"
                                )}
                                >
                                {format(day, 'd')}
                                </span>
                                {dayTasks.length > 0 && (
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                        {dayTasks.length}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {dayTasks.map((task) => (
                                <button
                                    key={task._id}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditTask(task)
                                    }}
                                    className={cn(
                                    "text-left text-[10px] p-1 rounded border truncate transition-all hover:shadow-sm group",
                                    task.status === 'done' 
                                        ? "bg-muted text-muted-foreground border-transparent line-through decoration-muted-foreground/50" 
                                        : task.priority === 'high' 
                                            ? "bg-red-50 text-red-700 border-red-100 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                                            : "bg-white text-foreground border-border hover:border-primary/50 dark:bg-secondary/50"
                                    )}
                                >
                                    <div className="flex items-center gap-1">
                                        {task.estimatedTime && (
                                            <Clock className="w-2 h-2 flex-shrink-0 opacity-50" />
                                        )}
                                        <span className="truncate">{task.title}</span>
                                    </div>
                                </button>
                                ))}
                            </div>
                            </div>
                        )
                        })}
                    </div>
                </div>
            </TabsContent>
        </Tabs>

        {/* Task Detail Sheet */}
        <TaskDetailSheet
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={selectedTask}
          initialDate={initialDate}
          projects={projects}
          onSave={handleSaveTask}
          onDelete={dialogMode === 'edit' && selectedTask ? handleDeleteTask : undefined}
        />
      </div>
    </Layout>
  )
}

export default function TasksPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Layout>
        <div className="space-y-4 sm:space-y-6">
          <h1 className="text-3xl font-bold">Tareas</h1>
        </div>
      </Layout>
    )
  }

  return <TasksPageContent />
}
