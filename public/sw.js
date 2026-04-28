/* Cadê meu dinheiro? - Service Worker
   - Cache somente assets estáticos
   - Navegação autenticada: network-first sem salvar página em cache
   - Offline fallback para quando a rede falhar
*/
const CACHE_VERSION = "cmd-v2";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll([
        OFFLINE_URL,
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/icon-192-maskable.png",
        "/icons/icon-512-maskable.png",
        "/icons/apple-touch-icon.png",
      ]);
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.includes(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (!isSameOrigin(url)) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch (err) {
          return await caches.match(OFFLINE_URL);
        }
      })(),
    );
    return;
  }

  if (["style", "script", "image", "font"].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;

        const response = await fetch(req);
        if (response && response.ok) cache.put(req, response.clone());
        return response;
      })(),
    );
  }
});
