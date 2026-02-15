# Diseño de Tablero Kanban (NexoScribe)

Este documento describe la implementación del tablero Kanban utilizando **exclusivamente componentes de shadcn/ui** para garantizar consistencia visual y funcional.

## Tecnologías y Librerías
*   **Drag & Drop**: `@dnd-kit/core` (recomendado por su flexibilidad y accesibilidad) o `react-beautiful-dnd`.
*   **Componentes UI**: shadcn/ui (basado en Radix UI + Tailwind).
*   **Gestión de Estado**: `zustand` o React Context.

## Estructura de Componentes

### 1. Tablero Principal (`KanbanBoard.tsx`)
Contenedor principal que maneja el contexto de Drag & Drop.
- **Componentes shadcn**:
    - `ScrollArea`: Para el desplazamiento horizontal de las columnas.
    - `Button`: Para acciones globales ("Nueva Tarea", "Filtrar").

### 2. Columna (`KanbanColumn.tsx`)
Representa un estado (ej: "Por hacer", "En progreso").
- **Componentes shadcn**:
    - `Card`: Contenedor base de la columna.
    - `CardHeader`: Título de la columna y contador de tareas.
    - `CardContent`: Área droppable donde van las tareas.
    - `Button` (variant="ghost"): Opción para añadir tarea rápida al final.

### 3. Tarjeta de Tarea (`KanbanCard.tsx`)
Elemento arrastrable individual.
- **Componentes shadcn**:
    - `Card`: Contenedor principal con `hover:border-primary`.
    - `Badge`: Para etiquetas de prioridad ("Alta", "Media") y categorías.
    - `Avatar`: Para mostrar al usuario asignado.
    - `DropdownMenu`: Para acciones (Editar, Eliminar, Mover).
    - `Separator`: Para dividir secciones visuales si es necesario.

### 4. Modales y Formularios
Para crear o editar tareas.
- **Componentes shadcn**:
    - `Dialog` (o `Sheet`): Para el formulario principal de tarea.
    - `Form` (react-hook-form + zod): Validación de datos.
    - `Input`, `Textarea`: Campos de texto.
    - `Select`: Selección de estado o prioridad.
    - `Popover`: Selector de fechas (Calendar) o asignación de usuarios.

## Flujo de Interacción
1.  **Visualización**: El usuario ve columnas renderizadas con `Card`.
2.  **Arrastrar**: Al arrastrar una `KanbanCard`, se usan los sensores de dnd-kit.
3.  **Acciones**:
    *   Click en tarjeta -> Abre `Dialog` con detalles.
    *   Click en "+ Nueva" -> Abre `Dialog` de creación.
    *   Click en Avatar -> Abre `Popover` con detalles del usuario.

## Ejemplo de Código (Maqueta)

```tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function KanbanCard({ task }) {
  return (
    <Card className="cursor-grab active:cursor-grabbing hover:border-primary transition-colors">
      <CardHeader className="p-3 pb-2 space-y-0">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium leading-none">{task.title}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between mt-2">
          <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
            {task.priority}
          </Badge>
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assignee.avatar} />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>
  )
}
```
