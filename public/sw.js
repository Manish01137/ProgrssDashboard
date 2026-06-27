// Minimal service worker — enables "Add to Home Screen" installability and a
// basic offline shell. App data is fetched live from Supabase when online.
const CACHE = "warroom-v1";
const APP_SHELL = ["/", "/stats", "/projects", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never cache API calls or Supabase/auth traffic — always go to network.
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("/auth/") ||
    request.url.includes("supabase")
  ) {
    return;
  }

  // Network-first for navigations, falling back to cache when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
