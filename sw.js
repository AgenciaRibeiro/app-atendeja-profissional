const CACHE_NAME = "atendeja-pwa-v5";
const SHELL_ASSETS = [
  "./dashboard.html",
  "./dashboard.css",
  "./dashboard.js",
  "./dashboard-auth.js",
  "./dashboard-cloud-state.js",
  "./checkout.html",
  "./checkout.js",
  "./index.html",
  "./styles.css",
  "./config.js",
  "./icon.svg",
  "./manifest.webmanifest"
];
const SHELL_URLS = new Set(SHELL_ASSETS.map((asset) => new URL(asset, self.location.href).pathname));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache authenticated API data or the private admin surface.
  if (url.pathname.startsWith("/api/") || url.pathname === "/admin.html" || url.pathname.startsWith("/admin.")) return;
  if (event.request.headers.has("Authorization") || !SHELL_URLS.has(url.pathname)) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
