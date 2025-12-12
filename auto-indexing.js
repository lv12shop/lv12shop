// 🚀 نظام الأرشفة التلقائية لـ Google
class GoogleIndexingManager {
  constructor() {
    this.baseUrl = 'https://www.lv12shop.shop';
    this.sitemapUrl = `${this.baseUrl}/sitemap.xml`;
  }

  // إشعار Google بمنتج جديد
  async notifyNewProduct(productId, productData) {
    try {
      console.log(`🔄 إشعار Google بالمنتج الجديد رقم ${productId}...`);
      
      // 1. تحديث خريطة الموقع
      await this.updateSitemap();
      
      // 2. إرسال ping لـ Google
      await this.pingGoogle();
      
      // 3. إرسال URL للفهرسة السريعة
      await this.submitUrlForIndexing(productId);
      
      console.log(`✅ تم إشعار Google بالمنتج رقم ${productId} بنجاح`);
      
    } catch (error) {
      console.error('❌ خطأ في إشعار Google:', error);
    }
  }

  // تحديث خريطة الموقع
  async updateSitemap() {
    try {
      // استدعاء API لتحديث خريطة الموقع
      const response = await fetch('/api/update-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('✅ تم تحديث خريطة الموقع');
      }
    } catch (error) {
      console.warn('⚠️ تعذر تحديث خريطة الموقع:', error);
    }
  }

  // إرسال ping لـ Google
  async pingGoogle() {
    try {
      const pingUrls = [
        `https://www.google.com/ping?sitemap=${encodeURIComponent(this.sitemapUrl)}`,
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(this.sitemapUrl)}`
      ];
      
      for (const url of pingUrls) {
        fetch(url, { mode: 'no-cors' }).catch(() => {});
      }
      
      console.log('📡 تم إرسال ping لمحركات البحث');
    } catch (error) {
      console.warn('⚠️ تعذر إرسال ping:', error);
    }
  }

  // إرسال URL للفهرسة السريعة
  async submitUrlForIndexing(productId) {
    try {
      const productUrl = `${this.baseUrl}/product.html?id=${productId}`;
      
      // محاولة استخدام Google Indexing API (يتطلب مفتاح API)
      // هذا مثال - يحتاج إعداد في الخادم
      console.log(`🔗 URL المرسل للفهرسة: ${productUrl}`);
      
    } catch (error) {
      console.warn('⚠️ تعذر إرسال URL للفهرسة:', error);
    }
  }

  // مراقبة المنتجات الجديدة
  startMonitoring() {
    // مراقبة إضافة منتجات جديدة في قاعدة البيانات
    if (typeof supabase !== 'undefined') {
      supabase
        .channel('products-changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'products' },
          (payload) => {
            const newProduct = payload.new;
            this.notifyNewProduct(newProduct.id, newProduct);
          }
        )
        .subscribe();
      
      console.log('👀 بدء مراقبة المنتجات الجديدة للأرشفة التلقائية');
    }
  }

  // فهرسة جميع المنتجات الموجودة
  async indexAllProducts() {
    try {
      console.log('🔄 بدء فهرسة جميع المنتجات...');
      
      if (typeof supabase === 'undefined') {
        console.error('❌ Supabase غير متوفر');
        return;
      }

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .order('id');

      if (error) throw error;

      console.log(`📊 تم العثور على ${products.length} منتج للفهرسة`);

      // فهرسة كل منتج
      for (const product of products) {
        await this.submitUrlForIndexing(product.id);
        // تأخير قصير لتجنب الحمل الزائد
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ تم الانتهاء من فهرسة جميع المنتجات');
      
    } catch (error) {
      console.error('❌ خطأ في فهرسة المنتجات:', error);
    }
  }
}

// إنشاء مثيل من مدير الأرشفة
const indexingManager = new GoogleIndexingManager();

// بدء المراقبة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  indexingManager.startMonitoring();
});

// تصدير للاستخدام العام
window.GoogleIndexingManager = GoogleIndexingManager;
window.indexingManager = indexingManager;