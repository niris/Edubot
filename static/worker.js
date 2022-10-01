
const cacheName = "edubot-2022-09-30";
console.log("activating...");
//TODO: split into cache-first and online-first
const fetchFirst = [
  '/',
  '/static/*',
];
const cacheFirst = [
  '/media/md/',
  '/media/md/*',
  '/media/icons/*',
  '/media/audio/*',
  '/media/img/*',
];
function chunk(array, size = 50) {
  return (new Array(Math.ceil(array.length / size))).fill().map((c, i) => array.slice(i * size, (i + 1) * size));
}
async function sync(kind) {
  const cache = await caches.open(cacheName);
  const chunks = chunk(await walk(kind));
  console.log('sync', chunks);
  for (let c in chunks) {
    await cache.addAll(chunks[c]);
    send({ bot: `${(100 * c / chunks.length).toPrecision(2)}%` });
  }
}
async function keep(except) {
  (await caches.keys()).filter(key => key != except).forEach(key => caches.delete(key))
}
/* convert glob urls into flat urls :
[/index.html, /static/*] => [/index.html, /static/a.css, /static/b.js ...]
*/
function walk(urls, query = `?sw=${+new Date}`) {
  const globs = urls.filter(dir => dir.endsWith('*')).map(dir => dir.slice(0, -1));
  const files = urls.filter(dir => !dir.endsWith('*')).map(dir => dir += query);
  return Promise.all(globs.map(dir => fetch(dir).then(r => r.json())))
    .then(lists => [...files, ...lists.map((files, i) => files.map(file => globs[i] + file.name + query)).flat()])
}

/* Called at worker activation
- claim ourselves as fetch handler (don't waiting for the next page load)
- flush older cache
- fill current cache
*/
self.addEventListener('activate', event => event.waitUntil(async () => {
  console.log("activating...");
  await clients.claim();
  await keep(cacheName);
}));
self.addEventListener('install', (event) => event.waitUntil(async () => {
  console.log("installing... ?");
}));

/* Called at PWA ressource fetching : be online-first since the user may not have yet installed us */
self.addEventListener("fetch", (event) => event.respondWith((async () => {
  const cachedResponse = event.request.method == "GET" ? await caches.match(event.request, { ignoreSearch: true }) : null;
  console.log(`${event.request.method} ${event.request.url} => ${cachedResponse ? 'cache' : 'online'}`)
  if (cachedResponse) return cachedResponse;
  return fetch(event.request);//.catch((e) => caches.match(event.request))
})()));

function send(msg) {
  console.log('send', msg);
  self.clients.matchAll().then(clients => clients.map(client => client.postMessage(msg)))
};
onmessage = async function (event) {
  if (event.data.action === 'install') {
    await keep("nothing");
    await sync(fetchFirst);
    await sync(cacheFirst);
    send({ bot: 'Ready for Offline' });
  }else if (event.data.action === 'remove') {
    await keep("nothing");
    send({ bot: 'All clean !' });
  }
};