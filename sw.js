
const CACHE_NAME = "lv12-cache-v1";
const APP_FILES = [
  "/",                    
  "/index.html",
  "/shop.html",
  "/product.html",
  "/cart.html",
  "/manifest.json",
  "/lv12-192.png",
  "/lv12-512.png",
  "/lv12.ico",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
];

self.addEventListener("install", (event) => {
  console.log("🧩 Service Worker: التثبيت قيد التنفيذ...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ تم تخزين الملفات في الكاش");
      return cache.addAll(APP_FILES);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 حذف الكاش القديم:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.url.includes("supabase.co")) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          if (request.destination === "document") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
