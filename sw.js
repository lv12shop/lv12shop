

const CACHE_NAME = "lv12-cache-v3";
const APP_FILES = [
  "/",                    
  "/index.html",
  "/shop.html",
  "/product.html",
  "/cart.html",
  "/offline.html",
  "/manifest.json",
  "/lv12.ico",
  "/lv12-192.png",
  "/lv12-512.png",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
];


self.addEventListener("install", event => {
  console.log("🧩 Service Worker: التثبيت...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("✅ تم حفظ الملفات في الكاش");
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});


self.addEventListener("activate", event => {
  console.log("♻️ تفعيل الـ Service Worker الجديد...");
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("🧹 حذف الكاش القديم:", key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});


self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.url.includes("supabase.co")) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          return caches.open(CACHE_NAME).then(cache => {
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

self.addEventListener("push", event => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "🛍️ إشعار من متجر LV12";
  const options = {
    body: data.message || "عروض جديدة بانتظارك!",
    icon: "/lv12-192.png",
    badge: "/lv12-192.png",
    data: data.url || "https://www.lv12shop.shop/",
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || "/"));
});


self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    console.log("⚡ تحديث النسخة الحالية من Service Worker");
    self.skipWaiting();
  }
});
