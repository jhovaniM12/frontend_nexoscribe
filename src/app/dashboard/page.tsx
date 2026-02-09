'use client'

import { Layout } from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  CheckSquare,
  FolderKanban,
  Plus,
  Calendar,
  Loader2,
  User,
  TrendingUp,
  Clock,
  ChevronRight,
  ArrowUpRight
} from "lucide-react"
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

  if (isLoadingOrg || (loading && currentOrganization)) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary/40" />
              </div>
            </div>
            <p className="mt-4 text-muted-foreground font-medium animate-pulse">Preparando tu dashboard...</p>
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  if (!currentOrganization) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center px-4">
            <div className="h-20 w-20 bg-muted rounded-2xl flex items-center justify-center mb-6">
              <FolderKanban className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Bienvenido a NexoScribe</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Para comenzar a gestionar tus proyectos, selecciona o crea una organización desde la barra lateral.
            </p>
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* Hero Welcome Section */}
          <div className="relative overflow-hidden rounded-3xl bg-neutral-900 px-8 py-10 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <Badge className="mb-4 bg-primary/20 text-primary-foreground border-0 hover:bg-primary/30">
                Resumen de hoy
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                ¡Hola de nuevo, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-neutral-400 text-lg md:text-xl leading-relaxed">
                Hoy es un gran día para avanzar en <span className="text-white font-semibold">{currentOrganization.name}</span>.
                Tienes {data?.stats.pendingTasks || 0} tareas esperando tu atención.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 group" asChild>
                  <Link href="/tasks">
                    Empezar a trabajar
                    <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-white" asChild>
                  <Link href="/notes">
                    Tomar una nota
                  </Link>
                </Button>
              </div>
            </div>
            {/* Abstract Background Element */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
            <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 h-60 w-60 rounded-full bg-blue-500/10 blur-[80px]" />
          </div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Proyectos"
              value={data?.stats.activeProjects || 0}
              icon={FolderKanban}
              color="text-primary"
              bg="bg-primary/5"
              description="Proyectos en curso"
              href="/projects"
            />
            <StatCard
              title="Tareas"
              value={data?.stats.pendingTasks || 0}
              icon={CheckSquare}
              color="text-orange-500"
              bg="bg-orange-500/5"
              description="Pendientes por hacer"
              href="/tasks"
            />
            <StatCard
              title="Notas"
              value={data?.stats.createdNotes || 0}
              icon={FileText}
              color="text-blue-500"
              bg="bg-blue-500/5"
              description="Ideas documentadas"
              href="/notes"
            />
            <StatCard
              title="Miembros"
              value={currentOrganization.members?.length || 1}
              icon={User}
              color="text-emerald-500"
              bg="bg-emerald-500/5"
              description="Colaboradores activos"
              href="/settings"
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-12">

            {/* Recent Work / Projects */}
            <Card className="lg:col-span-12 xl:col-span-8 border-none shadow-subtle bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Proyectos Recientes
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                  <Link href="/projects" className="flex items-center gap-1 group">
                    Ver todos
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data?.recentProjects && data.recentProjects.length > 0 ? (
                    data.recentProjects.map((project) => (
                      <Link
                        key={project._id}
                        href={`/projects/${project._id}/tasks`}
                        className="group relative flex flex-col p-5 rounded-2xl border border-border/50 bg-background/50 hover:bg-accent/50 hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {project.name.charAt(0)}
                          </div>
                          <Badge variant="secondary" className="bg-background/80 text-[10px] font-bold">
                            {project.tasksCompleted}/{project.tasksTotal} TASKS
                          </Badge>
                        </div>
                        <h4 className="font-bold text-lg mb-4 group-hover:text-primary transition-colors flex items-center justify-between">
                          {project.name}
                          <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <div className="mt-auto space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>Progreso</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <EmptyState
                      icon={FolderKanban}
                      title="Sin proyectos activos"
                      description="Crea tu primer proyecto para empezar"
                      link="/projects"
                      buttonText="Crear Proyecto"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming / Tasks Feed */}
            <Card className="lg:col-span-12 xl:col-span-4 border-none shadow-subtle bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Próximas Tareas
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                  <Link href="/tasks">Ver todas</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.upcomingTasks && data.upcomingTasks.length > 0 ? (
                    data.upcomingTasks.map((task) => (
                      <div
                        key={task._id}
                        className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent bg-background/40 hover:bg-background hover:shadow-sm hover:border-border/50 transition-all duration-300 cursor-pointer"
                      >
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          task.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                            task.priority === 'medium' ? "bg-orange-500" : "bg-blue-500"
                        )} />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                              {typeof task.projectId === 'object' && task.projectId ? task.projectId.name : 'NexoScribe'}
                            </span>
                          </div>
                        </div>

                        {task.dueDate && (
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                        <CheckSquare className="h-8 w-8" />
                      </div>
                      <p className="font-bold">¡Todo listo!</p>
                      <p className="text-sm text-muted-foreground">No tienes tareas para los próximos días.</p>
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

function StatCard({ title, value, icon: Icon, color, bg, description, href }: any) {
  return (
    <Link href={href}>
      <Card className="group border-none shadow-subtle hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", bg, color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState({ icon: Icon, title, description, link, buttonText }: any) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-border/60 text-center">
      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{description}</p>
      <Button variant="outline" size="sm" asChild className="rounded-xl">
        <Link href={link}>
          <Plus className="mr-2 h-4 w-4" />
          {buttonText}
        </Link>
      </Button>
    </div>
  )
}
