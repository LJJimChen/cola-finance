const VERSION = "v1";
const STATIC_CACHE = `cola-static-${VERSION}`;
const RUNTIME_CACHE = `cola-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/portfolio",
  "/analysis",
  "/family",
  "/settings",
  "/login",
  "/manifest.webmanifest",
  "/globe.svg",
  "/window.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_URLS);
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
          .filter((key) => key.startsWith("cola-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(request) {
  return (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, res.clone());
          return res;
        } catch {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          return (await caches.match("/")) || new Response("Offline", { status: 503 });
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        const res = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, res.clone());
        return res;
      })(),
    );
    return;
  }

  const url = new URL(request.url);
  const isApiLike =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/notifications") ||
    url.pathname.startsWith("/accounts") ||
    url.pathname.startsWith("/groups");

  if (isApiLike) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => {
            cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);

        if (cached) {
          void fetchPromise;
          return cached;
        }

        const res = await fetchPromise;
        if (res) {
          return res;
        }
        return new Response(JSON.stringify({ ok: false, offline: true }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })(),
    );
  }
});
