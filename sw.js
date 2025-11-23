self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(clients.matchAll({ type: 'window' }).then( windowClients => {
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});

self.addEventListener('push', function(event) {
  // Not implemented server-side here; keep handler for future push support
  let data = {};
  try { data = event.data.json(); } catch(e){}
  const title = data.title || 'LV12 - إشعار جديد';
  const options = {
    body: data.body || '',
    icon: data.icon || '/lv12.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});