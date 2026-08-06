export const MANIFEST = JSON.stringify({
  name: 'Producción inteligente',
  short_name: 'Producción',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#0f172a',
  description: 'PWA de producción inteligente con Cloudflare Workers, D1 y R2.',
  icons: [
    {
      src: '/icon.svg',
      sizes: '192x192',
      type: 'image/svg+xml',
    },
  ],
});

export const SERVICE_WORKER = `const CACHE_NAME = "produccion-inteligente-v1";
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => cachedResponse || fetch(request))
  );
});`;

export const ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" ry="32" fill="#0F172A" />
  <circle cx="96" cy="96" r="62" fill="#38BDF8" />
  <text x="96" y="118" font-size="84" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">P</text>
</svg>`;
