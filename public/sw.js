// Service worker mínimo para a Infonte.
// Estratégia: cache-first para estáticos da própria origem, network-first
// para tudo o resto.

const CACHE = "infonte-v1";
const PRE_CACHE = [
  "/",
  "/manifest.webmanifest",
  "/favicon-192.png",
  "/favicon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRE_CACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Não cachear API, auth, ou navegação dinâmica
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const r = await fetch(req);
          if (r.ok) cache.put(req, r.clone());
          return r;
        } catch {
          return hit ?? Response.error();
        }
      })
    );
    return;
  }

  // navegação: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const r = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, r.clone());
          return r;
        } catch {
          const cache = await caches.open(CACHE);
          const hit = await cache.match(req);
          return hit ?? cache.match("/") ?? Response.error();
        }
      })()
    );
  }
});
