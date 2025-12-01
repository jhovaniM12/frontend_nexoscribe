'use client'

import { useState, useEffect } from "react"
import { TaskCard } from "./TaskCard"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

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
}

const COLUMNS = [
  { id: 'todo', title: 'Por hacer', color: 'bg-gray-500/10 text-gray-600' },
  { id: 'in_progress', title: 'En progreso', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'done', title: 'Completado', color: 'bg-green-500/10 text-green-600' }
]

export function KanbanBoard({ tasks, loading, onTaskMove, onEditTask, onDeleteTask, onNewTask, onStatusToggle, onQuickAssign, availableMembers, owner, currentUserId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<{ [key: string]: Task[] }>({
    todo: [],
    in_progress: [],
    done: []
  })

  // Agrupar tareas por columna
  useEffect(() => {
    const newColumns: { [key: string]: Task[] } = {
      todo: [],
      in_progress: [],
      done: []
    }
    
    tasks.forEach(task => {
      if (newColumns[task.status]) {
        newColumns[task.status].push(task)
      } else {
        // Fallback para estados desconocidos
        newColumns.todo.push(task)
      }
    })

    // Ordenar por posición
    Object.keys(newColumns).forEach(key => {
      newColumns[key].sort((a, b) => a.position - b.position)
    })

    // Actualizar columnas cuando cambian las tareas
    // Este setState es necesario para sincronizar el estado con las tareas
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColumns(newColumns)
  }, [tasks])

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task._id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      // Optimistic update local
      const task = tasks.find(t => t._id === taskId)
      if (task && task.status !== status) {
        onTaskMove(taskId, status)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-2 sm:mx-0 px-2 sm:px-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[280px] sm:w-80 bg-muted/30 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="h-5 sm:h-6 bg-muted rounded w-1/2 mb-4" />
            <div className="space-y-2 sm:space-y-3">
              <div className="h-20 sm:h-24 bg-muted rounded" />
              <div className="h-20 sm:h-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-1 gap-3 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto pb-4 sm:pb-6 snap-x snap-mandatory h-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent -mx-2 sm:mx-0 px-2 sm:px-0">
      {COLUMNS.map((col) => (
        <div 
          key={col.id}
          className="flex-shrink-0 w-[280px] sm:w-80 md:w-[320px] flex flex-col bg-card rounded-lg sm:rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 snap-center h-full"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          {/* Column Header */}
          <div className="p-3 sm:p-4 flex items-center justify-between border-b border-border/50 bg-muted/30 rounded-t-lg sm:rounded-t-xl sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0", col.id === 'todo' ? 'bg-gray-400' : col.id === 'in_progress' ? 'bg-blue-500' : 'bg-green-500')} />
              <h3 className="font-semibold text-xs sm:text-sm truncate">{col.title}</h3>
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground bg-background/80 px-1.5 sm:px-2 py-0.5 rounded-full border flex-shrink-0">
                {columns[col.id]?.length || 0}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-accent flex-shrink-0" onClick={() => onNewTask(col.id)}>
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Tasks List */}
          <div className="p-2 sm:p-3 md:p-4 flex-1 overflow-y-auto min-h-[120px] sm:min-h-[150px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="space-y-2 sm:space-y-3">
              {columns[col.id]?.map((task) => (
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
              {columns[col.id]?.length === 0 && (
                <div className="h-24 sm:h-32 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-[10px] sm:text-xs bg-muted/20 px-2 text-center">
                  <span className="hidden sm:inline">Arrastra tareas aquí</span>
                  <span className="sm:hidden">Arrastra aquí</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-2 sm:p-3 border-t border-border/50 bg-muted/20 rounded-b-lg sm:rounded-b-xl">
             <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground text-[10px] sm:text-xs h-7 sm:h-8 hover:text-primary hover:bg-accent/50 transition-colors"
              onClick={() => onNewTask(col.id)}
            >
              <Plus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" /> 
              <span className="hidden sm:inline">Nueva tarea</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

