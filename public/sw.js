// Quran (tasbee) web: offline cache (pages, and the mushaf fonts once opened).
const VERSION = 'tasbee-web-1';
const STATIC = 'tasbee-static';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  // drop the caches of the old web version
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== STATIC).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    e.respondWith(caches.open(STATIC).then(async (c) => { const hit = await c.match(req); if (hit) return hit; try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; } catch (err) { return hit || Response.error(); } }));
    return;
  }
  
  // hashed bundles and assets never change: cache first
  if (url.pathname.includes('/_expo/') || url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(STATIC).then(async (c) => { const hit = await c.match(req); if (hit) return hit; const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }));
    return;
  }
  // the page itself: network first, cache when offline
  e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
    .catch(() => caches.match(req).then((r) => r || caches.match(self.registration.scope))));
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'قرآن (تسبيع)', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'قرآن (تسبيع)', {
    body: d.body || '', tag: d.id || 'tasbee', lang: 'ar', dir: 'rtl',
    icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', data: { url: d.url || '/' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(target).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(target);
  }));
});
