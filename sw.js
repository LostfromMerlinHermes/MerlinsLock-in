// Service worker for the installed web app: app files load from cache first (works offline),
// fonts are cached the first time they load. Bump VERSION whenever app files change.
const VERSION = 'mli-v3.46.0';
const FILES = ['./', 'index.html', 'app.css', 'fonts.css', 'mini-view.js', 'core.js', 'strings.js', 'audio.js', 'app.js', 'calendar.js', 'planner.js', 'plan.js', 'game.js', 'mathml.js', 'notes.js', 'study.js', 'rooms.js', 'notehelp.js',
  'juice.js', 'washi.js', 'codex.js', 'cartouche.js', 'observatory.js', 'evening.js', 'sanctuary.js', 'abyss.js', 'netrunner.js', 'worlds.js', 'energy.js', 'sfx.js', 'focusplus.js', 'economy.js', 'companion.js', 'hood.js', 'nav.js', 'endscreen.js', 'legal.js', 'config.js', 'sync.js', 'restore.js', 'push.js', 'main.js',
  'world-aube.jpg', 'world-atelier.jpg', 'world-atelier-focus.jpg', 'world-atelier-pause.jpg', 'world-atelier-fin.jpg', 'world-tokyo.jpg', 'world-cartouche.jpg',
  'world-sanctuary.jpg', 'world-observatory.jpg', 'world-netrunner.jpg', 'world-arcade.jpg',
  'site.webmanifest', 'icon32.png', 'icon192.png', 'icon512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Timer-end notification sent by the Supabase function send-push (push.js schedules it)
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'MerlinsLockIN', {
    body: d.body || '', tag: d.tag || 'mli-timer', renotify: true, icon: 'icon192.png', badge: 'icon192.png', data: { url: './' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => 'focus' in c);
    return open ? open.focus() : self.clients.openWindow('./');
  }));
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
