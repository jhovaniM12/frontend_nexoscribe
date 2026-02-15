'use client'

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  CheckSquare,
  FolderKanban,
  Plus,
  PenTool,
  Users,
  User,
  Sun,
  Sunset,
  Moon,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { dashboardApi, type DashboardStatsResponse, type DashboardRecentProject, type DashboardTaskItem } from "@/lib/api"
import { useOrganization } from "@/context/organization-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/AuthGuard"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { notesApi } from "@/lib/api"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { ChartContainer } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"

const DAY_LABELS: Record<number, string> = { 1: "L", 2: "M", 3: "X", 4: "J", 5: "V", 6: "S", 7: "D" }

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "ahora"
  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays === 1) return "ayer"
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

function getGreeting(): { text: string; icon: React.ElementType } {
  const h = new Date().getHours()
  if (h < 12) return { text: "Buenos días", icon: Sun }
  if (h < 19) return { text: "Buenas tardes", icon: Sunset }
  return { text: "Buenas noches", icon: Moon }
}

function getSubtitle(
  tasksTodayCount: number,
  activeProjectsCount: number,
  pendingTasksCount: number
): string {
  if (tasksTodayCount > 0) return `Tienes ${tasksTodayCount} tarea${tasksTodayCount === 1 ? "" : "s"} para hoy`
  if (pendingTasksCount === 0) return "Todo al día"
  if (activeProjectsCount > 0) return `${activeProjectsCount} proyecto${activeProjectsCount === 1 ? "" : "s"} activo${activeProjectsCount === 1 ? "" : "s"}`
  return "Resumen de tu espacio de trabajo"
}

function hashToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 65%, 45%)`
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "En Curso",
  archived: "Archivado",
  completed: "Completado",
}

const PROJECT_STATUS_STYLES: Record<string, string> = {
  active: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  archived: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
}

interface StatCardProps {
  title: string
  value: number
  subtext?: string
  icon: React.ElementType
  href: string
  alert?: boolean
  completed?: number
  total?: number
}

function StatCard({ title, value, subtext, icon: Icon, href, alert, completed = 0, total = 0 }: StatCardProps) {
  const showProgress = total > 0 && (title.includes("Proyecto") || title.includes("Tarea"))
  const progressPct = showProgress ? Math.round((completed / total) * 100) : 0

  return (
    <Link href={href} className="block group">
      <div className={cn(
        "relative p-5 rounded-xl border border-border/40 bg-background transition-all duration-300",
        "hover:bg-muted/10 hover:border-primary/30 hover:shadow-elevated hover:scale-[1.01]",
        alert && "border-orange-500/20 bg-orange-500/[0.02] hover:bg-orange-500/[0.05]"
      )}>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{title}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
            {alert && <span className="text-[10px] font-bold text-orange-500 px-1.5 py-0.5 bg-orange-500/10 rounded-full">+10</span>}
          </div>
          {subtext && <span className="text-xs text-muted-foreground mt-0.5">{subtext}</span>}
          {showProgress && (
            <div className="mt-2 w-full">
              <Progress value={progressPct} className="h-1.5" />
            </div>
          )}
        </div>
        <div className="absolute right-5 top-5 h-8 w-8 rounded-lg bg-muted/10 border border-border/20 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300">
          <Icon className="h-4 w-4" />
        </div>
        <div className="absolute bottom-4 right-4 text-primary opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <ArrowUpRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  )
}

interface QuickNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function QuickNoteDialog({ open, onOpenChange, onSuccess }: QuickNoteDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) return
    try {
      setIsSubmitting(true)
      await notesApi.create({ title: title.trim() || "Sin título", content })
      toast.success("Nota creada")
      setTitle("")
      setContent("")
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error("Error al crear la nota")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nota Rápida</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/30"
            />
          </div>
          <div>
            <Textarea
              placeholder="Escribe tu nota..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none bg-muted/30"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!title.trim() && !content.trim())}
            className="w-full"
          >
            {isSubmitting ? "Guardando..." : "Crear Nota"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { currentOrganization, isLoading: isLoadingOrg } = useOrganization()
  const [data, setData] = useState<DashboardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)

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

  const tasksForTomorrow = data?.stats.tasksForTomorrow ?? 0
  const memberCount = currentOrganization?.members?.length ?? 1

  if (isLoadingOrg || (loading && currentOrganization)) {
    return (
      <AuthGuard>
        <Layout>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <Skeleton className="lg:col-span-8 h-96 rounded-xl" />
            <Skeleton className="lg:col-span-4 h-96 rounded-xl" />
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
            <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
              <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Bienvenido a NexoScribe</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Selecciona un espacio de trabajo para comenzar.
            </p>
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-border/10">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                {(() => {
                  const { icon: DayIcon } = getGreeting()
                  const h = new Date().getHours()
                  const isMorning = h < 12
                  const isAfternoon = h >= 12 && h < 19
                  return (
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors",
                        "animate-day-icon-glow",
                        isMorning && "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
                        isAfternoon && "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
                        !isMorning && !isAfternoon && "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                      )}
                      aria-hidden
                    >
                      <DayIcon className="h-7 w-7" />
                    </div>
                  )
                })()}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {getGreeting().text},{" "}
                    <span className="text-primary">{user?.name?.split(" ")[0] ?? "Usuario"}</span>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {currentOrganization.name}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {getSubtitle(
                  data?.tasksForToday?.length ?? 0,
                  data?.stats?.activeProjects ?? 0,
                  data?.stats?.pendingTasks ?? 0
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
              <Button variant="outline" size="sm" asChild className="h-9 px-4 text-xs font-semibold bg-background border-border/60 hover:bg-muted/50 shadow-none">
                <Link href="/tasks">
                  <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  Ver Tareas
                </Link>
              </Button>
              <Button size="sm" asChild className="h-9 px-4 text-xs font-semibold shadow-sm active:scale-95 transition-all">
                <Link href="/projects">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Proyecto
                </Link>
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Proyectos Activos"
              value={data?.stats.activeProjects ?? 0}
              subtext={tasksForTomorrow > 0 ? `${tasksForTomorrow} tareas para mañana` : undefined}
              icon={FolderKanban}
              href="/projects"
              completed={(data?.stats as { completedProjects?: number })?.completedProjects ?? 0}
              total={((data?.stats as { totalProjects?: number })?.totalProjects ?? 0) || 1}
            />
            <StatCard
              title="Tareas Pendientes"
              value={data?.stats.pendingTasks ?? 0}
              subtext={tasksForTomorrow > 0 ? `${tasksForTomorrow} tareas para mañana` : undefined}
              icon={CheckSquare}
              href="/tasks"
              alert={(data?.stats.pendingTasks ?? 0) > 10}
              completed={(data?.stats as { completedTasks?: number })?.completedTasks ?? 0}
              total={((data?.stats as { totalTasks?: number })?.totalTasks ?? 0) || 1}
            />
            <StatCard
              title="Notas Creadas"
              value={data?.stats.createdNotes ?? 0}
              icon={FileText}
              href="/notes"
            />
            <StatCard
              title="Equipo"
              value={memberCount}
              icon={User}
              href="/settings"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button size="sm" asChild className="h-9 px-4 font-medium">
              <Link href="/projects">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 font-medium" onClick={() => setQuickNoteOpen(true)}>
              <PenTool className="mr-2 h-4 w-4" />
              Crear Nota Rápida
            </Button>
            <Button variant="outline" size="sm" asChild className="h-9 px-4 font-medium">
              <Link href="/settings">
                <Users className="mr-2 h-4 w-4" />
                Invitar Equipo
              </Link>
            </Button>
          </div>

          {/* Productividad Semanal + Notas Recientes */}
          <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
            {/* Productividad Semanal (Tareas Completadas) */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                Productividad Semanal (Tareas Completadas)
              </h3>
              <div className="rounded-xl border border-border/30 bg-background p-4 flex flex-col sm:flex-row gap-6">
                <div className="flex-1 min-h-[200px] min-w-0">
                  <ChartContainer
                    config={{
                      count: { label: "Tareas", color: "hsl(var(--primary))" },
                      muted: { label: "Tareas", color: "hsl(var(--muted-foreground) / 0.3)" },
                    }}
                    className="h-[200px] w-full"
                  >
                    <BarChart
                      data={[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const raw = (data?.weeklyCompletedTasks ?? []).find((d) => d.day === day);
                        const count = raw?.count ?? 0;
                        const todayIso = new Date().getDay() === 0 ? 7 : new Date().getDay();
                        return {
                          day: DAY_LABELS[day] ?? "?",
                          dayNum: day,
                          count,
                          isToday: day === todayIso,
                        };
                      })}
                      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {[1, 2, 3, 4, 5, 6, 7].map((day, i) => {
                          const todayIso = new Date().getDay() === 0 ? 7 : new Date().getDay();
                          return (
                            <Cell
                              key={i}
                              fill={day === todayIso ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
                <div className="flex flex-col items-center justify-center shrink-0 sm:w-32">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {(data?.weeklyCompletedTasks ?? []).reduce((s, d) => s + d.count, 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center mt-1">
                    Tareas completadas esta semana
                  </span>
                </div>
              </div>
            </div>

            {/* Notas Recientes */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  Notas Recientes
                </h3>
                <Link href="/notes" className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors">
                  Ver todas
                </Link>
              </div>
              <div className="rounded-xl border border-border/30 bg-background overflow-hidden">
                {(data?.recentNotes?.length ?? 0) > 0 ? (
                  <div className="divide-y divide-border/10">
                    {data?.recentNotes?.map((note: { id: string; title: string; updatedAt: string }) => (
                      <Link
                        key={note.id}
                        href={`/notes/${note.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {note.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatRelativeTime(note.updatedAt)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/25 mb-3" />
                    <p className="text-sm text-muted-foreground">No hay notas recientes</p>
                    <Button variant="outline" size="sm" asChild className="mt-3 text-xs font-medium">
                      <Link href="/notes">Ir a Notas</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">

            {/* Proyectos Activos - Tabla */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Proyectos Activos</h3>
                <Link href="/projects" className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors">
                  Ver todos
                </Link>
              </div>

              {data?.recentProjects && data.recentProjects.length > 0 ? (
                <div className="rounded-xl border border-border/30 bg-background overflow-x-auto overflow-y-hidden">
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow className="border-border/20 hover:bg-transparent">
                        <TableHead className="font-semibold">Nombre</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Progreso</TableHead>
                        <TableHead className="font-semibold">Lead</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentProjects.map((project: DashboardRecentProject) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/projects?id=${project.id}`)}
                        >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                                  style={{ backgroundColor: hashToColor(project.name) }}
                                >
                                  {project.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{project.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("rounded-full text-xs", PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.active)}
                              >
                                {PROJECT_STATUS_LABELS[project.status] ?? "En Curso"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-[140px]">
                                <Progress value={project.progress} className="h-2 flex-1" />
                                <span className="text-xs font-medium text-muted-foreground shrink-0">{project.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {project.lead ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    {project.lead.avatarUrl && <AvatarImage src={project.lead.avatarUrl} alt={project.lead.name} />}
                                    <AvatarFallback className="text-[10px]">{project.lead.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm truncate max-w-[80px]">{project.lead.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 rounded-xl border border-dashed border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center">
                  <FolderKanban className="h-10 w-10 text-muted-foreground/25 mb-4" />
                  <p className="text-sm font-semibold text-foreground">Crea tu primer proyecto en 30 segundos</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">Organiza tareas y colabora con tu equipo desde el día uno.</p>
                  <Button asChild size="sm" className="mt-4 font-semibold">
                    <Link href="/projects">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Proyecto
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Panel derecho: Mi Agenda + Actividad Reciente */}
            <div className="lg:col-span-4 space-y-6">
              {/* Mi Agenda (Para Hoy) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Mi Agenda (Para Hoy)</h3>
                  <Link href="/tasks" className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors">
                    Ver todos
                  </Link>
                </div>
                <div className="rounded-xl border border-border/30 bg-background overflow-hidden">
                  {(data?.tasksForToday?.length ?? 0) > 0 ? (
                    <div className="divide-y divide-border/10">
                      {[...(data?.tasksForToday ?? [])]
                        .sort((a, b) => {
                          if (!a.dueDate) return 1
                          if (!b.dueDate) return -1
                          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                        })
                        .map((task: DashboardTaskItem) => (
                          <Link
                            key={task.id}
                            href="/tasks"
                            className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-colors group"
                          >
                            <Checkbox checked={false} className="pointer-events-none shrink-0" aria-label={`Marcar ${task.title} como completada`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground group-hover:text-primary truncate">{task.title}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                {task.dueDate && (
                                  <span className="font-semibold text-foreground/80">
                                    {new Date(task.dueDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                                <span>{task.projectName ?? "General"}</span>
                              </p>
                            </div>
                          </Link>
                        ))}
                    </div>
                  ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                        <CheckSquare className="h-6 w-6 text-primary/50" />
                      </div>
                      <p className="text-sm font-bold text-foreground">¡Todo al día!</p>
                      <p className="text-xs text-muted-foreground mt-1 px-4">No tienes tareas para hoy. Disfruta tu día.</p>
                      <Button variant="outline" size="sm" asChild className="mt-4 text-xs font-medium">
                        <Link href="/tasks">Ver todas las tareas</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actividad Reciente - Timeline */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Actividad Reciente</h3>
                <div className="rounded-xl border border-border/30 bg-background overflow-hidden p-4">
                  <ActivityTimeline
                    items={data?.activityFeed ?? []}
                    isLoading={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>

      <QuickNoteDialog open={quickNoteOpen} onOpenChange={setQuickNoteOpen} onSuccess={loadDashboardData} />
    </AuthGuard>
  )
}
