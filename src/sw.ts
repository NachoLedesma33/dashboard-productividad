import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

export {}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; message?: string } = {}
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch {
    if (event.data) {
      data = { title: 'En Ritmo', body: event.data.text() }
    }
  }

  const title = data.title || 'En Ritmo'
  const body = data.message || data.body || ''

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'push-' + Date.now(),
      renotify: true,
      data: { url: self.location.origin + '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || self.location.origin + '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
