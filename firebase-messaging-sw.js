importScripts('https://unpkg.com/@supabase/supabase-js@2');

const SUPABASE_URL = "https://nszhzfysitppxssplqfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zemh6ZnlzaXRwcHhzc3BscWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzA4OTcsImV4cCI6MjA3MzgwNjg5N30.5KvK4bhqkZ_GpIfED4qecIMfeubAJYwSFJslULwOp-w";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function sendNotification(title, body, data = {}) {
  return self.registration.showNotification(title, {
    body: body,
    icon: '/lv12.jpg',
    badge: '/lv12.jpg',
    data: data,
    vibrate: [200, 100, 200],
    tag: 'lv12-notification',
    requireInteraction: true,
    actions: [{ action: 'open', title: 'فتح' }]
  });
}

setInterval(async () => {
  try {
    const { data: products } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (products && products.length > 0) {
      const lastCheck = await self.caches.match('last_product_check');
      const productTime = new Date(products[0].created_at).getTime();
      
      if (!lastCheck || productTime > parseInt(await lastCheck.text())) {
        sendNotification('منتج جديد!', `تم إضافة: ${products[0].name}`);
        const cache = await caches.open('notifications');
        await cache.put('last_product_check', new Response(Date.now().toString()));
      }
    }
  } catch (error) {
    console.log('Product check failed:', error);
  }
}, 60000); 

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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SEND_NOTIFICATION') {
    sendNotification(event.data.title, event.data.body, event.data.data);
  }
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});
