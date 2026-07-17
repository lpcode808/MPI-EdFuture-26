const CACHE_NAME = "mpi-edfuture-26-v5";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./owl.js",
  "./storage.js",
  "./data/event.js",
  "./data/schedule.js",
  "./manifest.webmanifest",
  "./assets/brand/edfuturesummit-banner.webp",
  "./assets/fonts/press-start-2p-latin.woff2",
  "./assets/fonts/press-start-2p-latin-ext.woff2",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

// Stale-while-revalidate: cached shell answers instantly (and offline), while a
// background refetch picks up program corrections on the attendee's next visit.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  const refreshed = caches.open(CACHE_NAME).then((cache) =>
    fetch(event.request).then((response) => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
  event.waitUntil(refreshed.catch(() => {}));
  event.respondWith(caches.match(event.request).then((cached) => cached || refreshed));
});
