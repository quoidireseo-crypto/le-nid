// Le Nid — service worker
// Rôle Phase 0 : rendre l'appli installable (PWA) et fonctionnelle hors-ligne
// pour la coquille de l'app. Les gestionnaires push/notificationclick sont déjà
// en place pour la Phase 2 (vraies notifications push serveur).

const CACHE = 'le-nid-shell-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icone.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  // Navigation : réseau d'abord (contenu frais), coquille en cache si hors-ligne.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')))
  }
})

// ——— Prêt pour la Phase 2 : vrai push serveur ———
self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = {} }
  const titre = d.titre || 'Le Nid'
  e.waitUntil(
    self.registration.showNotification(titre, {
      body: d.corps || '',
      icon: '/icone.svg',
      badge: '/icone.svg',
      data: d,
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const ouvert = clients.find((c) => 'focus' in c)
      return ouvert ? ouvert.focus() : self.clients.openWindow('/')
    })
  )
})
