'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Unregister any existing service workers first
      navigator.serviceWorker.getRegistrations().then(() => {
        // Verificar registros existentes si es necesario
      })

      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registrado:', registration.scope)
          
          // Verificar si hay actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nuevo Service Worker disponible')
                  // Opcional: mostrar notificación al usuario para actualizar
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Error registrando Service Worker:', error)
        })
    }
  }, [])

  return null
}

