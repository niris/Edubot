const cacheName = "edubot-2022-09-30";
self.addEventListener('install', (event) => event.waitUntil((async () => {
  await [...await caches.keys()].map(id => caches.delete(id));
  const dirs = [
    '/static/',
    '/media/md/',
    '/media/audio/',
    '/media/icons/',
    // '/media/img' // TODO
  ];
  const urls = [
    '/media/md/',
  ];
  const jsons = await Promise.all(dirs.map(dir => fetch(dir).then(r => r.json())));
  const paths = jsons.map((files, i) => files.map(file => dirs[i] + file.name)).flat();

  const cache = await caches.open(cacheName);
  cache.addAll(paths);
  console.log(`${paths.length} files cached`)
})()));
//self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith((async () => {
  const cache = await caches.open(cacheName);
  return cache.match(event.request);
})()));
onmessage = (e) => {
  console.log('got', e);
  postMessage("ok");
}