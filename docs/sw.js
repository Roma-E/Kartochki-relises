// Офлайн-кэш для версии-сайта (iPhone / браузер)
const VER = 'dev-1794085086236';
const CORE = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/version.js', 'js/tex.js', 'js/core.js', 'js/pets.js', 'js/session.js', 'js/ui.js', 'js/screens.js', 'js/review.js', 'js/browse.js', 'js/editor.js', 'js/draw.js', 'js/native.js', 'js/api.js', 'js/share.js', 'js/main.js', 'vendor/tex-svg-full.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VER).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin) {
    // сначала сеть (чтобы обновления приходили сразу), без сети — кэш
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
  } else if (/fonts\.(googleapis|gstatic)\.com|cdnjs/.test(u.host)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(r2 => { const cp = r2.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r2; })));
  }
});
