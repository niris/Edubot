
const cacheName = "edubot-2022-09-30";
//TODO: split into cache-first and online-first
const basicUrls = [
  '/',
  '/static/*',
];
const mediaUrls = [
  '/media/md/',
  '/media/md/*',
  '/media/icons/*',
  '/media/audio/*',
  // '/media/img' // TODO
];
function chunk(array, size = 50) {
  return (new Array(Math.ceil(array.length / size))).fill().map((c, i) => array.slice(i * size, (i + 1) * size));
}
async function sync(kind) {
  const cache = await caches.open(cacheName);
  const chunks = chunk(await walk(kind));
  console.log('sync', chunks);
  for (let chunk of chunks)
    await cache.addAll(chunk);
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
  await clients.claim();
  console.log("activating...");
  await keep(cacheName);
  await sync(basicUrls);
  await sync(mediaUrls);
}));
self.addEventListener('install', (event) => event.waitUntil(async () => {
  console.log("installing...");
  await sync(basicUrls);
  await sync(mediaUrls);
}));

/* Called at PWA ressource fetching : be online-first since the user may not have yet installed us */
self.addEventListener("fetch", (event) => event.respondWith((async () => {
  const cachedResponse = event.request.method == "GET" ? await caches.match(event.request, { ignoreSearch: true }) : null;
  console.log(`${event.request.method} ${event.request.url} => ${cachedResponse?'cache':'online'}`)
  if (cachedResponse) return cachedResponse;
  return fetch(event.request);//.catch((e) => caches.match(event.request))
})()));
function send(msg) {
  console.log('send', msg);
  self.clients.matchAll().then(all => all.map(client => client.postMessage(msg)))
};
onmessage = function (event) {
  console.log(event, self, this);
  if (event.data.action === 'basic') return sync(basicUrls).then(() => send({ info: 'Done' }));
  if (event.data.action === 'media') return sync(mediaUrls).then(() => send({ info: 'Done' }));
  if (event.data.action === 'flush') return keep("nothing").then(() => send({ info: 'Done' }));
  if (event.data.action === 'reload') return keep("nothing").then(() => sync(basicUrls).then(() => sync(mediaUrls))).then(() => send({ info: 'Done' }));
  console.log("unhandled", event.data);
};