// TunaTuner service worker. Strategy:
//   • page navigations  → network-first with a timeout: a fresh build wins
//     when online; a slow or absent network falls back to the cached page.
//   • everything else (hashed JS/CSS, fonts, icons) → cache-first, since those
//     are immutable per content hash or rarely change.
// Once visited online the tuner works fully offline. Registered only in
// production builds by client.ts. Bump CACHE to force-retire stale caches.
const CACHE = "tunatuner-v1";

// How long to wait for the live page before falling back to the cached copy.
const NAV_TIMEOUT_MS = 5000;

// Cache-first fetch for sub-resources; also refreshes the cached entry.
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

// Network-first for page navigations: serve the live page if the network
// answers within NAV_TIMEOUT_MS, else fall back to the cached page. A slow
// fetch still completes in the background and refreshes the cache.
async function navResponse(request) {
  const cache = await caches.open(CACHE);

  const fromNetwork = fetch(request).then((response) => {
    if (response.status === 200) cache.put(request, response.clone());
    return response;
  });
  fromNetwork.catch(() => {}); // a timed-out fetch must not throw unhandled

  const winner = await Promise.race([
    fromNetwork.catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), NAV_TIMEOUT_MS)),
  ]);
  if (winner) return winner; // network beat the timeout

  // Too slow, or offline — serve the cached page.
  const cached = await cache.match(request) ?? await cache.match("/");
  if (cached) return cached;
  return await fromNetwork; // nothing cached at all — wait for the network
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

  // Page loads / reloads: network-first so a live build wins when online.
  if (request.mode === "navigate") {
    event.respondWith(navResponse(request));
    return;
  }

  // Sub-resources: serve cache immediately, refresh it in the background.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      fetchAndCache(request).catch(() => {});
      return cached;
    }
    return fetchAndCache(request);
  })());
});
