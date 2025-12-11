// Dynamic versioning based on build timestamp - injected by Vite
declare const __BUILD_TIMESTAMP__: number;

// Use injected timestamp or fallback to runtime Date.now()
export const BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' 
  ? __BUILD_TIMESTAMP__ 
  : Date.now();

// Version is now build-based, not static
export const APP_VERSION = `2.0.${BUILD_TIMESTAMP}`;
export const VERSION_KEY = 'app-version';
export const CACHE_CLEAR_KEY = 'cache-cleared-at';

export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_KEY);
};

export const setStoredVersion = () => {
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  localStorage.setItem(CACHE_CLEAR_KEY, String(Date.now()));
};

export const hasVersionChanged = () => {
  const stored = getStoredVersion();
  // If no stored version, it's first visit - no update needed
  if (stored === null) return false;
  // If stored version differs, update is needed
  return stored !== APP_VERSION;
};

// Force clear ALL caches - aggressive cleanup
export const clearAllCaches = async () => {
  try {
    // 1. Clear Service Worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`🧹 Cleared ${cacheNames.length} SW caches`);
    }

    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log(`🧹 Unregistered ${registrations.length} service workers`);
    }

    // 3. Clear localStorage cache keys (keep auth)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('query'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keysToRemove.length} localStorage cache keys`);

    // 4. Clear sessionStorage
    sessionStorage.clear();
    console.log('🧹 Cleared sessionStorage');

    return true;
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    return false;
  }
};

// Legacy function for backward compatibility
export const clearVersionedCaches = clearAllCaches;
