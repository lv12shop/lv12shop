// Supabase Configuration
const SUPABASE_URL = "https://nszhzfysitppxssplqfb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zemh6ZnlzaXRwcHhzc3BscWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzA4OTcsImV4cCI6MjA3MzgwNjg5N30.5KvK4bhqkZ_GpIfED4qecIMfeubAJYwSFJslULwOp-w";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper Functions
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

function calculateDiscount(oldPrice, newPrice) {
  if (!oldPrice || !newPrice || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

function isToday(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

// Product Card Template
function createProductCard(product) {
  const img = product.product_images?.find(i => i.is_primary)?.image_url || 
              product.product_images?.[0]?.image_url || 
              '/placeholder.png';
  
  const discount = calculateDiscount(product.old_price, product.price);
  const isNew = isToday(product.created_at);
  
  return `
    <div class="product-card-modern" onclick="window.location.href='product.html?id=${product.id}'">
      <div class="relative overflow-hidden">
        <img src="${img}" alt="${escapeHtml(product.name)}" loading="lazy">
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        ${isNew ? `<div class="new-badge">جديد</div>` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-title">${escapeHtml(product.name)}</h3>
        <div class="product-price">
          <span class="price-current">${Number(product.price || 0).toFixed(0)} ج.م</span>
          ${product.old_price && product.old_price > product.price ? 
            `<span class="price-old">${Number(product.old_price).toFixed(0)} ج.م</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Load Today's Deals (Products created today)
async function loadTodayDeals() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, old_price, created_at, product_images(image_url, is_primary)')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const container = document.getElementById('todayDealsCarousel');
    if (error || !products || products.length === 0) {
      document.getElementById('todayDeals').style.display = 'none';
      return;
    }

    container.innerHTML = products.map(p => {
      const img = p.product_images?.find(i => i.is_primary)?.image_url || 
                  p.product_images?.[0]?.image_url || '/placeholder.png';
      const discount = calculateDiscount(p.old_price, p.price);
      
      return `
        <div class="min-w-[140px] sm:min-w-[180px] carousel-item cursor-pointer" onclick="window.location.href='product.html?id=${p.id}'">
          <div class="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div class="relative">
              <img src="${img}" class="w-full h-32 sm:h-40 object-cover" alt="${escapeHtml(p.name)}">
              ${discount > 0 ? `<div class="absolute top-1 right-1 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">-${discount}%</div>` : ''}
              <div class="absolute top-1 left-1 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">جديد</div>
            </div>
            <div class="p-2 sm:p-3">
              <h3 class="text-xs sm:text-sm font-bold text-gray-800 mb-1 line-clamp-2">${escapeHtml(p.name)}</h3>
              <div class="flex items-center gap-1 sm:gap-2">
                <span class="text-sm sm:text-lg font-black text-orange-600">${Number(p.price || 0).toFixed(0)} ج.م</span>
                ${p.old_price && p.old_price > p.price ? 
                  `<span class="text-xs text-gray-400 line-through">${Number(p.old_price).toFixed(0)} ج.م</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('loadTodayDeals error:', e);
  }
}

// Load Discounted Products
async function loadDiscounts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, old_price, created_at, product_images(image_url, is_primary)')
      .not('old_price', 'is', null)
      .gt('old_price', 0)
      .order('created_at', { ascending: false })
      .limit(10);

    const container = document.getElementById('discountsGrid');
    if (error || !products || products.length === 0) {
      document.getElementById('discountsSection').style.display = 'none';
      return;
    }

    // Filter products that actually have discounts
    const discountedProducts = products.filter(p => p.old_price > p.price);
    
    if (discountedProducts.length === 0) {
      document.getElementById('discountsSection').style.display = 'none';
      return;
    }

    container.innerHTML = discountedProducts.map(createProductCard).join('');
  } catch (e) {
    console.error('loadDiscounts error:', e);
  }
}

// Load Categories
async function loadCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, image_url')
      .order('name');

    if (error || !categories) return;

    const container = document.getElementById('categoriesBar');
    container.innerHTML = categories.map(cat => `
      <div class="category-item" onclick="window.location.href='category.html?id=${cat.id}'">
        ${escapeHtml(cat.name)}
      </div>
    `).join('');
  } catch (e) {
    console.error('loadCategories error:', e);
  }
}

// Load All Products
async function loadAllProducts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, old_price, created_at, product_images(image_url, is_primary)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !products) return;

    const container = document.getElementById('allProductsGrid');
    container.innerHTML = products.map(createProductCard).join('');
  } catch (e) {
    console.error('loadAllProducts error:', e);
  }
}

// Load Products Under Price
async function loadProductsUnderPrice(maxPrice, containerId, wrapperId) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, old_price, created_at, product_images(image_url, is_primary)')
      .lt('price', maxPrice)
      .order('price', { ascending: true })
      .limit(10);

    if (error || !products || products.length === 0) {
      document.getElementById(wrapperId).style.display = 'none';
      return;
    }

    const container = document.getElementById(containerId);
    container.innerHTML = products.map(createProductCard).join('');
  } catch (e) {
    console.error(`loadProductsUnderPrice ${maxPrice} error:`, e);
  }
}

// Load Interest Products (Random)
async function loadInterestProducts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, old_price, created_at, product_images(image_url, is_primary)')
      .order('visits', { ascending: false })
      .limit(10);

    if (error || !products || products.length === 0) {
      document.getElementById('interestWrapper').style.display = 'none';
      return;
    }

    const container = document.getElementById('interestProducts');
    container.innerHTML = products.map(createProductCard).join('');
  } catch (e) {
    console.error('loadInterestProducts error:', e);
  }
}

// Initialize All
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadCategories(),
    loadTodayDeals(),
    loadDiscounts(),
    loadAllProducts(),
    loadProductsUnderPrice(100, 'under100', 'under100Wrapper'),
    loadProductsUnderPrice(200, 'under200', 'under200Wrapper'),
    loadInterestProducts()
  ]);
});
