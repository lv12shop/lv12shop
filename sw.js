const CACHE_NAME = 'lv12-shop-v1';
const SUPABASE_URL = "https://nszhzfysitppxssplqfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zemh6ZnlzaXRwcHhzc3BscWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzA4OTcsImV4cCI6MjA3MzgwNjg5N30.5KvK4bhqkZ_GpIfED4qecIMfeubAJYwSFJslULwOp-w";

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Send notification
function sendNotification(title, body, data = {}) {
  return self.registration.showNotification(title, {
    body: body,
    icon: '/lv12.png',
    badge: '/lv12.png',
    data: data,
    vibrate: [200, 100, 200],
    tag: 'lv12-notification',
    requireInteraction: true,
    actions: [{ action: 'open', title: 'فتح' }]
  });
}

// Check for new products every 30 seconds
setInterval(async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const products = await response.json();
    
    if (products && products.length > 0) {
      const cache = await caches.open('notifications');
      const lastCheckResponse = await cache.match('last_product_check');
      const lastCheck = lastCheckResponse ? await lastCheckResponse.text() : '0';
      const productTime = new Date(products[0].created_at).getTime();
      
      if (productTime > parseInt(lastCheck)) {
        await sendNotification(
          '🆕 منتج جديد!', 
          `تم إضافة: ${products[0].name}`,
          { url: `/product.html?id=${products[0].id}` }
        );
        await cache.put('last_product_check', new Response(Date.now().toString()));
      }
    }
  } catch (error) {
    console.log('Product check failed:', error);
  }
}, 30000);

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/shop.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('lv12') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SEND_NOTIFICATION') {
    sendNotification(event.data.title, event.data.body, event.data.data);
  }
});