// Service worker for the installed web app: app files load from cache first (works offline),
// fonts are cached the first time they load. Bump VERSION whenever app files change.
const VERSION = 'mli-v3.5.0';
const FILES = ['./', 'index.html', 'app.css', 'fonts.css', 'mini-view.js', 'core.js', 'strings.js', 'audio.js', 'app.js', 'calendar.js', 'planner.js', 'game.js', 'notes.js', 'sport.js',
  'juice.js', 'focusplus.js', 'economy.js', 'companion.js', 'legal.js', 'config.js', 'sync.js', 'main.js',
  'site.webmanifest', 'icon32.png', 'icon192.png', 'icon512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
