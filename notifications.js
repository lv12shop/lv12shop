// نظام الإشعارات المحسن لمتجر LV12
const SUPABASE_URL = "https://nszhzfysitppxssplqfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zemh6ZnlzaXRwcHhzc3BscWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzA4OTcsImV4cCI6MjA3MzgwNjg5N30.5KvK4bhqkZ_GpIfED4qecIMfeubAJYwSFJslULwOp-w";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// إرسال إشعار مع صوت
function sendNotification(title, body, icon = '/lv12.png') {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  // صوت الإشعار
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  audio.volume = 0.3;
  audio.play().catch(() => {});
  
  const notification = new Notification(title, {
    body,
    icon,
    badge: icon,
    tag: 'lv12-shop',
    requireInteraction: false,
    silent: false
  });
  
  // إغلاق تلقائي بعد 5 ثوان
  setTimeout(() => notification.close(), 5000);
  
  return notification;
}

// تهيئة الإشعارات
async function initNotifications() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ تم تفعيل الإشعارات');
      sendNotification('مرحباً بك في LV12 Shop', 'تم تفعيل الإشعارات بنجاح!');
    }
  }
}

// الحصول على دور المستخدم
async function getUserRole() {
  try {
    const { data } = await client.auth.getSession();
    const user = data?.session?.user;
    if (!user) return null;
    
    const { data: profile } = await client
      .from('users')
      .select('role, is_merchant')
      .eq('id', user.id)
      .single();
    
    return {
      id: user.id,
      role: profile?.role || 'user',
      isMerchant: profile?.is_merchant || false
    };
  } catch (e) {
    console.error('getUserRole error', e);
    return null;
  }
}

// إرسال إشعار مستهدف
async function sendTargetedNotification(title, message, targetRole = null, targetUserId = null) {
  const userInfo = await getUserRole();
  if (!userInfo) return;
  
  if (targetUserId && userInfo.id === targetUserId) {
    sendNotification(title, message);
    return;
  }
  
  if (targetRole) {
    if (targetRole === 'merchant' && userInfo.isMerchant) {
      sendNotification(title, message);
    } else if (targetRole === 'admin' && userInfo.role === 'admin') {
      sendNotification(title, message);
    } else if (targetRole === 'user' && userInfo.role === 'user') {
      sendNotification(title, message);
    }
    return;
  }
  
  sendNotification(title, message);
}

// تهيئة الإشعارات الفورية
async function initRealtimeNotifications() {
  try {
    const { data: sessionData } = await client.auth.getSession();
    const currentUser = sessionData?.session?.user;
    const currentUserId = currentUser?.id;

    // منتجات جديدة
    client.channel('public:products')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, payload => {
        const p = payload.new;
        sendNotification(`🆕 منتج جديد: ${p.name}`, `سعر: ${Number(p.price||0).toFixed(0)} ج.م`);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, payload => {
        const p = payload.new;
        if (p.discount_price && p.discount_price < p.price) {
          sendNotification(`🔥 خصم على: ${p.name}`, `من ${p.price} إلى ${p.discount_price} ج.م`);
        }
      })
      .subscribe();

    // تحديثات المحفظة
    client.channel('public:wallet')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallet' }, payload => {
        const w = payload.new;
        if (currentUserId === w.user_id) {
          const oldBalance = Number(payload.old?.balance || 0);
          const newBalance = Number(w.balance || 0);
          const diff = newBalance - oldBalance;
          
          if (diff > 0) {
            sendNotification(`💰 تم إضافة ${diff.toFixed(2)} ج.م للمحفظة`, `الرصيد الجديد: ${newBalance.toFixed(2)} ج.م`);
          } else if (diff < 0) {
            sendNotification(`💸 تم خصم ${Math.abs(diff).toFixed(2)} ج.م من المحفظة`, `الرصيد الجديد: ${newBalance.toFixed(2)} ج.م`);
          }
        }
      })
      .subscribe();

    // طلبات جديدة للتجار
    client.channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async payload => {
        const o = payload.new;
        
        if (currentUserId) {
          const { data: orderItems } = await client
            .from('order_items')
            .select('product_id, products(seller_id)')
            .eq('order_id', o.id);
          
          const isMyOrder = orderItems?.some(item => item.products?.seller_id === currentUserId);
          if (isMyOrder) {
            sendNotification(`🛒 طلب جديد رقم ${o.id}`, `المبلغ: ${Number(o.total||0).toFixed(0)} ج.م`);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new;
        if (currentUserId === o.user_id) {
          const statusText = {
            'pending': 'في الانتظار',
            'confirmed': 'تم التأكيد',
            'shipped': 'تم الشحن',
            'delivered': 'تم التسليم',
            'cancelled': 'تم الإلغاء'
          };
          sendNotification(`📦 تحديث الطلب ${o.id}`, `الحالة: ${statusText[o.status] || o.status}`);
        }
      })
      .subscribe();

    // ردود على التقييمات
    client.channel('public:reviews')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, async payload => {
        const r = payload.new;
        if (r.parent_id && currentUserId) {
          const { data: parentReview } = await client
            .from('reviews')
            .select('user_id, product_id, products(name)')
            .eq('id', r.parent_id)
            .single();
          
          if (parentReview?.user_id === currentUserId) {
            sendNotification(`💬 رد على تقييمك`, `منتج: ${parentReview.products?.name}`);
          }
        }
      })
      .subscribe();

    // رسائل الدعم
    client.channel('public:support_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, payload => {
        const m = payload.new;
        if (currentUserId === m.user_id && m.is_admin_reply) {
          sendNotification(`📞 رد من الدعم الفني`, m.message?.substring(0, 50) + '...');
        }
      })
      .subscribe();

    console.log('✅ تم تفعيل الإشعارات الفورية');
  } catch (e) {
    console.error('initRealtimeNotifications error', e);
  }
}

// دوال الإشعارات المحددة
window.notifyWalletUpdate = (newBalance, oldBalance = 0) => {
  const diff = newBalance - oldBalance;
  if (diff > 0) {
    sendNotification(`💰 تم إضافة ${diff.toFixed(2)} ج.م للمحفظة`, `الرصيد الجديد: ${newBalance.toFixed(2)} ج.م`);
  } else if (diff < 0) {
    sendNotification(`💸 تم خصم ${Math.abs(diff).toFixed(2)} ج.م من المحفظة`, `الرصيد الجديد: ${newBalance.toFixed(2)} ج.م`);
  }
};

window.notifyNewProduct = (productName, price, category) => {
  sendNotification(`🆕 منتج جديد: ${productName}`, `السعر: ${price} ج.م - الفئة: ${category}`);
};

window.notifyReviewReply = (productName) => {
  sendNotification(`💬 رد على تقييمك`, `منتج: ${productName}`);
};

window.notifyMerchantOrder = (orderId, customerName, total) => {
  sendNotification(`🛒 طلب جديد من ${customerName}`, `رقم الطلب: ${orderId} - المبلغ: ${total} ج.م`);
};

window.notifyDiscount = (productName, oldPrice, newPrice) => {
  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  sendNotification(`🔥 خصم ${discount}% على ${productName}`, `من ${oldPrice} إلى ${newPrice} ج.م`);
};

window.notifySupportReply = (message) => {
  sendNotification(`📞 رد من الدعم الفني`, message.substring(0, 50) + '...');
};

// تصدير الدوال
window.sendNotification = sendNotification;
window.sendTargetedNotification = sendTargetedNotification;
window.initNotifications = initNotifications;
window.initRealtimeNotifications = initRealtimeNotifications;

// تهيئة تلقائية
document.addEventListener('DOMContentLoaded', async () => {
  await initNotifications();
  await initRealtimeNotifications();
});