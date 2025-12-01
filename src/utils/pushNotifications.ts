'use client'

import { notificationApi } from '@/lib/api'

// Verificar estado de permisos
export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

// Solicitar permisos de notificaciones
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones')
    return false
  }

  // Si ya tenemos permisos, retornar true
  if (Notification.permission === 'granted') {
    return true
  }

  // Si fue denegado previamente, no podemos solicitar de nuevo
  if (Notification.permission === 'denied') {
    console.warn('Permisos de notificación denegados previamente')
    return false
  }

  // Solicitar permisos
  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error solicitando permisos:', error)
    return false
  }
}

export async function subscribeToPushNotifications(): Promise<boolean> {
  try {
    // Verificar soporte
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications no soportadas en este navegador')
      return false
    }

    // Verificar y solicitar permisos primero
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      console.warn('No se otorgaron permisos para notificaciones')
      return false
    }

    // Esperar a que el service worker esté listo
    let registration: ServiceWorkerRegistration
    try {
      registration = await navigator.serviceWorker.ready
    } catch (error) {
      console.error('Error esperando service worker:', error)
      // Intentar registrar el service worker si no está registrado
      registration = await navigator.serviceWorker.register('/sw.js')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar un poco
    }
    
    // Verificar si ya hay una suscripción
    let existingSubscription: PushSubscription | null = null
    try {
      existingSubscription = await registration.pushManager.getSubscription()
    } catch (error) {
      console.error('Error obteniendo suscripción existente:', error)
    }
    
    // Si ya hay suscripción, no hacer nada más (evitar peticiones innecesarias)
    if (existingSubscription) {
      return true
    }
    
    // Obtener VAPID public key de variable de entorno (no requiere petición HTTP)
    let publicKey: string | undefined = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    
    // Fallback: obtener del backend solo si no está en variables de entorno
    if (!publicKey) {
      try {
        const response = await notificationApi.getVapidPublicKey()
        publicKey = response.publicKey
      } catch (error) {
        console.error('No se pudo obtener la clave pública VAPID:', error)
        return false
      }
    }
    
    if (!publicKey) {
      console.error('La clave pública VAPID está vacía')
      return false
    }

    // Convertir VAPID key a Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey)

    // Suscribirse (esto requiere permisos ya otorgados)
    let subscription: PushSubscription
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      })
    } catch (error: unknown) {
      const errorWithName = error as Error & { name?: string }
      if (errorWithName.name === 'NotAllowedError') {
        console.warn('Permisos de notificación no otorgados o revocados')
        return false
      }
      throw error
    }

    // Enviar suscripción al backend
    try {
      await notificationApi.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      })
    } catch (error) {
      console.error('Error guardando suscripción en el backend:', error)
      // Aún así, la suscripción local existe, así que retornamos true
    }

    console.log('Suscripción a push notifications exitosa')
    return true
  } catch (error: unknown) {
    console.error('Error suscribiéndose a push notifications:', error)
    const errorWithName = error as Error & { name?: string }
    if (errorWithName.name === 'NotAllowedError') {
      console.warn('Permisos denegados por el usuario')
    }
    return false
  }
}

// Helper: convertir base64 URL a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Helper: convertir ArrayBuffer a base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(byte => binary += String.fromCharCode(byte))
  return btoa(binary)
}

