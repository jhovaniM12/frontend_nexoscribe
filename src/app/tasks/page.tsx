'use client'

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { tasksApi, projectsApi, type Task, type Project } from "@/lib/api"
import { useOrganization } from "@/context/organization-context"
import { KanbanBoard } from "@/components/tasks/KanbanBoard"
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet"
import { useSearchParams, useRouter } from "next/navigation"

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
  
  // Form State
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [taskProject, setTaskProject] = useState<string>("none")
  const [dueDate, setDueDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
  const handleNewTask = (initialStatus = 'todo') => {
    setDialogMode('create')
    setSelectedTask(null)
    setTitle("")
    setDesc("")
    setStatus(initialStatus)
    setPriority("medium")
    setTaskProject(filterProject !== 'all' ? filterProject : "none")
    setDueDate("")
    setDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setDialogMode('edit')
    setSelectedTask(task)
    setTitle(task.title)
    setDesc(task.description || "")
    setStatus(task.status)
    setPriority(task.priority)
    
    // Manejar projectId si es objeto o string
    let projectIdValue = "none"
    if (task.projectId) {
      projectIdValue = typeof task.projectId === 'object' ? task.projectId._id : task.projectId
    }
    setTaskProject(projectIdValue)
    
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "")
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
      if (dialogMode === 'create') {
        const res = await tasksApi.create(data as any)
        setTasks([...tasks, res.task])
        toast.success("Tarea creada")
      } else {
        if (!selectedTask) return
        const res = await tasksApi.update(selectedTask._id, data)
        setTasks(tasks.map(t => t._id === selectedTask._id ? res.task : t))
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

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <LayoutGrid className="h-8 w-8 text-primary" />
              Tablero
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus tareas por estado
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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

        {/* Board Area */}
        <div className="flex-1 overflow-x-auto min-h-0">
          <KanbanBoard
            tasks={tasks}
            loading={loading}
            onTaskMove={handleTaskMove}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onNewTask={handleNewTask}
            onStatusToggle={handleStatusToggle}
          />
        </div>

        {/* New Task Detail Sheet */}
        <TaskDetailSheet
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={selectedTask}
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
