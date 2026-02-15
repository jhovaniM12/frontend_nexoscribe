'use client'

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, FolderKanban, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { projectsApi, type Project } from "@/lib/api"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectDialog } from "@/components/projects/ProjectDialog"
import { useOrganization } from "@/context/organization-context"
import { AuthGuard } from "@/components/AuthGuard"

export default function ProjectsPage() {
  const { currentOrganization } = useOrganization()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState("")
  const [projectDesc, setProjectDesc] = useState("")
  const [projectStatus, setProjectStatus] = useState("active")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const response = await projectsApi.getAll()
      setProjects(response.projects || [])
    } catch (error) {
      console.error("Error loading projects:", error)
      toast.error("Error al cargar proyectos")
    } finally {
      setLoading(false)
    }
  }, [currentOrganization])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreate = () => {
    setDialogMode('create')
    setSelectedProject(null)
    setProjectName("")
    setProjectDesc("")
    setProjectStatus("active")
    setDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    setDialogMode('edit')
    setSelectedProject(project)
    setProjectName(project.name)
    setProjectDesc(project.description || "")
    setProjectStatus(project.status)
    setDialogOpen(true)
  }

  const handleDelete = async (project: Project) => {
    if (!confirm(`¿Estás seguro de eliminar el proyecto "${project.name}"?`)) return

    try {
      await projectsApi.delete(project._id)
      setProjects(projects.filter(p => p._id !== project._id))
      toast.success("Proyecto eliminado")
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error("Error al eliminar el proyecto")
    }
  }

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    setIsSubmitting(true)
    try {
      if (dialogMode === 'create') {
        const response = await projectsApi.create({
          name: projectName,
          description: projectDesc,
          status: projectStatus as 'active' | 'archived' | 'completed'
        })
        setProjects([response.project, ...projects])
        toast.success("Proyecto creado")
      } else {
        if (!selectedProject) return
        const response = await projectsApi.update(selectedProject._id, {
          name: projectName,
          description: projectDesc,
          status: projectStatus as 'active' | 'archived' | 'completed'
        })
        setProjects(projects.map(p => p._id === selectedProject._id ? response.project : p))
        toast.success("Proyecto actualizado")
      }
      setDialogOpen(false)
    } catch (error) {
      console.error("Error saving project:", error)
      toast.error("Error al guardar el proyecto")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full overflow-x-hidden">
          {/* Header - Linear Style */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <FolderKanban className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Workspace</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
              <p className="text-sm text-muted-foreground">
                Colabora y mantén el progreso de tus equipos en un solo lugar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-initial min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                <Input
                  placeholder="Buscar proyectos..."
                  className="pl-10 h-10 w-full sm:w-[200px] md:w-[240px] bg-muted/20 border-transparent focus:bg-background focus:border-border/60 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="h-10 gap-2 bg-primary text-primary-foreground font-medium shadow-sm active:scale-95 transition-all">
                <Plus className="h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">
                {searchQuery ? "No se encontraron proyectos" : "No hay proyectos creados aún"}
              </p>
              {!searchQuery && (
                <Button variant="link" onClick={handleCreate} className="mt-2">
                  Crear el primero
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project._id ?? project.id ?? `project-${index}`}
                  project={project}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <ProjectDialog
            open={dialogOpen}
            mode={dialogMode}
            name={projectName}
            description={projectDesc}
            status={projectStatus}
            isSubmitting={isSubmitting}
            onOpenChange={setDialogOpen}
            onNameChange={setProjectName}
            onDescriptionChange={setProjectDesc}
            onStatusChange={setProjectStatus}
            onSubmit={handleSubmit}
          />
        </div>
      </Layout>
    </AuthGuard>
  )
}
