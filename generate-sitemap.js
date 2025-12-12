// 🚀 مولد خريطة الموقع التلقائي لأرشفة Google
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
  try {
    console.log('🔄 بدء توليد خريطة الموقع...');
    
    // جلب جميع المنتجات
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, name, created_at, updated_at,
        product_images(image_url, is_primary)
      `)
      .order('id', { ascending: true });

    if (error) throw error;

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- الصفحة الرئيسية -->
  <url>
    <loc>https://www.lv12shop.shop/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- صفحة المتجر -->
  <url>
    <loc>https://www.lv12shop.shop/shop.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // إضافة كل منتج للخريطة
    products.forEach(product => {
      const lastmod = product.updated_at || product.created_at;
      const productImages = product.product_images || [];
      const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
      
      sitemap += `
  <!-- المنتج رقم ${product.id}: ${product.name} -->
  <url>
    <loc>https://www.lv12shop.shop/product.html?id=${product.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
      
      // إضافة صور المنتج للأرشفة
      if (primaryImage) {
        sitemap += `
    <image:image>
      <image:loc>${primaryImage.image_url}</image:loc>
      <image:title>${product.name}</image:title>
      <image:caption>منتج ${product.name} من متجر LV12</image:caption>
    </image:image>`;
      }
      
      sitemap += `
  </url>`;
    });

    sitemap += `
</urlset>`;

    // حفظ الملف
    fs.writeFileSync('sitemap.xml', sitemap);
    console.log(`✅ تم إنشاء خريطة الموقع بنجاح! (${products.length} منتج)`);
    
    // إنشاء ملف robots.txt
    const robotsTxt = `User-agent: *
Allow: /

# خريطة الموقع
Sitemap: https://www.lv12shop.shop/sitemap.xml

# منع أرشفة الملفات الحساسة
Disallow: /admin/
Disallow: /api/
Disallow: /*.js$
Disallow: /*.css$
`;
    
    fs.writeFileSync('robots.txt', robotsTxt);
    console.log('✅ تم إنشاء ملف robots.txt');

  } catch (error) {
    console.error('❌ خطأ في توليد خريطة الموقع:', error);
  }
}

// تشغيل المولد
generateSitemap();

// تشغيل تلقائي كل 6 ساعات
setInterval(generateSitemap, 6 * 60 * 60 * 1000);