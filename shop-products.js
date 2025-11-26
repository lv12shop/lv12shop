// تحميل وعرض المنتجات بشكل محسّن
if (typeof window.allProducts === 'undefined') window.allProducts = [];
if (typeof window.client === 'undefined') window.client = supabase;

async function loadProducts() {
  if (window.allProducts.length > 0) return;
  try {
    const { data, error } = await window.client
      .from('products')
      .select(`
        id, name, price, discount_price, discount_start, discount_end,
        category, stock, views, created_at,
        product_images(image_url, is_primary, ordering)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    window.allProducts = data.map(p => {
      const imgs = (p.product_images || []).sort((a,b) => (a.ordering||0) - (b.ordering||0));
      const mainImg = imgs.find(i => i.is_primary)?.image_url || imgs[0]?.image_url || '/lv12.png';
      
      const discountActive = p.discount_price && 
        p.discount_start && p.discount_end &&
        new Date(p.discount_start) <= now && 
        new Date(p.discount_end) >= now;

      return { ...p, mainImg, discountActive };
    });

    renderAllSections(window.allProducts);
  } catch (err) {
    console.error('❌ خطأ في تحميل المنتجات:', err);
  }
}

function renderProductCard(p) {
  const price = p.discount_price || p.price;
  const hasDiscount = p.discount_price && p.discount_price < p.price;
  const discountPercent = hasDiscount ? Math.round(((p.price - p.discount_price) / p.price) * 100) : 0;
  
  return `
    <div class="product-card-modern" onclick="location.href='product.html?id=${p.id}'">
      ${hasDiscount ? `<div class="discount-badge">-${discountPercent}%</div>` : ''}
      <img src="${p.mainImg}" alt="${escapeHtml(p.name)}" loading="lazy" style="width:100%!important;height:140px!important;object-fit:contain!important;padding:8px!important;background:#f9fafb!important">
      <div class="p-3">
        <h3 class="font-bold text-gray-800 text-sm mb-1 truncate">${escapeHtml(p.name)}</h3>
        <div class="flex items-center gap-2">
          <span class="text-blue-700 font-bold text-sm">${price} ج.م</span>
          ${hasDiscount ? `<span class="line-through text-gray-400 text-xs">${p.price}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderAllSections(products) {
  renderCategories(products);
  renderTodayDeals(products);
  renderDiscounts(products);
  renderAllProducts(products);
  renderPriceSections(products);
}

function renderCategories(products) {
  const bar = document.getElementById('categoriesBar');
  const container = document.getElementById('categorySections');
  if (!bar || !container) return;

  const groups = {};
  products.forEach(p => {
    const cat = (p.category || 'غير مصنف').trim();
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  bar.innerHTML = Object.keys(groups).map(cat => `
    <div class="category-item" onclick="goToCategory('${encodeURIComponent(cat)}')">${cat}</div>
  `).join('');

  container.innerHTML = Object.keys(groups).map(cat => `
    <section class="bg-white p-4 rounded-3xl shadow-md mb-6">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-bold text-xl text-blue-900">${cat}</h2>
        <button class="text-blue-600 text-sm font-semibold hover:underline" 
                onclick="goToCategory('${encodeURIComponent(cat)}')">عرض الكل →</button>
      </div>
      <div class="flex gap-3 overflow-x-auto snap-x pb-2 hide-scrollbar">
        ${groups[cat].slice(0, 10).map(p => `
          <div class="min-w-[150px] bg-white rounded-xl border p-2 shadow-sm hover:shadow-md transition cursor-pointer snap-center"
               onclick="location.href='product.html?id=${p.id}'">
            <img src="${p.mainImg}" style="width:100%;height:120px;object-fit:contain;padding:8px;background:#f9fafb" class="rounded-lg mb-1">
            <p class="text-sm font-semibold text-gray-800 truncate">${escapeHtml(p.name)}</p>
            <p class="text-xs text-blue-600 font-bold mt-1">${p.discount_price || p.price} ج.م</p>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function renderTodayDeals(products) {
  const container = document.getElementById('todayDealsCarousel');
  if (!container) return;

  const now = new Date();
  const today = new Date().toDateString();
  const deals = products.filter(p => 
    new Date(p.created_at).toDateString() === today
  ).slice(0, 10);

  if (!deals.length) {
    container.innerHTML = '<p class="text-white/80 text-sm">لا توجد منتجات جديدة اليوم</p>';
    return;
  }

  container.innerHTML = deals.map(p => `
    <div class="min-w-[150px] bg-white/10 backdrop-blur-sm rounded-xl p-2 cursor-pointer hover:bg-white/20 transition snap-center"
         onclick="location.href='product.html?id=${p.id}'">
      <img src="${p.mainImg}" style="width:100%;height:120px;object-fit:contain;padding:8px;background:rgba(255,255,255,0.05)" class="rounded-lg mb-1">
      <p class="text-white text-sm font-semibold truncate">${escapeHtml(p.name)}</p>
      <p class="text-yellow-300 text-xs font-bold">${p.discount_price || p.price} ج.م</p>
    </div>
  `).join('');
}

function renderDiscounts(products) {
  const container = document.getElementById('discountsGrid');
  if (!container) return;

  const discounted = products.filter(p => p.discountActive).slice(0, 8);
  
  if (!discounted.length) {
    container.innerHTML = '<p class="col-span-full text-white/80 text-sm text-center py-4">لا توجد خصومات حالياً</p>';
    return;
  }

  container.innerHTML = discounted.map(p => renderProductCard(p)).join('');
}

function renderAllProducts(products) {
  const container = document.getElementById('allProductsGrid');
  if (!container) return;
  container.innerHTML = products.slice(0, 20).map(p => renderProductCard(p)).join('');
}

function renderPriceSections(products) {
  const under100 = products.filter(p => (p.discount_price || p.price) <= 100);
  const under200 = products.filter(p => {
    const price = p.discount_price || p.price;
    return price > 100 && price <= 200;
  });

  const c1 = document.getElementById('under100');
  const c2 = document.getElementById('under200');
  
  if (c1) c1.innerHTML = under100.slice(0, 8).map(p => renderProductCard(p)).join('');
  if (c2) c2.innerHTML = under200.slice(0, 8).map(p => renderProductCard(p)).join('');
}

function goToCategory(cat) {
  window.location.href = `category.html?name=${cat}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProducts);
} else {
  loadProducts();
}
