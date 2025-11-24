# تحويل LV12 Shop إلى تطبيق هاتف

## الطريقة الأولى: Apache Cordova

### المتطلبات:
1. تثبيت Node.js
2. تثبيت Android Studio
3. تثبيت Java JDK

### الخطوات:
```bash
# 1. تثبيت Cordova
npm install -g cordova

# 2. تشغيل ملف البناء
build-app.bat

# 3. APK سيكون في:
# lv12-mobile\platforms\android\app\build\outputs\apk\debug\app-debug.apk
```

## الطريقة الثانية: PWA Builder (Microsoft)

### الخطوات:
1. اذهب إلى: https://www.pwabuilder.com
2. أدخل رابط موقعك: https://lv12shop.shop
3. اضغط "Start"
4. اختر "Android" 
5. حمل APK

## الطريقة الثالثة: Capacitor (الأحدث)

```bash
# 1. تثبيت Capacitor
npm install @capacitor/core @capacitor/cli

# 2. إنشاء مشروع
npx cap init "LV12 Shop" "com.lv12shop.app"

# 3. إضافة Android
npx cap add android

# 4. نسخ الملفات
npx cap copy

# 5. فتح في Android Studio
npx cap open android
```

## الطريقة الرابعة: React Native (للمطورين المتقدمين)

```bash
# 1. تثبيت React Native CLI
npm install -g react-native-cli

# 2. إنشاء مشروع جديد
react-native init LV12Shop

# 3. تحويل HTML/CSS إلى React Native components
```

## أسهل طريقة للمبتدئين:

### استخدام PWA Builder:
1. ارفع موقعك على الإنترنت
2. اذهب لـ pwabuilder.com
3. أدخل رابط الموقع
4. حمل APK جاهز

### أو استخدام Cordova:
1. شغل `build-app.bat`
2. انتظر انتهاء البناء
3. APK جاهز للتثبيت

## ملاحظات مهمة:
- تأكد من وجود manifest.json
- تأكد من وجود service worker
- اختبر التطبيق على هاتف حقيقي
- وقع APK قبل النشر على Google Play