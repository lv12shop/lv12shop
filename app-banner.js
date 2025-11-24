// App download banner functionality
document.addEventListener('DOMContentLoaded', () => {
  const dismissBtn = document.getElementById('dismissAppBanner');
  const banner = document.getElementById('appDownloadBanner');
  
  dismissBtn?.addEventListener('click', () => {
    banner.style.display = 'none';
    localStorage.setItem('appBannerDismissed', 'true');
  });
  
  // Hide banner if previously dismissed
  if (localStorage.getItem('appBannerDismissed') === 'true') {
    banner.style.display = 'none';
  }
});

// PWA install functionality
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('✅ Service Worker registered for PWA');
  });
}