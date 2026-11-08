// WETTER.EXE – Offline-Cache
const V = 'wetter-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('open-meteo.com')) return;          // Wetterdaten immer live
  const own = url.origin === location.origin;
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!own && !font) return;
  // sofort aus dem Cache, im Hintergrund aktualisieren
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(req, {ignoreSearch: own});
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net; return r || (req.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
