# Reglas de Desarrollo para NexoScribe Frontend

## 📌 Visión General

Frontend de NexoScribe construido con **Next.js 14**, **TypeScript**, **TailwindCSS** y **shadcn/ui**. Este documento establece las reglas que Antigravity debe seguir al trabajar en el frontend.

---

## 🏗️ Arquitectura Next.js

### 1. Estructura de App Router

**SIEMPRE** usar App Router de Next.js 14:

```
src/app/
├── (auth)/          # Rutas de autenticación (layout propio)
├── (dashboard)/     # Rutas protegidas (layout con sidebar)
├── api/             # API routes (solo si es necesario)
└── layout.tsx       # Layout raíz
```

### 2. Server vs Client Components

- ✅ **Por defecto**: Server Components (sin 'use client')
- ✅ **'use client'** solo cuando necesites:
  - Hooks de React (useState, useEffect, etc.)
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window, etc.)
  - Context providers
  - Librerías que requieren cliente (Lexical, Fabric.js, etc.)

```typescript
// ✅ Server Component (por defecto)
export default async function NotesPage() {
  const notes = await fetchNotes(); // Fetch directo
  return <NotesList notes={notes} />;
}

// ✅ Client Component (cuando sea necesario)
'use client';
export function NoteEditor() {
  const [content, setContent] = useState('');
  return <textarea value={content} onChange={e => setContent(e.target.value)} />;
}
```

---

## 🎨 Diseño y UI

### 3. Sistema de Diseño

**SIEMPRE** usar componentes de shadcn/ui cuando estén disponibles:
- ✅ Button, Card, Dialog, Dropdown, Input, Select, etc.
- ✅ Extender con variantes en lugar de crear desde cero
- ❌ **NO** crear botones o inputs personalizados sin revisar shadcn primero

### 4. TailwindCSS

- ✅ Usar clases de utilidad de Tailwind
- ✅ Seguir el sistema de colores del `tailwind.config.ts`
- ✅ Usar `cn()` helper para combinar clases condicionales
- ❌ **NO** usar estilos inline excepto para valores dinámicos

```typescript
// ✅ CORRECTO
<div className={cn(
  "rounded-lg p-4",
  isActive && "bg-primary text-primary-foreground",
  className
)}>

// ❌ INCORRECTO
<div style={{ padding: '16px', borderRadius: '8px' }}>
```

### 5. Responsive Design

- ✅ **Mobile-first**: Diseñar primero para móvil, luego desktop
- ✅ Usar breakpoints de Tailwind: `sm:`, `md:`, `lg:`, `xl:`
- ✅ Probar en múltiples tamaños de pantalla

---

## 🔐 Autenticación y Estado

### 6. Gestión de Sesión

- ✅ Usar **httpOnly cookies** para JWT (preferido)
- ✅ Header `x-org-id` en TODAS las requests a API
- ✅ Validar sesión en middleware o server components
- ✅ Redirigir a login si no autenticado

### 7. Estado Global

**Minimizar estado global:**
- ✅ **Zustand**: Para estado de UI (sidebar abierto, tema, org activa)
- ✅ **React Query/SWR**: Para datos del servidor (caché automático)
- ✅ **Context**: Solo para temas específicos (AuthContext, OrgContext)
- ❌ **NO** usar Redux a menos que sea absolutamente necesario

```typescript
// ✅ CORRECTO - Zustand para UI
const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// ✅ CORRECTO - React Query para datos
const { data, isLoading } = useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes,
});
```

---

## 🌐 Llamadas a API

### 8. Fetch y Manejo de Errores

- ✅ Centralizar llamadas en `src/lib/api.ts` o similar
- ✅ Incluir header `x-org-id` automáticamente
- ✅ Manejar errores de forma consistente
- ✅ Mostrar feedback al usuario (toasts, mensajes de error)

```typescript
// ✅ CORRECTO
async function createNote(data: CreateNoteDto) {
  try {
    const response = await fetch(`${API_URL}/api/note/create-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': getCurrentOrgId(),
      },
      credentials: 'include', // Para cookies
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  } catch (error) {
    toast.error('Error al crear la nota');
    throw error;
  }
}
```

### 9. Sincronización con Backend

- ✅ **SIEMPRE** verificar que los tipos coincidan con el backend
- ✅ Usar las mismas interfaces (copiar de backend o compartir paquete)
- ✅ Validar respuestas de API con Zod si es crítico

---

## 📝 TypeScript

### 10. Tipado Estricto

- ✅ **NO usar `any`**. Preferir tipos específicos o `unknown`
- ✅ Definir interfaces para props de componentes
- ✅ Usar tipos genéricos cuando sea apropiado
- ✅ Aprovechar Type Inference cuando sea obvio

```typescript
// ✅ CORRECTO
interface NoteCardProps {
  note: Note;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  // ...
}

// ❌ INCORRECTO
export function NoteCard({ note, onEdit, onDelete }: any) {
  // ...
}
```

### 11. Tipos del Backend

Reusar tipos del backend cuando sea posible:

```typescript
// src/types/api.ts
export interface Note {
  _id: string;
  title: string;
  content: string;
  folderId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  title: string;
  content?: string;
  folderId?: string;
}
```

---

## 🧩 Componentes

### 12. Estructura de Componentes

Organizar por feature o tipo:

```
src/components/
├── ui/              # shadcn/ui base components
├── notes/           # Componentes específicos de notas
│   ├── NoteCard.tsx
│   ├── NoteEditor.tsx
│   └── NotesList.tsx
├── tasks/           # Componentes de tareas
└── shared/          # Componentes compartidos
```

### 13. Reglas de Componentes

- ✅ **Un componente por archivo** (excepto sub-componentes pequeños)
- ✅ **Props destructuradas** en la firma
- ✅ **Exportar como default** solo para páginas
- ✅ **Exportar como named** para componentes reutilizables

```typescript
// ✅ CORRECTO - Componente reutilizable
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function CustomButton({ variant = 'primary', onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// ✅ CORRECTO - Página
export default function NotesPage() {
  return <div>...</div>;
}
```

### 14. Performance

- ✅ Usar `React.memo()` para componentes pesados que reciben props estables
- ✅ `useMemo()` y `useCallback()` solo cuando sea necesario (no prematuramente)
- ✅ Lazy loading para componentes grandes: `lazy(() => import('./HeavyComponent'))`
- ✅ Optimistic updates para mejor UX

---

## 🧪 Testing y Linting

### 15. ESLint

- ✅ **SIEMPRE** resolver warnings de ESLint antes de finalizar
- ✅ Priorizar: `@typescript-eslint/no-explicit-any`, `react-hooks/exhaustive-deps`
- ✅ No suprimir lints sin justificación válida

### 16. Testing (si está configurado)

- ✅ Tests unitarios para utilidades y helpers
- ✅ Tests de integración para flujos críticos
- ✅ Tests de interacción con React Testing Library

---

## 🎯 Features Específicas de NexoScribe

### 17. Editor de Notas (Lexical)

- ✅ Usar en modo **'use client'**
- ✅ Plugins en archivos separados (`src/components/editor/plugins/`)
- ✅ Nodos personalizados en `src/components/editor/nodes/`
- ✅ Temas en `src/components/editor/themes/`

### 18. Kanban (Tareas)

- ✅ Drag & drop con biblioteca establecida (dnd-kit, react-beautiful-dnd)
- ✅ Optimistic updates al mover tareas
- ✅ Sincronizar con backend después de la acción

### 19. Whiteboards (Fabric.js)

- ✅ Usar en modo **'use client'**
- ✅ Lazy load para no impactar bundle size
- ✅ Guardar estado periódicamente (auto-save)

---

## 🚨 Manejo de Errores y UX

### 20. Feedback al Usuario

**SIEMPRE** dar feedback:
- ✅ **Loading states**: Spinners, skeletons
- ✅ **Success**: Toasts verde, confirmaciones
- ✅ **Errors**: Toasts rojos, mensajes descriptivos
- ✅ **Empty states**: Mensajes amigables con CTAs

```typescript
// ✅ CORRECTO
const { mutate, isPending } = useMutation({
  mutationFn: createNote,
  onSuccess: () => {
    toast.success('Nota creada exitosamente');
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  },
  onError: (error) => {
    toast.error(`Error: ${error.message}`);
  },
});

return (
  <Button onClick={() => mutate(data)} disabled={isPending}>
    {isPending ? 'Creando...' : 'Crear Nota'}
  </Button>
);
```

### 21. Validación de Forms

- ✅ Usar **React Hook Form** + **Zod**
- ✅ Validación en tiempo real cuando sea apropiado
- ✅ Mensajes de error claros y específicos
- ✅ Deshabilitar submit mientras haya errores

```typescript
// ✅ CORRECTO
const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  content: z.string().optional(),
});

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { title: '', content: '' },
});
```

---

## 🚫 Anti-Patrones (EVITAR)

### ❌ NO hacer:

1. **Fetch en Client Components sin caché**
   ```typescript
   // ❌ MAL
   'use client';
   export function Notes() {
     const [notes, setNotes] = useState([]);
     useEffect(() => {
       fetch('/api/notes').then(r => r.json()).then(setNotes);
     }, []);
   }
   
   // ✅ BIEN - Usar React Query/SWR
   const { data: notes } = useQuery({ queryKey: ['notes'], queryFn: fetchNotes });
   ```

2. **Olvidar x-org-id en requests**
   ```typescript
   // ❌ MAL
   fetch('/api/notes', { method: 'POST', body: JSON.stringify(data) });
   
   // ✅ BIEN
   fetch('/api/notes', {
     headers: { 'x-org-id': currentOrgId },
     body: JSON.stringify(data),
   });
   ```

3. **Crear componentes sin tipos**
   ```typescript
   // ❌ MAL
   export function Card({ title, children }) {
     return <div>...</div>;
   }
   
   // ✅ BIEN
   interface CardProps {
     title: string;
     children: React.ReactNode;
   }
   export function Card({ title, children }: CardProps) {
     return <div>...</div>;
   }
   ```

4. **No manejar estados de loading/error**
   ```typescript
   // ❌ MAL
   return <div>{data.map(...)}</div>;
   
   // ✅ BIEN
   if (isLoading) return <LoadingSkeleton />;
   if (error) return <ErrorMessage error={error} />;
   if (!data) return <EmptyState />;
   return <div>{data.map(...)}</div>;
   ```

---

## 📐 Estándares de Código

### 22. Naming Conventions

- **Componentes**: PascalCase (`NoteCard`, `TaskList`)
- **Hooks**: camelCase con prefijo `use` (`useNotes`, `useAuth`)
- **Utilidades**: camelCase (`formatDate`, `cn`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`, `MAX_TITLE_LENGTH`)
- **Archivos de componentes**: PascalCase (`NoteCard.tsx`)
- **Otros archivos**: kebab-case (`api-client.ts`, `use-notes.ts`)

### 23. Imports

Organizar en este orden:
```typescript
// 1. React y Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. Librerías externas
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// 3. Componentes UI
import { Button } from '@/components/ui/button';

// 4. Componentes locales
import { NoteCard } from '@/components/notes/NoteCard';

// 5. Utilidades y tipos
import { cn } from '@/lib/utils';
import type { Note } from '@/types/api';
```

---

## 🔄 Workflow de Desarrollo

### 24. Antes de Implementar

1. ✅ **Revisar** componentes existentes de shadcn/ui
2. ✅ **Verificar** tipos del backend (sincronizar si es necesario)
3. ✅ **Consultar** diseño o mockups si están disponibles
4. ✅ **Preguntar** al usuario sobre preferencias de UX

### 25. Durante la Implementación

1. ✅ Crear tipos e interfaces primero
2. ✅ Implementar componente base
3. ✅ Agregar states (loading, error, empty)
4. ✅ Integrar con API
5. ✅ Agregar validación y manejo de errores
6. ✅ Pulir UI y responsive

### 26. Antes de Finalizar

- ✅ Resolver TODOS los warnings de ESLint
- ✅ Verificar que no hay errores de TypeScript
- ✅ Probar en diferentes tamaños de pantalla
- ✅ Verificar estados de loading/error/empty
- ✅ Verificar accesibilidad básica (keyboard navigation, aria-labels)

---

## ♿ Accesibilidad

### 27. Básicos de A11y

- ✅ Usar elementos semánticos (`<button>`, `<nav>`, `<main>`)
- ✅ Labels para inputs (`<label htmlFor="">`)
- ✅ Alt text para imágenes
- ✅ Navegación por teclado funcional
- ✅ Contraste de colores adecuado
- ✅ ARIA labels cuando sea necesario

```typescript
// ✅ CORRECTO
<button
  onClick={handleDelete}
  aria-label="Eliminar nota"
  className="icon-button"
>
  <TrashIcon />
</button>

// ❌ INCORRECTO
<div onClick={handleDelete}>
  <TrashIcon />
</div>
```

---

## 🌍 Comunicación

### 28. Idioma

- ✅ **Español**: UI, mensajes al usuario, documentación
- ✅ **Inglés**: Código, nombres de variables, tipos

### 29. Textos de UI

- ✅ Usar mensajes claros y amigables
- ✅ Evitar jerga técnica innecesaria
- ✅ Dar contexto en mensajes de error

```typescript
// ✅ CORRECTO
toast.error('No se pudo crear la nota. Por favor, intenta de nuevo.');

// ❌ INCORRECTO
toast.error('Error 500: Internal Server Error');
```

---

## 🎯 Prioridades

En orden de importancia:
1. **Funcionalidad** (que funcione correctamente)
2. **UX** (feedback, loading states, mensajes claros)
3. **Tipos** (TypeScript sin any)
4. **Linting** (sin warnings)
5. **Responsive** (móvil y desktop)
6. **Accesibilidad** (básica)
7. **Performance** (solo optimizar si es necesario)

---

## 📞 Cuando Tengas Dudas

**SIEMPRE preguntar antes de:**
- Introducir nuevas librerías
- Cambiar el sistema de diseño establecido
- Modificar estructura de rutas de Next.js
- Refactorizar componentes funcionales sin instrucción
- Cambiar patrones de estado global

---

**Última actualización:** 2026-02-13  
**Versión:** 1.0
