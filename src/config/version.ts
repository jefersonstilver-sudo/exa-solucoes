// Dynamic versioning based on build timestamp - injected by Vite
declare const __BUILD_TIMESTAMP__: number;

// Use injected timestamp or fallback to runtime Date.now()
export const BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' 
  ? __BUILD_TIMESTAMP__ 
  : Date.now();

// Version is now build-based, not static - Major version bump to force cache clear
export const APP_VERSION = `5.0.${BUILD_TIMESTAMP}`;
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
  // Compare only major.minor prefix (e.g. "4.0") to avoid infinite reload loops
  // since BUILD_TIMESTAMP changes on every load in dev mode
  const storedPrefix = stored.split('.').slice(0, 2).join('.');
  const currentPrefix = APP_VERSION.split('.').slice(0, 2).join('.');
  return storedPrefix !== currentPrefix;
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
