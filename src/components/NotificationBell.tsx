'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { notificationApi, type Notification } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { subscribeToPushNotifications, checkNotificationPermission } from '@/utils/pushNotifications'
import { toast } from 'sonner'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.getNotifications(undefined, 20)
      setNotifications(response.notifications)
      setUnreadCount(response.unreadCount)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }, [])

  useEffect(() => {
    // Cargar notificaciones solo al montar el componente (una vez)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNotifications()
    
    // Variables para cleanup
    let subscribeTimeout: NodeJS.Timeout | null = null
    let handleMessage: ((event: MessageEvent) => void) | null = null
    let handleFocus: (() => void) | null = null
    let handleBlur: (() => void) | null = null
    
    // Verificar estado de permisos
    checkNotificationPermission().then(status => {
      setPermissionStatus(status)
      
      // Solo intentar suscribirse si los permisos ya están otorgados
      if (status === 'granted') {
        // Esperar un poco antes de intentar suscribirse (para asegurar que el SW esté listo)
        subscribeTimeout = setTimeout(() => {
          subscribeToPushNotifications().then(success => {
            if (success) {
              console.log('Push notifications activadas')
            }
          })
        }, 2000) // Esperar 2 segundos
      }
    })
    
    // Escuchar eventos de push (cuando llega una notificación push)
    if ('serviceWorker' in navigator) {
      handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
          loadNotifications() // Recargar cuando llega una push
        }
      }
      
      navigator.serviceWorker.addEventListener('message', handleMessage)
    }
    
    // Recargar cuando la ventana recibe foco (usuario vuelve a la pestaña)
    handleFocus = () => {
      // Solo recargar si la página estuvo oculta por más de 1 minuto
      const lastFocusTime = localStorage.getItem('lastFocusTime')
      const now = Date.now()
      
      if (!lastFocusTime || (now - parseInt(lastFocusTime)) > 60000) {
        loadNotifications()
      }
      
      localStorage.setItem('lastFocusTime', now.toString())
    }
    
    window.addEventListener('focus', handleFocus)
    
    // Guardar tiempo cuando la página pierde foco
    handleBlur = () => {
      localStorage.setItem('lastFocusTime', Date.now().toString())
    }
    
    window.addEventListener('blur', handleBlur)

    // Cleanup function
    return () => {
      if (subscribeTimeout) {
        clearTimeout(subscribeTimeout)
      }
      if (handleMessage && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
      if (handleFocus) {
        window.removeEventListener('focus', handleFocus)
      }
      if (handleBlur) {
        window.removeEventListener('blur', handleBlur)
      }
    }
  }, [loadNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      loadNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      toast.success('Todas las notificaciones marcadas como leídas')
      loadNotifications()
    } catch {
      toast.error('Error al marcar como leídas')
    }
  }

  const handleEnableNotifications = async () => {
    const success = await subscribeToPushNotifications()
    if (success) {
      toast.success('Notificaciones activadas')
      setPermissionStatus('granted')
    } else {
      toast.error('No se pudieron activar las notificaciones. Verifica los permisos del navegador.')
      checkNotificationPermission().then(setPermissionStatus)
    }
  }

  const getNotificationUrl = (notif: Notification) => {
    if (notif.relatedEntityType === 'task') {
      return `/tasks?task=${notif.relatedEntityId}`
    }
    return '/tasks'
  }

  return (
    <DropdownMenu 
      open={isDropdownOpen} 
      onOpenChange={(open) => {
        setIsDropdownOpen(open)
        if (open) {
          // Solo cargar cuando el usuario abre la campana
          void loadNotifications()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {permissionStatus === 'default' && (
            <div className="p-4 border-b bg-muted/50">
              <p className="text-sm mb-2">Activa las notificaciones para recibir alertas en tiempo real</p>
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                className="w-full"
              >
                Activar Notificaciones
              </Button>
            </div>
          )}
          {permissionStatus === 'denied' && (
            <div className="p-4 border-b bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.
              </p>
            </div>
          )}
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No hay notificaciones
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <Link
                  key={notif._id}
                  href={getNotificationUrl(notif)}
                  className={`block p-4 hover:bg-accent transition-colors ${
                    !notif.read ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                      !notif.read ? 'bg-primary' : 'bg-transparent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: es
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

