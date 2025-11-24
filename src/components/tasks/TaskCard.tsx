'use client'

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreVertical, Clock, Calendar, User as UserIcon, Trash2, Edit, FolderKanban } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Task } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete, onDragStart }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 hover:bg-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 hover:bg-green-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Card 
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className="shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing bg-card group mb-3"
    >
      <CardHeader className="p-3 pb-0 flex flex-row justify-between items-start space-y-0">
        <Badge variant="secondary" className={cn("capitalize text-xs px-1.5 py-0 h-5", getPriorityColor(task.priority))}>
          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="mr-2 h-3 w-3" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task)}>
              <Trash2 className="mr-2 h-3 w-3" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <h4 className="text-sm font-medium leading-snug mb-1">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {task.dueDate && (
                <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>
            {task.projectId && typeof task.projectId !== 'string' && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <FolderKanban className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{task.projectId.name}</span>
              </div>
            )}
          </div>
          
          {task.assignedTo ? (
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarImage src={task.assignedTo.avatar} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {task.assignedTo.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border-2 border-background border-dashed">
              <UserIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

