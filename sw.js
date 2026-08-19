const CACHE_NAME = 'fitcoach-v26'
const APP_SHELL = ['/manifest.webmanifest','/icon-192.png','/icon-512.png','/apple-touch-icon.png']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'FITCOACH_SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never serve cached HTML/navigation. This prevents a broken installed PWA
  // from being resurrected from an old app shell.
  if (request.mode === 'navigate' || url.pathname === '/index.html') {
    event.respondWith(fetch(request, { cache: 'no-store' }))
    return
  }

  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {})
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
