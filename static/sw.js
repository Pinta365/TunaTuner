// TunaTuner service worker — runtime cache-first, so the tuner works offline
// once it has been opened online (app shell, island JS/CSS, and the web
// fonts are all cached on first visit). Registered only in production builds
// by client.ts. Bump CACHE when changing this file to retire stale caches.
const CACHE = "tunatuner-v1";

async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    // Cache same-origin 200s and opaque cross-origin responses (web fonts).
    if (response && (response.status === 200 || response.type === "opaque")) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      // Serve cache immediately; refresh the entry in the background.
      fetchAndCache(request).catch(() => {});
      return cached;
    }
    return fetchAndCache(request);
  })());
});
