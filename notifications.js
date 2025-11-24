// نظام الإشعارات المتكامل
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// طلب إذن الإشعارات وحفظ التوكن
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('❌ المستخدم رفض الإشعارات');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY'
    });

    if (token) {
      await saveTokenToDatabase(token);
      console.log('✅ تم حفظ توكن الإشعارات:', token);
      return token;
    }
  } catch (err) {
    console.error('❌ خطأ في طلب الإشعارات:', err);
    return null;
  }
}

// حفظ التوكن في قاعدة البيانات
async function saveTokenToDatabase(token) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      fcm_token: token,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
}

// استقبال الإشعارات عندما التطبيق مفتوح
onMessage(messaging, (payload) => {
  const { title, body, icon } = payload.notification;
  
  showInAppNotification(title, body, icon);
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/lv12.jpg',
      badge: '/lv12.jpg',
      vibrate: [200, 100, 200]
    });
  }
});

// عرض إشعار داخل التطبيق
function showInAppNotification(title, body, icon) {
  const container = document.getElementById('notificationContainer') || createNotificationContainer();
  
  const notif = document.createElement('div');
  notif.className = 'notification-item animate-slide-in';
  notif.innerHTML = `
    <div class="flex items-start gap-3 bg-white rounded-xl shadow-lg p-4 mb-3 border-r-4 border-blue-500">
      <img src="${icon || '/lv12.jpg'}" class="w-12 h-12 rounded-full object-cover" />
      <div class="flex-1">
        <h4 class="font-bold text-gray-800 text-sm">${title}</h4>
        <p class="text-gray-600 text-xs mt-1">${body}</p>
      </div>
      <button onclick="this.closest('.notification-item').remove()" 
              class="text-gray-400 hover:text-red-500">✕</button>
    </div>
  `;
  
  container.appendChild(notif);
  setTimeout(() => notif.remove(), 8000);
}

function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notificationContainer';
  container.className = 'fixed top-20 left-4 right-4 z-50 max-w-md mx-auto';
  document.body.appendChild(container);
  return container;
}

// الاشتراك في الإشعارات الفورية من Supabase
export function subscribeToNotifications(userId) {
  const channel = supabase
    .channel('user-notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      const notif = payload.new;
      showInAppNotification(notif.title, notif.body, notif.icon);
    })
    .subscribe();

  return channel;
}

// إرسال إشعار لمستخدم معين
export async function sendNotification(userId, title, body, data = {}) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      data: JSON.stringify(data),
      type: data.type || 'general',
      read: false,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ فشل إرسال الإشعار:', err);
  }
}

// جلب الإشعارات غير المقروءة
export async function getUnreadNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ فشل جلب الإشعارات:', err);
    return [];
  }

  return data || [];
}

// تحديث حالة الإشعار إلى مقروء
export async function markAsRead(notificationId) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
}
