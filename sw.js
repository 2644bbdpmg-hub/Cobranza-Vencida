/* Service worker · Seguimiento Cobranza Vencida
   Estrategia "stale-while-revalidate": muestra la copia guardada al instante y
   descarga la nueva en segundo plano, así se actualiza sola sin cambiar versión.
   Funciona offline con la última versión abierta. */
const CACHE = 'cobranza-vencida-v1';
const CORE = ['./', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable.png',
  './apple-touch-icon.png', './favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()).catch(()=>{}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await network) || cache.match('./index.html');
  })());
});
