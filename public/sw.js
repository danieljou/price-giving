/* Minimal service worker: enables installability and speeds up repeat visits.
   Only immutable Next.js build assets are cached (they are content-hashed, so
   they can never go stale). Everything else — pages, Supabase API calls —
   always goes to the network so data is never outdated. */

const STATIC_CACHE = "static-assets-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isImmutableAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/"));

  if (event.request.method !== "GET" || !isImmutableAsset) {
    return; // network as usual
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) {
        cache.put(event.request, response.clone());
      }
      return response;
    })()
  );
});
