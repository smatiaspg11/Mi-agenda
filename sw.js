var CACHE = 'mi-agenda-v2';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

// Responde con lo guardado y actualiza en segundo plano, así la app abre rápido y sin internet.
// Las visitas a la página (incluidos los atajos con ?accion=) usan siempre index.html.
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  var nav = req.mode === 'navigate';
  e.respondWith(
    (nav ? caches.match('index.html') : caches.match(req)).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(nav ? 'index.html' : req, copy); });
        }
        return res;
      }).catch(function () { return cached || caches.match('index.html'); });
      return cached || net;
    })
  );
});
