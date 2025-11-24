'use client'

import { useState, useEffect, useCallback } from "react"
import { TaskCard } from "./TaskCard"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KanbanBoardProps {
  tasks: Task[]
  loading: boolean
  onTaskMove: (taskId: string, newStatus: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onNewTask: (status: string) => void
}

const COLUMNS = [
  { id: 'todo', title: 'Por hacer', color: 'bg-gray-500/10 text-gray-600' },
  { id: 'in_progress', title: 'En progreso', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'done', title: 'Completado', color: 'bg-green-500/10 text-green-600' }
]

export function KanbanBoard({ tasks, loading, onTaskMove, onEditTask, onDeleteTask, onNewTask }: KanbanBoardProps) {
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
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/2 mb-4" />
            <div className="space-y-3">
              <div className="h-24 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4 snap-x">
      {COLUMNS.map((col) => (
        <div 
          key={col.id}
          className="flex-shrink-0 w-80 flex flex-col bg-muted/30 rounded-lg border border-border/50 snap-center h-fit max-h-full"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          {/* Column Header */}
          <div className="p-3 flex items-center justify-between border-b border-border/50 bg-muted/50 rounded-t-lg sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", col.id === 'todo' ? 'bg-gray-400' : col.id === 'in_progress' ? 'bg-blue-500' : 'bg-green-500')} />
              <h3 className="font-semibold text-sm">{col.title}</h3>
              <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                {columns[col.id]?.length || 0}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onNewTask(col.id)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Tasks List */}
          <div className="p-2 flex-1 overflow-y-auto min-h-[150px]">
            <div className="space-y-2">
              {columns[col.id]?.map((task) => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  onEdit={onEditTask} 
                  onDelete={onDeleteTask}
                  onDragStart={handleDragStart}
                />
              ))}
              {columns[col.id]?.length === 0 && (
                <div className="h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                  Arrastra tareas aquí
                </div>
              )}
            </div>
          </div>
          
          <div className="p-2 border-t border-border/50">
             <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground text-xs h-8 hover:text-primary"
              onClick={() => onNewTask(col.id)}
            >
              <Plus className="mr-2 h-3 w-3" /> Nueva tarea
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

