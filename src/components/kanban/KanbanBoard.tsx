'use client'

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { useState, useMemo, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { KanbanColumn, type Column } from "./KanbanColumn"
import { KanbanCard } from "./KanbanCard"
import { type Task, projectsApi } from "@/lib/api"
import { toast } from "sonner"
import { AddColumnButton } from "../tasks/AddColumnButton"
import { type KanbanColumnData } from "../tasks/KanbanColumn"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

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
    projectId?: string
}

/**
 * Columnas por defecto basadas en status (sin proyecto seleccionado).
 * Son estáticas y no se guardan en localStorage ni en backend.
 */
const DEFAULT_STATUS_COLUMNS: Column[] = [
    { id: 'todo', title: 'Por hacer', color: '#3b82f6', tasks: [] },
    { id: 'in_progress', title: 'En progreso', color: '#f59e0b', tasks: [] },
    { id: 'done', title: 'Completado', color: '#22c55e', tasks: [] },
]

/**
 * Secciones por defecto que se crean en el backend cuando un proyecto no tiene secciones.
 */
const DEFAULT_SECTIONS_TO_CREATE = [
    { name: 'Por hacer', color: '#3b82f6', order: 0 },
    { name: 'En progreso', color: '#f59e0b', order: 1 },
    { name: 'Completado', color: '#22c55e', order: 2 },
]

export function KanbanBoard({
    tasks,
    loading,
    onTaskMove,
    onEditTask,
    onDeleteTask,
    onNewTask,
    projectId,
}: KanbanBoardProps) {
    const [columns, setColumns] = useState<Column[]>([])
    const [activeColumn, setActiveColumn] = useState<Column | null>(null)
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [columnsLoading, setColumnsLoading] = useState(false)

    // Deduplicate tasks to verify integrity (Fix for SortableContext unique key error)
    const uniqueTasks = useMemo(() => {
        const seen = new Set<string>();
        return tasks.filter(t => {
            const taskId = t._id || t.id;
            if (!taskId || seen.has(taskId)) return false;
            seen.add(taskId);
            return true;
        });
    }, [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // ─── Cargar columnas ───────────────────────────────────────────────
    const loadColumns = useCallback(async () => {
        if (!projectId) {
            // Sin proyecto: columnas fijas por status
            setColumns(DEFAULT_STATUS_COLUMNS)
            return
        }

        setColumnsLoading(true)
        try {
            const response = await projectsApi.getById(projectId)
            const sections = response.project.sections

            if (sections && sections.length > 0) {
                const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                setColumns(sorted.map(s => ({ id: s._id, title: s.name, color: s.color, tasks: [] })))
            } else {
                // El proyecto no tiene secciones → crear las 3 por defecto vía API
                for (const section of DEFAULT_SECTIONS_TO_CREATE) {
                    await projectsApi.addSection(projectId, { name: section.name, color: section.color })
                }
                // Recargar para obtener los IDs reales
                const refreshed = await projectsApi.getById(projectId)
                const newSections = refreshed.project.sections || []
                const sorted = [...newSections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                setColumns(sorted.map(s => ({ id: s._id, title: s.name, color: s.color, tasks: [] })))
            }
        } catch (error) {
            console.error("Error cargando secciones:", error)
            toast.error("Error al cargar las secciones del proyecto")
            setColumns(DEFAULT_STATUS_COLUMNS)
        } finally {
            setColumnsLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        loadColumns()
    }, [loadColumns])

    // ─── Distribuir tareas en columnas ─────────────────────────────────
    useEffect(() => {
        setColumns(prev =>
            prev.map(col => ({
                ...col,
                tasks: uniqueTasks
                    .filter(task => {
                        // Si hay proyecto, matchear por sectionId; si no, por status
                        const key = projectId ? (task.sectionId || '') : (task.status || 'todo')
                        return key === col.id
                    })
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
            }))
        )
    }, [uniqueTasks, projectId, columns.length]) // columns.length para re-distribuir al cargar

    const columnsId = useMemo(() => columns.map(col => col.id), [columns])

    // ─── Drag & Drop Handlers ─────────────────────────────────────────

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column)
        } else if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task)
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveColumn(null)
        setActiveTask(null)

        const { active, over } = event
        if (!over || active.id === over.id) return

        // ── Reordenar columnas ──
        if (active.data.current?.type === "Column") {
            setColumns(prev => {
                const activeIdx = prev.findIndex(c => c.id === active.id)
                const overIdx = prev.findIndex(c => c.id === over.id)
                const reordered = arrayMove(prev, activeIdx, overIdx)

                // Persistir reorden en backend (solo si hay proyecto)
                if (projectId) {
                    const sectionsPayload = reordered.map((c, i) => ({
                        _id: c.id,
                        name: c.title,
                        order: i,
                    }))
                    projectsApi.reorderSections(projectId, sectionsPayload).catch(() => {
                        toast.error("Error al reordenar secciones")
                    })
                }

                return reordered
            })
            return
        }

        // ── Mover tarea entre columnas ──
        if (active.data.current?.type === "Task") {
            const movedTask = active.data.current.task as Task
            let targetColId = ""

            if (over.data.current?.type === "Column") {
                targetColId = over.id as string
            } else if (over.data.current?.type === "Task") {
                const overTask = over.data.current.task as Task
                const col = columns.find(c => c.tasks.some(t => {
                    const tId = t._id || t.id;
                    const overId = overTask._id || overTask.id;
                    return tId === overId;
                }))
                if (col) targetColId = col.id
            }

            if (targetColId) {
                const currentColId = projectId
                    ? (movedTask.sectionId || '')
                    : (movedTask.status || 'todo')

                if (currentColId !== targetColId) {
                    onTaskMove(movedTask._id || movedTask.id || '', targetColId)
                }
            }
        }
    }

    // ─── Handlers para gestión de columnas (solo con proyecto) ─────────

    const handleAddColumn = async (newColumn: Omit<KanbanColumnData, 'id'>) => {
        if (!projectId) {
            toast.error("Selecciona un proyecto para agregar secciones")
            return
        }

        try {
            const response = await projectsApi.addSection(projectId, {
                name: newColumn.title,
                color: newColumn.color,
            })
            if (response.project.sections) {
                const sorted = [...response.project.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                setColumns(sorted.map(s => ({ id: s._id, title: s.name, color: s.color, tasks: [] })))
            }
            toast.success("Sección agregada")
        } catch {
            toast.error("Error al crear la sección")
        }
    }

    const handleUpdateColumn = async (id: string, title: string) => {
        if (!projectId) return

        try {
            await projectsApi.updateSection(projectId, id, { name: title })
            setColumns(prev => prev.map(col => (col.id === id ? { ...col, title } : col)))
            toast.success("Sección actualizada")
        } catch {
            toast.error("Error al actualizar la sección")
        }
    }

    const handleDeleteColumn = async (id: string) => {
        if (!projectId) return
        if (!confirm("¿Eliminar esta sección? Las tareas dentro se quedarán sin sección asignada.")) return

        try {
            await projectsApi.deleteSection(projectId, id)
            setColumns(prev => prev.filter(c => c.id !== id))
            toast.success("Sección eliminada")
        } catch {
            toast.error("Error al eliminar la sección")
        }
    }

    // ─── Render ────────────────────────────────────────────────────────

    const isProjectMode = Boolean(projectId)

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="flex h-full flex-col">
                <ScrollArea className="flex-1 w-full whitespace-nowrap kanban-scroll-container">
                    <div className="flex gap-4 p-4 items-start pb-6">
                        <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                            {columns.map(col => (
                                <KanbanColumn
                                    key={col.id}
                                    column={col}
                                    tasks={col.tasks}
                                    onAddTask={onNewTask}
                                    onEditTask={onEditTask}
                                    onDeleteTask={onDeleteTask}
                                    onUpdateColumn={isProjectMode ? handleUpdateColumn : undefined}
                                    onDeleteColumn={isProjectMode ? handleDeleteColumn : undefined}
                                />
                            ))}
                        </SortableContext>
                        <AddColumnButton onAdd={handleAddColumn} />
                        <div className="w-4" />
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {typeof document !== 'undefined' &&
                createPortal(
                    <DragOverlay>
                        {activeColumn && (
                            <KanbanColumn column={activeColumn} tasks={activeColumn.tasks} isOverlay />
                        )}
                        {activeTask && <KanbanCard task={activeTask} isOverlay />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    )
}
