'use client'

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { organizationApi } from "@/lib/api"
import { useState, useEffect, useCallback, Suspense } from "react"
import { toast } from "sonner"
import { tasksApi, projectsApi, type Task, type Project, type Attachment, type CreateTaskRequest } from "@/lib/api"
import { useOrganization } from "@/context/organization-context"
import { useAuth } from "@/context/auth-context"
import { KanbanBoard } from "@/components/tasks/KanbanBoard"
import { ListView } from "@/components/tasks/ListView"
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet"
import { useSearchParams } from "next/navigation"
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
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, X, Loader2 } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"

function TasksPageContent() {
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get('project')
  
  const { currentOrganization } = useOrganization()
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState<string>(projectIdParam || 'all')
  const [filterAssigned, setFilterAssigned] = useState<string>('all') // 'all', 'me', 'unassigned', o userId
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("") // Input separado para debounce
  const [members, setMembers] = useState<Array<{ userId: { _id: string; name: string; email: string; avatar?: string } | string; role: string }>>([])
  const [owner, setOwner] = useState<{ _id: string; name: string; email: string; avatar?: string } | null>(null)
  
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
      const assignedToParam = filterAssigned === 'all' ? undefined : filterAssigned
      const searchParam = searchQuery.trim() || undefined
      
      const [tasksRes, projectsRes] = await Promise.all([
        tasksApi.getAll(
          filterProject === 'all' ? undefined : filterProject,
          assignedToParam,
          searchParam
        ),
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
  }, [currentOrganization, filterProject, filterAssigned, searchQuery])

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300) // Esperar 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Cargar miembros para el filtro
  useEffect(() => {
    if (currentOrganization?._id) {
      organizationApi.getMembers(currentOrganization._id)
        .then(response => {
          setMembers(response.members || [])
          setOwner(response.owner || null)
        })
        .catch(() => {
          // Silenciar errores, los filtros seguirán funcionando
        })
    }
  }, [currentOrganization])

  // Manejadores
  const handleNewTask = (date?: Date) => {
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
    } catch {
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
    } catch {
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
        assignedTo?: string
        tags?: string[]
      }> = {
        ...data,
        projectId: data.projectId 
          ? (typeof data.projectId === 'object' ? data.projectId._id : data.projectId)
          : undefined,
        assignedTo: data.assignedTo 
          ? (typeof data.assignedTo === 'object' ? data.assignedTo._id : (typeof data.assignedTo === 'string' ? data.assignedTo : undefined))
          : undefined,
        estimatedTime: data.estimatedTime,
        attachments: data.attachments,
      }

      if (dialogMode === 'create') {
        if (!normalizedData.title) {
          toast.error("El título es requerido")
          return
        }
        const res = await tasksApi.create(normalizedData as CreateTaskRequest)
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
    } catch {
      // Revertir si falla
      setTasks(oldTasks)
      toast.error("Error al actualizar la tarea")
    }
  }

  const handleQuickAssign = async (taskId: string, userId: string | null) => {
    const task = tasks.find(t => t._id === taskId)
    if (!task) return

    // Optimistic update
    const oldTasks = [...tasks]
    const updatedTasks = tasks.map(t => {
      if (t._id === taskId) {
        if (userId) {
          // Buscar el usuario en los miembros
          const member = members.find(m => {
            const u = typeof m.userId === 'object' ? m.userId : null
            return u && u._id === userId
          })
          const userData = member && typeof member.userId === 'object' ? member.userId : null
          const ownerUser = owner && owner._id === userId ? owner : null
          return {
            ...t,
            assignedTo: userData || ownerUser || { _id: userId, name: 'Usuario', avatar: undefined }
          }
        } else {
          return { ...t, assignedTo: null }
        }
      }
      return t
    })
    setTasks(updatedTasks)

    try {
      await tasksApi.update(taskId, { assignedTo: userId || undefined })
      toast.success(userId ? "Tarea asignada" : "Asignación removida")
    } catch {
      // Revertir si falla
      setTasks(oldTasks)
      toast.error("Error al asignar la tarea")
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
    <AuthGuard>
      <Layout>
        <div className="flex flex-col space-y-8">
          <Tabs defaultValue="kanban" className="flex flex-col">
              {/* Header */}
              <div className="flex flex-col gap-8 animate-fade-in">
              {/* Título y Descripción */}
              <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  <LayoutGrid className="h-8 w-8 md:h-9 md:w-9 text-primary" />
                  Mis Tareas
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg">
                  Gestiona tus tareas y proyectos de forma eficiente
                  </p>
              </div>
              
              {/* Controles y Filtros - Una sola fila */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 xl:gap-4 flex-wrap">
                  {/* Búsqueda */}
                  <div className="relative flex-1 xl:max-w-sm min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tareas..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 pr-8 h-10"
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setSearchInput("")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Vistas */}
                  <TabsList className="inline-flex w-auto">
                      <TabsTrigger value="kanban" className="flex items-center gap-2 text-xs sm:text-sm">
                          <LayoutGrid className="h-4 w-4" />
                          <span className="hidden sm:inline">Tablero</span>
                      </TabsTrigger>
                      <TabsTrigger value="list" className="flex items-center gap-2 text-xs sm:text-sm">
                          <ListIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Lista</span>
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center gap-2 text-xs sm:text-sm">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Calendario</span>
                      </TabsTrigger>
                  </TabsList>

                  {/* Filtro por Proyecto */}
                  <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-full xl:w-[200px] h-10">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos los proyectos</SelectItem>
                      {projects.map(p => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                      ))}
                  </SelectContent>
                  </Select>

                  {/* Filtro por Asignado */}
                  <Select value={filterAssigned} onValueChange={setFilterAssigned}>
                  <SelectTrigger className="w-full xl:w-[200px] h-10">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Asignado" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="me">Mis tareas</SelectItem>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                  </SelectContent>
                  </Select>
                  
                  {/* Botón Nueva Tarea */}
                  <Button onClick={() => handleNewTask()} className="w-full xl:w-auto xl:ml-auto shrink-0">
                  <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                  </Button>
              </div>
              </div>

              {/* Board Content */}
              <TabsContent value="kanban" className="flex-1 h-full min-h-[500px] sm:min-h-[600px] mt-4 sm:mt-6 border-0 p-0 data-[state=active]:flex flex-col -mx-2 sm:mx-0">
                  <KanbanBoard
                      tasks={tasks}
                      loading={loading}
                      onTaskMove={handleTaskMove}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onNewTask={() => handleNewTask()}
                      onStatusToggle={handleStatusToggle}
                      onQuickAssign={handleQuickAssign}
                      availableMembers={members}
                      owner={owner}
                      currentUserId={user?._id}
                  />
              </TabsContent>

              {/* List View Content */}
              <TabsContent value="list" className="flex-1 h-full min-h-[600px] mt-6 border-0 p-0 data-[state=active]:flex flex-col">
                  <ListView
                      tasks={tasks}
                      loading={loading}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onNewTask={() => handleNewTask()}
                      onStatusToggle={handleStatusToggle}
                      onQuickAssign={handleQuickAssign}
                      availableMembers={members}
                      owner={owner}
                      currentUserId={user?._id}
                  />
              </TabsContent>

              {/* Calendar Content */}
              <TabsContent value="calendar" className="flex-1 mt-6 border-0 p-0 flex flex-col min-h-[600px]">
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
                                    handleNewTask(day)
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
    </AuthGuard>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Layout>
      </AuthGuard>
    }>
      <TasksPageContent />
    </Suspense>
  )
}
