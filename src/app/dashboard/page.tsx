'use client'

import { Layout } from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, CheckSquare, FolderKanban, Plus, Calendar, Loader2, User } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { dashboardApi, type DashboardStatsResponse } from "@/lib/api"
import { useOrganization } from "@/context/organization-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/AuthGuard"

export default function Dashboard() {
  const { user } = useAuth()
  const { currentOrganization, isLoading: isLoadingOrg } = useOrganization()
  const [data, setData] = useState<DashboardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    if (!currentOrganization) return
    
    try {
      setLoading(true)
      const response = await dashboardApi.getStats()
      setData(response)
    } catch (error) {
      console.error("Error loading dashboard:", error)
      toast.error("Error al cargar datos del dashboard")
    } finally {
      setLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Mostrar loading mientras el contexto de organización está cargando
  if (isLoadingOrg) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>Cargando espacios de trabajo...</p>
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  // Solo mostrar el mensaje de seleccionar organización si no está cargando y no hay organización
  if (!currentOrganization) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>Selecciona una organización para ver el dashboard</p>
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  if (loading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Bienvenido de vuelta, <span className="font-semibold text-foreground">{user?.name?.split(' ')[0] || 'Usuario'}</span>. 
              Aquí está el resumen de <span className="font-medium text-foreground">{currentOrganization.name}</span>.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 animate-fade-in">
            <Card className="group relative overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Proyectos Activos</p>
                    <p className="text-3xl md:text-4xl font-bold">{data?.stats.activeProjects || 0}</p>
                  </div>
                  <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <FolderKanban className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tareas Pendientes</p>
                    <p className="text-3xl md:text-4xl font-bold">{data?.stats.pendingTasks || 0}</p>
                  </div>
                  <div className="h-14 w-14 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-300">
                    <CheckSquare className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notas Creadas</p>
                    <p className="text-3xl md:text-4xl font-bold">{data?.stats.createdNotes || 0}</p>
                  </div>
                  <div className="h-14 w-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            {/* Recent Projects */}
            <Card className="col-span-full lg:col-span-4 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">Proyectos Recientes</CardTitle>
                    <CardDescription className="mt-1.5">Tu actividad reciente en proyectos</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href="/projects">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data?.recentProjects && data.recentProjects.length > 0 ? (
                    data.recentProjects.map((project) => (
                      <div key={project._id} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <Link href={`/projects/${project._id}/tasks`} className="block">
                            <h4 className="font-medium group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-xs">
                              {project.name}
                            </h4>
                          </Link>
                          <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-full">
                            {project.tasksCompleted}/{project.tasksTotal} tareas
                          </span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                        <FolderKanban className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Sin proyectos activos</p>
                        <p className="text-sm text-muted-foreground">Crea tu primer proyecto para empezar</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/projects">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Proyecto
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="col-span-full lg:col-span-3 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">Próximas Tareas</CardTitle>
                    <CardDescription className="mt-1.5">Pendientes por prioridad</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                    <Link href="/tasks">Ver todas</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.upcomingTasks && data.upcomingTasks.length > 0 ? (
                    data.upcomingTasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                      >
                        <Avatar className="h-9 w-9 mt-0.5 border-2 border-background shadow-sm">
                          {task.assignedTo?.avatar ? (
                             <AvatarImage src={task.assignedTo.avatar} alt={task.assignedTo.name} />
                          ) : null}
                          <AvatarFallback className={cn(
                            "text-[10px] font-bold",
                            task.assignedTo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {task.assignedTo?.name 
                              ? task.assignedTo.name.slice(0, 2).toUpperCase() 
                              : <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>
                          {/* @ts-expect-error - projectId puede venir populado como objeto */}
                          <p className="text-xs text-muted-foreground truncate">{task.projectId?.name || 'Sin proyecto'}</p>
                          
                          {task.dueDate && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
                          className="text-[10px] uppercase shrink-0"
                        >
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                        <CheckSquare className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">¡Estás al día!</p>
                        <p className="text-sm text-muted-foreground">No hay tareas pendientes próximas</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/tasks">
                          <Plus className="mr-2 h-4 w-4" />
                          Nueva Tarea
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  )
}
