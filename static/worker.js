const cacheList = ["/"]; // add more if needed
const cacheName = "edubot-2022-08";
self.addEventListener('install', event => {
  event.waitUntil((async () => (await caches.open(CACHE_NAME)).addAll(['/']))());
});
//self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    try {
      const fetchResponse = await fetch(event.request);
      cache.put(event.request, fetchResponse.clone());
      return fetchResponse;
    } catch (e) {
      return await cache.match(event.request);
    }
  })());
});
self.addEventListener('fetch', e => e.respondWith(caches.open(cacheName).then(cache => cache.match(e.request)).then(response => (e.request.cache !== 'only-if-cached' || e.request.mode === 'same-origin') ? (response || fetch(e.request)) : response)));
