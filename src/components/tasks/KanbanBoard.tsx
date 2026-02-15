'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { TaskCard } from "./TaskCard"
import { KanbanColumn, type KanbanColumnData } from "./KanbanColumn"
import { AddColumnButton } from "./AddColumnButton"
import { type Task, projectsApi } from "@/lib/api"
import { nanoid } from "@/lib/utils"
import { toast } from "sonner"

interface KanbanBoardProps {
  tasks: Task[]
  loading: boolean
  onTaskMove: (taskId: string, newStatus: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onNewTask: (status: string) => void
  onStatusToggle?: (task: Task) => void
  onQuickAssign?: (taskId: string, userId: string | null) => void
  availableMembers?: Array<{ userId: { _id: string; name: string; email: string; avatar?: string } | string; role: string }>
  owner?: { _id: string; name: string; email: string; avatar?: string } | null
  currentUserId?: string
  projectId?: string // Opcional: si no se proporciona, usa columnas basadas en status
}

// Secciones por defecto para inicializar proyectos nuevos
const DEFAULT_SECTIONS = [
  { title: 'Por hacer', color: '#6b7280' },
  { title: 'En progreso', color: '#3b82f6' },
  { title: 'Completado', color: '#22c55e' }
]

// Columnas basadas en status para vista "All Projects"
const STATUS_COLUMNS: KanbanColumnData[] = [
  { id: 'todo', title: 'Por hacer', color: '#6b7280', order: 0 },
  { id: 'in_progress', title: 'En progreso', color: '#3b82f6', order: 1 },
  { id: 'done', title: 'Completado', color: '#22c55e', order: 2 }
]

export function KanbanBoard({
  tasks,
  loading,
  onTaskMove,
  onEditTask,
  onDeleteTask,
  onNewTask,
  onStatusToggle,
  onQuickAssign,
  availableMembers,
  owner,
  currentUserId,
  projectId
}: KanbanBoardProps) {
  // Estado de columnas
  const [columns, setColumns] = useState<KanbanColumnData[]>([])
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Cargar columnas (secciones de proyecto o status-based)
  useEffect(() => {
    async function loadColumns() {
      // Si no hay projectId, usar columnas basadas en status
      if (!projectId) {
        setColumns(STATUS_COLUMNS)
        return
      }

      try {
        const response = await projectsApi.getById(projectId)

        // Si el proyecto no tiene secciones, las creamos por defecto
        if (!response.project.sections || response.project.sections.length === 0) {
          console.log("Inicializando secciones por defecto para el proyecto...")
          const createdSections: KanbanColumnData[] = []

          for (const defSection of DEFAULT_SECTIONS) {
            try {
              const res = await projectsApi.addSection(projectId, {
                name: defSection.title,
                color: defSection.color
              })
              if (res.project.sections) {
                const s = res.project.sections[res.project.sections.length - 1]
                createdSections.push({
                  id: s._id,
                  title: s.name,
                  color: defSection.color,
                  order: s.order
                })
              }
            } catch (err) {
              console.error("Error creating default section:", err)
            }
          }
          setColumns(createdSections.sort((a, b) => (a.order || 0) - (b.order || 0)))
        } else {
          setColumns(response.project.sections.map(s => ({
            id: s._id,
            title: s.name,
            color: '#3b82f6', // Color por defecto si no viene del backend
            order: s.order,
            wipLimit: s.limit
          })).sort((a, b) => (a.order || 0) - (b.order || 0)))
        }
      } catch (error) {
        console.error("Error loading project sections:", error)
        toast.error("Error al cargar las columnas del tablero")
      }
    }
    loadColumns()
  }, [projectId])

  // Agrupar tareas por columna (estado derivado)
  const tasksByColumn = useMemo(() => {
    const newTasksByColumn: { [key: string]: Task[] } = {}

    columns.forEach(col => {
      newTasksByColumn[col.id] = []
    })

    tasks.forEach(task => {
      let columnId: string

      if (!projectId) {
        columnId = task.status
      } else {
        columnId = task.sectionId || ''
        if (!columnId && columns.length > 0) {
          columnId = columns[0].id
        }
      }

      if (newTasksByColumn[columnId]) {
        newTasksByColumn[columnId].push(task)
      } else {
        console.warn(`Task ${task._id} has invalid columnId: ${columnId}`)
      }
    })

    Object.keys(newTasksByColumn).forEach(key => {
      newTasksByColumn[key].sort((a, b) => a.position - b.position)
    })

    return newTasksByColumn
  }, [tasks, columns, projectId])

  // Handlers para columnas
  const handleAddColumn = useCallback(async (newColumn: Omit<KanbanColumnData, 'id'>) => {
    if (projectId) {
      try {
        const response = await projectsApi.addSection(projectId, {
          name: newColumn.title,
          limit: newColumn.wipLimit
        })
        if (response.project.sections) {
          const s = response.project.sections[response.project.sections.length - 1]
          setColumns(prev => [...prev, {
            id: s._id,
            title: s.name,
            color: newColumn.color || '#3b82f6',
            order: s.order,
            wipLimit: s.limit
          }])
        }
      } catch {
        toast.error("Error al crear la sección")
      }
    } else {
      const column: KanbanColumnData = {
        ...newColumn,
        id: nanoid(8)
      }
      setColumns(prev => [...prev, column])
    }
  }, [projectId])

  const handleUpdateColumn = useCallback(async (id: string, updates: Partial<KanbanColumnData>) => {
    // No permitir edición de columnas en modo global
    if (!projectId) {
      toast.error("No se pueden editar columnas en vista global")
      return
    }

    // Backend update
    try {
      await projectsApi.updateSection(projectId, id, {
        name: updates.title,
        limit: updates.wipLimit
      })
      setColumns(prev => prev.map(col =>
        col.id === id ? { ...col, ...updates } : col
      ))
    } catch {
      toast.error("Error al actualizar sección")
    }
  }, [projectId])

  const handleDeleteColumn = useCallback(async (id: string) => {
    // No permitir eliminación de columnas en modo global
    if (!projectId) {
      toast.error("No se pueden eliminar columnas en vista global")
      return
    }

    if (columns.length <= 1) return

    if (projectId) {
      if (!confirm("¿Eliminar sección y sus tareas?")) return
      try {
        await projectsApi.deleteSection(projectId, id)
        setColumns(prev => prev.filter(col => col.id !== id))
      } catch {
        toast.error("Error al eliminar sección")
      }
    } else {
      // Mover tareas de la columna eliminada a la primera columna
      const tasksInColumn = tasksByColumn[id] || []
      const targetColumn = columns.find(c => c.id !== id)?.id || 'todo'

      tasksInColumn.forEach(task => {
        onTaskMove(task._id, targetColumn)
      })

      setColumns(prev => prev.filter(col => col.id !== id))
    }
  }, [columns, tasksByColumn, onTaskMove, projectId])

  // Handlers para drag & drop de tareas y columnas
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task._id)
    e.dataTransfer.setData('sourceColumn', projectId ? (task.sectionId || 'todo') : (task.status || 'todo'))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
    console.log('Dragging column:', columnId);
    e.dataTransfer.setData('columnId', columnId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    console.log('Drop on column:', targetColumnId);
    const taskId = e.dataTransfer.getData('taskId')

    // Si es una tarea
    if (taskId) {
      // ... task logic
      console.log('Task Drop');
      const sourceColumn = e.dataTransfer.getData('sourceColumn')
      if (sourceColumn !== targetColumnId) {
        onTaskMove(taskId, targetColumnId)
      }
    } else {
      const sourceColumnId = e.dataTransfer.getData('columnId')
      console.log('Column Drop:', sourceColumnId, '->', targetColumnId);
      // ... column logic
      if (sourceColumnId && sourceColumnId !== targetColumnId) {
        const sourceIndex = columns.findIndex(c => c.id === sourceColumnId)
        const targetIndex = columns.findIndex(c => c.id === targetColumnId)

        if (sourceIndex !== -1 && targetIndex !== -1) {
          const newColumns = [...columns]
          const [movedColumn] = newColumns.splice(sourceIndex, 1)
          newColumns.splice(targetIndex, 0, movedColumn)

          // Actualizar orden
          const updatedColumns = newColumns.map((col, index) => ({
            ...col,
            order: index
          }))
          setColumns(updatedColumns)

          if (projectId) {
            try {
              const sectionsForBackend = updatedColumns.map(c => ({
                _id: c.id,
                name: c.title,
                order: c.order,
                limit: c.wipLimit
              }))
              await projectsApi.reorderSections(projectId, sectionsForBackend)
            } catch {
              toast.error("Error al reordenar columnas")
            }
          }
        }
      }
    }

    setDragOverColumn(null)
  }

  const handleDragEnter = (columnId: string) => {
    setDragOverColumn(columnId)
  }


  // Loading state
  if (loading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[300px] bg-muted/30 rounded-xl p-4 animate-pulse"
          >
            <div className="h-6 bg-muted rounded w-1/2 mb-4" />
            <div className="space-y-3">
              <div className="h-24 bg-muted rounded-lg skeleton-shimmer" />
              <div className="h-24 bg-muted rounded-lg skeleton-shimmer" />
              <div className="h-16 bg-muted rounded-lg skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory scroll-smooth -mx-2 px-2 md:mx-0 md:px-0 items-start">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          taskCount={tasksByColumn[column.id]?.length || 0}
          isOver={dragOverColumn === column.id}
          onUpdate={handleUpdateColumn}
          onDelete={handleDeleteColumn}
          onAddTask={onNewTask}
          onDragOver={(e) => {
            handleDragOver(e)
            handleDragEnter(column.id)
          }}
          onDragStart={handleColumnDragStart}
          onDrop={handleDrop}
          className="snap-start"
        >
          {tasksByColumn[column.id]?.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onDragStart={handleDragStart}
              onStatusToggle={onStatusToggle}
              onQuickAssign={onQuickAssign}
              availableMembers={availableMembers}
              owner={owner}
              currentUserId={currentUserId}
            />
          ))}
        </KanbanColumn>
      ))}

      {/* Botón para agregar nueva columna (solo en modo proyecto) */}
      {projectId && <AddColumnButton onAdd={handleAddColumn} />}
    </div>
  )
}
