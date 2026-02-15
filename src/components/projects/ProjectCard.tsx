'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, FolderKanban } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Project } from "@/lib/api"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter()

  const totalTasks = project.taskCount || 0
  const completedTasks = project.completedTaskCount || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'archived': return 'bg-muted text-muted-foreground border-transparent'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'completed': return 'Finalizado'
      case 'archived': return 'Archivado'
      default: return status
    }
  }

  return (
    <Card
      className="group relative flex flex-col h-full bg-background border border-border/40 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => router.push(`/tasks?project=${project._id}`)}
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-[8px] font-bold uppercase tracking-wider px-1.5 h-4 border-none", getStatusColor(project.status))}>
                {getStatusLabel(project.status)}
              </Badge>
              <div className="h-1 w-1 rounded-full bg-border/60" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {format(new Date(project.createdAt), "d MMM", { locale: es })}
              </span>
            </div>
            <CardTitle className="text-base font-bold tracking-tight group-hover:text-primary transition-colors truncate">
              {project.name}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted transition-all">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                <Edit className="mr-2 h-3.5 w-3.5" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(project); }}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground/80 line-clamp-2 min-h-[2rem] mb-6 leading-relaxed">
          {project.description || "Sin descripción proporcionada."}
        </p>

        <div className="mt-auto space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-tight">
              <span className="text-muted-foreground">Progreso</span>
              <span className="text-foreground">{progress}%</span>
            </div>
            <div className="relative h-1 w-full bg-muted/40 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">Total</span>
              <span className="text-xs font-semibold">{totalTasks}</span>
            </div>
            <div className="flex flex-col gap-0.5 border-l border-border/50 pl-6">
              <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">Hechas</span>
              <span className="text-xs font-semibold text-primary">{completedTasks}</span>
            </div>

            <div className="ml-auto">
              <div className="h-7 w-7 rounded-sm bg-muted/20 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

