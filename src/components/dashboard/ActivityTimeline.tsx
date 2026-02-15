'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { DashboardActivityItem } from '@/lib/api'

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function getActivityLabel(item: DashboardActivityItem): string {
  switch (item.type) {
    case 'task_created':
      return `creó la tarea "${item.entityTitle}"`
    case 'project_created':
      return `creó el proyecto "${item.entityTitle}"`
    case 'note_created':
      return `creó la nota "${item.entityTitle}"`
    case 'comment_added':
      return `comentó en la tarea "${item.entityTitle}"`
    case 'whiteboard_created':
      return `creó la pizarra "${item.entityTitle}"`
    case 'profile_updated':
      return 'actualizó su foto de perfil'
    default:
      return `acción en "${item.entityTitle}"`
  }
}

interface ActivityTimelineProps {
  items: DashboardActivityItem[]
  isLoading?: boolean
  className?: string
}

export function ActivityTimeline({ items, isLoading = false, className }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-label="Cargando actividad">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-10 text-center',
          className
        )}
        role="status"
      >
        <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
      </div>
    )
  }

  return (
    <div
      className={cn('relative pl-6', className)}
      role="list"
      aria-label="Actividad reciente"
    >
      <div
        className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border/60 rounded-full"
        aria-hidden
      />
      <ul className="space-y-0">
        {items.map((item, index) => (
          <li
            key={`${item.type}-${item.id}-${index}`}
            className="relative flex gap-3 pb-4 last:pb-0"
            role="listitem"
          >
            <div
              className={cn(
                'absolute left-[-24px] top-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm overflow-hidden'
              )}
            >
              <Avatar className="h-full w-full">
                {item.actorAvatarUrl && <AvatarImage src={item.actorAvatarUrl} alt={item.actorName} />}
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold h-full w-full">
                  {item.actorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <Card className="flex-1 border-border/30 bg-background/50 px-4 py-3 shadow-none">
              <p className="text-xs text-foreground">
                <span className="font-semibold">{item.actorName}</span>{' '}
                {getActivityLabel(item)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatRelativeTime(item.createdAt)}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
