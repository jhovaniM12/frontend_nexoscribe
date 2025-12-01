// Service Worker para push notifications

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data?.json() || {};
    } catch {
        data = { title: 'NexoScribe', body: 'Nueva notificación' };
    }
    
    const options = {
        body: data.body,
        icon: data.icon || '/logo_nexoScribe.svg',
        badge: data.badge || '/logo_nexoScribe.svg',
        data: data.data || {},
        tag: data.data?.taskId || 'notification',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        actions: data.data?.url ? [
            {
                action: 'open',
                title: 'Ver',
                icon: '/logo_nexoScribe.svg'
            }
        ] : []
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(data.title || 'NexoScribe', options),
            // Notificar a todos los clientes abiertos
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'NOTIFICATION_RECEIVED',
                        data: data
                    });
                });
            })
        ])
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        const url = event.notification.data?.url || '/tasks';
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});

