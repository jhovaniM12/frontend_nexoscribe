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
import { organizationApi } from "@/lib/api"
import { useState, useEffect, useCallback, Suspense } from "react"
import { toast } from "sonner"
import { tasksApi, projectsApi, type Task, type Project, type Attachment, type CreateTaskRequest } from "@/lib/api"
import { useOrganization } from "@/context/organization-context"
import { useAuth } from "@/context/auth-context"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { ListView } from "@/components/tasks/ListView"
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet"
import Image from "next/image"
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
import { Plus, Search, Filter, LayoutGrid, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
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
  const [filterAssigned] = useState<string>('all') // 'all', 'me', 'unassigned', o userId
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
        tasksApi.getAll({
          projectId: filterProject === 'all' ? undefined : filterProject,
          assignedTo: assignedToParam,
          search: searchParam
        }),
        projectsApi.getAll()
      ])

      const normalizedTasks = (tasksRes.tasks || []).map(t => ({
        ...t,
        _id: t._id || (t as Task & { id?: string }).id || ''
      }))
      setTasks(normalizedTasks)
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
      (t._id === taskId || t.id === taskId) ? {
        ...t,
        status: filterProject === 'all' ? newStatus as 'todo' | 'in_progress' | 'done' : t.status,
        sectionId: filterProject !== 'all' ? newStatus : t.sectionId
      } : t
    )
    setTasks(updatedTasks)

    try {
      if (filterProject !== 'all') {
        // Si estamos filtrando por proyecto, newStatus es en realidad el sectionId
        // Nota: Deberíamos idealmente saber qué status corresponde a la sección.
        // Por ahora, solo movemos la sección y mantenemos el status (o el backend podría manejarlo).
        await tasksApi.move(taskId, undefined, 0, newStatus, filterProject)
      } else {
        // Vista global: newStatus es el status
        await tasksApi.move(taskId, newStatus, 0) // Posición 0 por defecto al mover
      }
    } catch {
      // Revertir si falla
      setTasks(oldTasks)
      toast.error("Error al mover la tarea")
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (!confirm("¿Eliminar esta tarea?")) return

    try {
      await tasksApi.delete(task._id || task.id || '')
      setTasks(tasks.filter(t => (t._id !== (task._id || task.id) && t.id !== (task._id || task.id))))
      toast.success("Tarea eliminada")
      setDialogOpen(false)
    } catch {
      toast.error("Error al eliminar")
    }
  }

  // ... (handleSaveTask remains similar but need to check if context matches)

  const handleSaveTask = async (data: Partial<Task>) => {
    try {
      // Normalizar projectId: si es un objeto, extraer solo el _id
      const normalizedData: Partial<{
        title: string
        description?: string
        projectId?: string
        sectionId?: string
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
        sectionId: data.sectionId,
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

        // Si hay proyecto filtrado, asignar automáticamente
        if (filterProject !== 'all' && !normalizedData.projectId) {
          normalizedData.projectId = filterProject;
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
          const normalizedTask = { ...res.task, _id: res.task._id || (res.task as Task & { id?: string }).id || '' }
          setTasks([...tasks, normalizedTask])
        }
        toast.success("Tarea creada")
      } else {
        if (!selectedTask) return
        const res = await tasksApi.update(selectedTask._id || selectedTask.id || '', normalizedData)

        // Actualizar o quitar la tarea según el filtro actual
        const currentTaskId = selectedTask._id || selectedTask.id;
        const normalizedTask = { ...res.task, _id: res.task._id || (res.task as Task & { id?: string }).id || '' };
        if (filterProject === 'all') {
          setTasks(tasks.map(t => (t._id === currentTaskId || t.id === currentTaskId) ? normalizedTask : t))
        } else {
          const newProjectId =
            res.task.projectId && typeof res.task.projectId === 'object'
              ? res.task.projectId._id
              : res.task.projectId

          if (newProjectId && newProjectId !== filterProject) {
            // Si la tarea ya no pertenece al proyecto filtrado, la removemos de la lista
            setTasks(tasks.filter(t => (t._id !== currentTaskId && t.id !== currentTaskId)))
          } else {
            // Si sigue perteneciendo al proyecto filtrado, solo actualizamos sus datos
            setTasks(tasks.map(t => (t._id === currentTaskId || t.id === currentTaskId) ? normalizedTask : t))
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
        <div className="flex flex-col h-full overflow-hidden w-full">
          <Tabs defaultValue="kanban" className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Nav & Toolbar - Linear Style */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 px-3 sm:px-6 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm shrink-0">

              <div className="flex items-center gap-3 sm:gap-6 lg:gap-8 min-w-0 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="h-4 w-4 rounded-sm bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <LayoutGrid className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <h1 className="text-sm font-semibold tracking-tight">Tareas</h1>
                </div>

                <TabsList className="bg-transparent h-auto p-0 gap-4 sm:gap-6 border-none shrink-0">
                  <TabsTrigger
                    value="kanban"
                    className="h-8 rounded-none border-b-2 border-transparent px-1 pb-2 pt-0 text-xs font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none"
                  >
                    Tablero
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="h-8 rounded-none border-b-2 border-transparent px-1 pb-2 pt-0 text-xs font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none"
                  >
                    Lista
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="h-8 rounded-none border-b-2 border-transparent px-1 pb-2 pt-0 text-xs font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none"
                  >
                    Calendario
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-initial min-w-0">
                {/* Search */}
                <div className="relative group flex-1 sm:flex-initial min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    placeholder="Buscar..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8 h-8 w-full min-w-0 sm:w-[160px] md:w-[180px] text-[11px] bg-muted/20 border-transparent focus:bg-background focus:border-border/60 transition-all rounded-md"
                  />
                </div>

                <div className="h-4 w-px bg-border/40" />

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Filter className="h-3 w-3" />
                    Filtros
                  </Button>

                  <Button
                    onClick={() => handleNewTask()}
                    size="sm"
                    className="h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-medium gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nueva Tarea
                  </Button>
                </div>
              </div>
            </div>

            {/* Sub-header for Project Selection / Members (Optional based on scroll) */}
            <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-6 py-2 border-b border-border/30 bg-muted/10 shrink-0 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Proyecto:</span>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="h-6 border-none bg-transparent hover:bg-muted font-medium text-foreground w-fit gap-1.5 p-0 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-3 w-px bg-border/40" />

              <div className="flex items-center -space-x-1.5">
                {members.slice(0, 3).map((member, i) => {
                  const mUser = typeof member.userId === 'object' ? member.userId : { _id: member.userId, name: 'User', avatar: '' }
                  return (
                    <div key={i} className="h-5 w-5 rounded-full border border-background bg-muted flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all cursor-pointer shadow-sm">
                      {mUser.avatar ? (
                        <Image src={mUser.avatar} alt={mUser.name} width={20} height={20} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[8px] font-bold text-muted-foreground">
                          {mUser.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )
                })}
                {members.length > 3 && (
                  <div className="h-5 w-5 rounded-full border border-background bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground z-10 shadow-sm">
                    +{members.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* ... */}
            {/* Board Content */}
            <TabsContent value="kanban" className="flex-1 mt-0 border-0 p-0 data-[state=active]:flex flex-col overflow-hidden">
              <KanbanBoard
                tasks={tasks}
                loading={loading}
                onTaskMove={handleTaskMove}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onNewTask={() => {
                  setDialogMode('create')
                  setSelectedTask(null)
                  setInitialDate(undefined)
                  setDialogOpen(true)
                }}
                onStatusToggle={handleStatusToggle}
                onQuickAssign={handleQuickAssign}
                availableMembers={members}
                owner={owner}
                currentUserId={user?._id}
                projectId={filterProject === 'all' ? undefined : filterProject}
              />
            </TabsContent>
            {/* ... */}


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

            {/* Calendar Content - Linear Style */}
            <TabsContent value="calendar" className="flex-1 mt-0 border-0 p-0 flex flex-col overflow-hidden bg-background">
              {/* Calendar Nav */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-3 sm:px-6 py-4 shrink-0 border-b border-border/30">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <h2 className="text-sm font-semibold capitalize truncate">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                  </h2>
                  <div className="flex items-center border rounded-md overflow-hidden h-7">
                    <Button variant="ghost" size="icon" className="h-full w-7 rounded-none hover:bg-muted" onClick={handlePreviousMonth}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <div className="w-px h-4 bg-border/40" />
                    <Button variant="ghost" size="icon" className="h-full w-7 rounded-none hover:bg-muted" onClick={handleNextMonth}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] px-3 font-medium" onClick={handleToday}>Hoy</Button>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Hoy</span>
                  </div>
                  <div className="h-3 w-px bg-border/40 mx-1" />
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span>Alta Prioridad</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-border/20 shrink-0">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="py-2 text-[10px] font-semibold text-center text-muted-foreground/60 uppercase tracking-tighter">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6 auto-rows-fr">
                  {calendarDays.map((day, dayIdx) => {
                    const dayTasks = getTasksForDay(day)
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isDayToday = isToday(day)
                    const isPast = isBefore(day, startOfDay(new Date())) && !isDayToday

                    return (
                      <div
                        key={day.toString()}
                        onClick={() => {
                          if (!isPast) handleNewTask(day)
                        }}
                        className={cn(
                          "border-b border-r border-border/20 p-1 relative transition-all group/day min-h-0",
                          !isCurrentMonth && "bg-muted/5 opacity-40",
                          isPast ? "cursor-default" : "cursor-pointer hover:bg-muted/10",
                          dayIdx % 7 === 6 && "border-r-0"
                        )}
                      >
                        <div className="flex items-center justify-between p-1">
                          <span
                            className={cn(
                              "text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full transition-colors",
                              isDayToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground group-hover/day:text-foreground"
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          {dayTasks.length > 0 && !isDayToday && (
                            <div className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-col gap-0.5 px-0.5 overflow-hidden">
                          {dayTasks.slice(0, 3).map((task) => (
                            <button
                              key={task._id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTask(task)
                              }}
                              className={cn(
                                "group/task relative flex items-center gap-1.5 px-1.5 py-0.5 rounded-[3px] text-[9px] transition-all truncate",
                                task.status === 'done' ? "opacity-50 grayscale" : "hover:bg-muted"
                              )}
                            >
                              <div
                                className={cn(
                                  "h-1 w-1 rounded-full shrink-0",
                                  task.status === 'done' ? "bg-muted-foreground" :
                                    task.priority === 'high' ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]" :
                                      task.priority === 'medium' ? "bg-orange-400" : "bg-blue-400"
                                )}
                              />
                              <span className={cn(
                                "truncate font-medium",
                                task.status === 'done' && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </span>
                            </button>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-[8px] text-muted-foreground/60 font-medium px-1.5 pt-0.5">
                              + {dayTasks.length - 3} más
                            </div>
                          )}
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
