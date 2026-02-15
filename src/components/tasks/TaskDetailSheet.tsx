'use client'

import { useState, useEffect, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LexicalEditor } from "@/components/editor/LexicalEditor"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Flag,
  FolderKanban,
  Link as LinkIcon,
  MoreHorizontal,
  User,
  X,
  MessageSquare,
  Paperclip,
  Trash2,
  AlertCircle,
  FileText,
  Loader2,
  Download,
  Clock,
  Edit2,
  Tag,
  Plus
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { type Task, type Project, type Attachment, commentsApi, type Comment, api, organizationApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useOrganization } from "@/context/organization-context"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface TaskDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null // null = creating new task
  initialDate?: Date
  projects: Project[]
  onSave: (taskData: Partial<Task>) => Promise<void>
  onDelete?: (task: Task) => void
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  initialDate,
  projects,
  onSave,
  onDelete
}: TaskDetailSheetProps) {
  // Local state for form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [projectId, setProjectId] = useState<string>("none")
  const [dueDate, setDueDate] = useState("")
  const [hours, setHours] = useState("")
  const [minutes, setMinutes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Tags state
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  const { user } = useAuth()
  const { currentOrganization } = useOrganization()

  // Members state for assignment
  const [members, setMembers] = useState<Array<{ userId: { _id: string; name: string; email: string; avatar?: string } | string; role: string }>>([])
  const [owner, setOwner] = useState<{ _id: string; name: string; email: string; avatar?: string } | null>(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string>("none")

  const loadMembers = useCallback(async (organizationId: string) => {
    setIsLoadingMembers(true)
    try {
      const response = await organizationApi.getMembers(organizationId)
      setMembers(response.members || [])
      setOwner(response.owner || null)
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Error al cargar miembros')
    } finally {
      setIsLoadingMembers(false)
    }
  }, [])

  const loadComments = useCallback(async (taskId: string) => {
    if (!taskId || taskId === 'new') {
      setComments([])
      return
    }

    setIsLoadingComments(true)
    try {
      const response = await commentsApi.getAll(taskId)
      setComments(response.comments)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar comentarios'
      const errorWithStatus = error as Error & { status?: number; isExpected?: boolean }
      const errorStatus = errorWithStatus?.status
      const isExpected = errorWithStatus?.isExpected === true

      // Si la tarea no existe (404) o es un error esperado, no mostrar error en consola
      const isTaskNotFound = errorMessage.includes('Tarea no encontrada') ||
        errorMessage.includes('no encontrada') ||
        errorStatus === 404 ||
        isExpected

      if (isTaskNotFound) {
        // Tarea no existe, simplemente establecer comentarios vacíos sin mostrar error
        setComments([])
        return
      }

      // Para otros errores, mostrar en consola y toast
      console.error('Error loading comments:', error)
      toast.error('Error al cargar comentarios')
    } finally {
      setIsLoadingComments(false)
    }
  }, [])

  // Reset form when task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || "")
        setStatus(task.status)
        setPriority(task.priority || 'medium')
        const pId = task.projectId ? (typeof task.projectId === 'object' ? task.projectId._id : task.projectId) : "none"
        setProjectId(pId)
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "")
        if (task.estimatedTime) {
          setHours(Math.floor(task.estimatedTime / 60).toString())
          setMinutes((task.estimatedTime % 60).toString())
        } else {
          setHours("")
          setMinutes("")
        }
        setAttachments(task.attachments || [])
        setAssignedTo(task.assignedTo?._id || (typeof task.assignedTo === 'string' ? task.assignedTo : "none"))
        setTags(task.tags || [])
      } else {
        // New Task Defaults
        setTitle("")
        setDescription("")
        setStatus("todo")
        setPriority("medium")
        setProjectId("none")
        setDueDate(initialDate ? format(initialDate, "yyyy-MM-dd") : "")
        setHours("")
        setMinutes("")
        setAttachments([])
        setAssignedTo("none")
        setTags([])
      }
      // Cargar comentarios si la tarea existe y tiene un ID válido
      if (task?._id && typeof task._id === 'string' && task._id !== 'new' && task._id.trim() !== '') {
        loadComments(task._id)
      } else {
        setComments([])
      }
      // Cargar miembros de la organización
      if (currentOrganization?._id) {
        loadMembers(currentOrganization._id)
      }
    }
    // loadComments y loadMembers se llaman condicionalmente dentro del efecto
  }, [open, task, currentOrganization, initialDate, loadComments, loadMembers])

  const handleAddComment = async () => {
    if (!task?._id || !newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      const response = await commentsApi.create(task._id, { content: newComment.trim() })
      setComments([...comments, response.comment])
      setNewComment("")
      toast.success("Comentario agregado")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al agregar comentario"
      toast.error(errorMessage)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!task?._id || !editCommentContent.trim()) return

    try {
      const response = await commentsApi.update(task._id, commentId, { content: editCommentContent.trim() })
      setComments(comments.map(c => c._id === commentId ? response.comment : c))
      setEditingCommentId(null)
      setEditCommentContent("")
      toast.success("Comentario actualizado")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar comentario"
      toast.error(errorMessage)
      // Si el error es por tiempo expirado, cerrar el modo de edición
      if (errorMessage.includes("15 minutos")) {
        setEditingCommentId(null)
        setEditCommentContent("")
      }
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!task?._id) return

    if (!confirm("¿Estás seguro de eliminar este comentario?")) return

    try {
      await commentsApi.delete(task._id, commentId)
      setComments(comments.filter(c => c._id !== commentId))
      toast.success("Comentario eliminado")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar comentario"
      toast.error(errorMessage)
    }
  }

  const startEditComment = (comment: Comment) => {
    setEditingCommentId((comment as { _id?: string; id?: string })._id ?? (comment as { id?: string }).id ?? null)
    setEditCommentContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditCommentContent("")
  }

  const handleSubmit = async () => {
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      // Normalizar la fecha para evitar problemas de zona horaria
      let normalizedDueDate: string | undefined = undefined
      if (dueDate) {
        // Crear fecha en hora local (medianoche) y convertir a ISO
        const [year, month, day] = dueDate.split('-').map(Number)
        const localDate = new Date(year, month - 1, day, 12, 0, 0) // Mediodía para evitar cambios de día
        normalizedDueDate = localDate.toISOString()
      }

      const totalMinutes = (parseInt(hours || "0") * 60) + parseInt(minutes || "0")

      await onSave({
        title,
        description,
        status: status as 'todo' | 'in_progress' | 'done',
        priority: priority as 'low' | 'medium' | 'high',
        projectId: projectId === "none" ? undefined : projectId,
        dueDate: normalizedDueDate,
        estimatedTime: totalMinutes > 0 ? totalMinutes : undefined,
        attachments: attachments,
        assignedTo: assignedTo === "none" ? undefined : (assignedTo as unknown as Task['assignedTo']),
        tags: tags
      } as Partial<Task>)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Subir archivo a Google Cloud Storage
      const response = await api.upload<{ url: string }>('/api/upload/file', file)

      const newAttachment: Attachment = {
        name: file.name,
        url: response.url,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }

      // Actualizar estado local
      const updatedAttachments = [...attachments, newAttachment]
      setAttachments(updatedAttachments)

      // Guardar cambios automáticamente si la tarea ya existe
      if (task?._id) {
        await onSave({
          ...task,
          projectId: projectId === "none" ? undefined : projectId, // Mantener el projectId actual normalizado
          attachments: updatedAttachments
        })
      }

      toast.success("Archivo adjunto correctamente")
    } catch (error) {
      console.error(error)
      toast.error("Error al subir el archivo")
    } finally {
      setIsUploading(false)
      // Limpiar input
      e.target.value = ''
    }
  }

  const removeAttachment = async (index: number) => {
    const updatedAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(updatedAttachments)

    if (task?._id) {
      await onSave({
        ...task,
        projectId: projectId === "none" ? undefined : projectId,
        attachments: updatedAttachments
      })
    }
  }

  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (!trimmedTag) return

    // Evitar duplicados
    if (tags.includes(trimmedTag.toLowerCase())) {
      toast.error("Esta etiqueta ya existe")
      setNewTag("")
      return
    }

    const updatedTags = [...tags, trimmedTag.toLowerCase()]
    setTags(updatedTags)
    setNewTag("")

    // Guardar automáticamente si la tarea ya existe
    if (task?._id) {
      onSave({
        ...task,
        projectId: projectId === "none" ? undefined : projectId,
        tags: updatedTags
      }).catch(() => {
        // Revertir si falla
        setTags(tags)
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove)
    setTags(updatedTags)

    // Guardar automáticamente si la tarea ya existe
    if (task?._id) {
      onSave({
        ...task,
        projectId: projectId === "none" ? undefined : projectId,
        tags: updatedTags
      }).catch(() => {
        // Revertir si falla
        setTags(tags)
      })
    }
  }

  // Helper for status badge
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'todo': return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      case 'in_progress': return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      case 'done': return 'bg-green-100 text-green-700 hover:bg-green-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl p-0 overflow-hidden flex flex-col bg-card" side="right">
        <SheetHeader className="sr-only">
          <SheetTitle>Detalle de la tarea</SheetTitle>
          <SheetDescription>Edita los detalles de tu tarea</SheetDescription>
        </SheetHeader>
        {/* Header / Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn("h-8 text-xs font-medium border-0 px-2.5", task?.status === 'done' && "bg-green-100 text-green-700")}
              onClick={() => setStatus(status === 'done' ? 'todo' : 'done')}
            >
              <CheckSquare className={cn("mr-1.5 h-3.5 w-3.5", status === 'done' ? "fill-current" : "")} />
              {status === 'done' ? 'Completada' : 'Marcar como finalizada'}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">

            {/* Title & Status */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40"
                  placeholder="Escribe el nombre de la tarea..."
                />

                {/* Overdue Alert */}
                {task?.isOverdue && status !== 'done' && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-red-900">Esta tarea está atrasada</p>
                      <p className="text-xs text-red-700">
                        {task.overdueAt
                          ? `Marcada como atrasada ${format(new Date(task.overdueAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}`
                          : `La fecha de entrega era ${task.dueDate ? format(new Date(task.dueDate), "d 'de' MMMM", { locale: es }) : 'anterior'}`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modern Properties Grid - Linear Style */}
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-y-4 gap-x-8 items-center">

                {/* Status */}
                <Label className="text-xs text-muted-foreground font-medium">Estado</Label>
                <div className="flex items-center">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-fit min-w-[140px] h-8 text-xs bg-background border border-border/60 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", status === 'done' ? "bg-emerald-500" : status === 'in_progress' ? "bg-blue-500" : "bg-zinc-400")} />
                        <span className="capitalize">{status === 'done' ? 'Completada' : status === 'in_progress' ? 'En progreso' : 'Por hacer'}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Por hacer</SelectItem>
                      <SelectItem value="in_progress">En progreso</SelectItem>
                      <SelectItem value="done">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <Label className="text-xs text-muted-foreground font-medium">Prioridad</Label>
                <div className="flex items-center">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="w-fit min-w-[140px] h-8 text-xs bg-background border border-border/60 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Flag className={cn("h-3.5 w-3.5", priority === 'high' ? "text-red-500 fill-red-500" : priority === 'medium' ? "text-orange-500" : "text-muted-foreground")} />
                        <span className="capitalize">{priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <Label className="text-xs text-muted-foreground font-medium">Asignado a</Label>
                <div className="flex items-center">
                  {isLoadingMembers ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Select value={assignedTo} onValueChange={async (value) => {
                      setAssignedTo(value)
                      if (task?._id) {
                        // ... save logic (kept same as logic is inside component state/props)
                        try {
                          await onSave({
                            ...task,
                            projectId: projectId === "none" ? undefined : projectId,
                            assignedTo: value === "none" ? undefined : (value as unknown as Task['assignedTo'])
                          } as Partial<Task>)
                        } catch (error) { console.error(error) }
                      }
                    }}>
                      <SelectTrigger className="w-fit min-w-[140px] h-8 text-xs bg-background border border-border/60 shadow-sm">
                        <div className="flex items-center gap-2 truncate max-w-[200px]">
                          {/* User rendering logic simplified for display */}
                          {assignedTo !== "none" ? (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-foreground/70" />
                              <span>
                                {(() => {
                                  const member = members.find(m => (typeof m.userId === 'object' ? m.userId._id : '') === assignedTo);
                                  if (member && typeof member.userId === 'object') {
                                    return member.userId.name;
                                  }
                                  return (owner?._id === assignedTo ? owner.name : 'Usuario');
                                })()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin asignar</span>
                          )}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {owner && <SelectItem value={owner._id}>{owner.name}</SelectItem>}
                        {members.map((member) => {
                          const u = typeof member.userId === 'object' ? member.userId : null;
                          if (!u || (owner && owner._id === u._id)) return null;
                          return <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Project */}
                <Label className="text-xs text-muted-foreground font-medium">Proyecto</Label>
                <div className="flex items-center">
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="w-fit min-w-[140px] h-8 text-xs bg-background border border-border/60 shadow-sm">
                      <div className="flex items-center gap-2 truncate max-w-[200px]">
                        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">
                          {projects.find(p => p._id === projectId)?.name || "Sin proyecto"}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proyecto</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Due Date */}
                <Label className="text-xs text-muted-foreground font-medium">Fecha de entrega</Label>
                <div className="flex items-center">
                  <div className="relative group">
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-fit min-w-[140px] h-8 text-xs bg-background border border-border/60 shadow-sm pl-8"
                    />
                    <CalendarIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Estimated Time (Optional Row) */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase">Tiempo Estimado:</span>
                  <div className="flex items-center gap-2 w-32">
                    <Input
                      type="number"
                      min="0"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="h-7 bg-transparent border-b border-0 rounded-none px-0 text-center focus-visible:ring-0"
                      placeholder="0"
                    />
                    <span>h</span>
                    <Input
                      type="number" min="0" max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="h-7 bg-transparent border-b border-0 rounded-none px-0 text-center focus-visible:ring-0"
                      placeholder="00"
                    />
                    <span>m</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground/70" />
                <h3 className="font-semibold text-base">Descripción</h3>
              </div>
              <div className="min-h-[150px] border border-transparent hover:border-border rounded-md transition-colors">
                <LexicalEditor
                  initialValue={description}
                  onChange={setDescription}
                  placeholder="Escribe una descripción más detallada..."
                  className="h-full min-h-[150px]"
                />
              </div>
            </div>

            <Separator />

            {/* Attachments & Tags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Attachments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" /> Adjuntos
                  </h3>
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer text-xs font-medium px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-1 transition-colors"
                    >
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Adjuntar
                    </Label>
                  </div>
                </div>

                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors group">
                        <div className="h-8 w-8 rounded bg-background flex items-center justify-center shrink-0 border overflow-hidden">
                          {file.type.includes('image') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                          ) : <FileText className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => removeAttachment(index)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground/50 italic">No hay archivos.</p>}
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" /> Etiquetas
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1 group">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Nueva etiqueta..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="h-6 w-24 text-xs bg-transparent border-b border-0 rounded-none px-0 focus-visible:ring-0"
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddTag} disabled={!newTag.trim()}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Comments & Activity */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Actividad</h3>
              </div>

              <div className="space-y-6">
                {/* Comments List */}
                {isLoadingComments ? (
                  <div className="py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : comments.map((comment, index) => {
                  const commentId = comment._id ?? (comment as { id?: string }).id ?? `comment-${index}`
                  const isAuthor = typeof comment.userId === 'object' && comment.userId._id === user?._id
                  const isEditing = editingCommentId === comment._id || editingCommentId === (comment as { id?: string }).id

                  const commentAge = Date.now() - new Date(comment.createdAt).getTime()
                  const FIFTEEN_MINUTES = 15 * 60 * 1000
                  const canEditOrDelete = isAuthor && commentAge <= FIFTEEN_MINUTES

                  // Safe user access
                  const commentUser = typeof comment.userId === 'object' ? comment.userId : { name: 'Usuario desconocido', avatar: undefined }

                  return (
                    <div key={commentId} className="flex gap-3 group">
                      <Avatar className="h-6 w-6 mt-0.5 border border-border/50">
                        {commentUser.avatar && commentUser.avatar.trim() !== "" ? (
                          <AvatarImage src={commentUser.avatar} alt={commentUser.name} />
                        ) : null}
                        <AvatarFallback className="text-[9px]">
                          {commentUser.name?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground/90">{commentUser.name}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "d MMM HH:mm", { locale: es })}</span>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <Input
                                value={editCommentContent}
                                onChange={(e) => setEditCommentContent(e.target.value)}
                                className="text-sm bg-background min-h-[60px] py-2 px-3 resize-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.metaKey) handleUpdateComment(commentId)
                                  if (e.key === 'Escape') cancelEdit()
                                }}
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleUpdateComment(commentId)}>Guardar</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group/comment relative">
                            <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{comment.content}</div>
                            {canEditOrDelete && (
                              <div className="absolute -right-2 -top-6 flex gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity bg-background border rounded-md shadow-sm p-0.5">
                                <button onClick={() => startEditComment(comment)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button onClick={() => handleDeleteComment(commentId)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors" title="Eliminar">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Add Comment Input */}
                <div className="flex gap-3 pt-2">
                  <Avatar className="h-6 w-6 mt-2">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-[9px]">{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                      className="bg-muted/30 border-transparent focus:bg-background focus:border-border transition-all min-h-[40px] py-2 text-sm"
                    />
                    {newComment.trim() && (
                      <div className="absolute right-1 top-1">
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={handleAddComment}
                          disabled={isSubmittingComment}
                        >
                          Enviar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Button (moved to bottom, more subtle) */}
            {task && onDelete && (
              <div className="pt-6">
                <Button
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 w-full justify-start px-2"
                  onClick={() => onDelete(task)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar tarea
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (Mobile mainly, or for explicit Save) */}
        <div className="border-t p-4 flex justify-end gap-2 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : task ? "Guardar cambios" : "Crear tarea"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
