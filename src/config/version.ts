// Auto-generated version based on build timestamp
export const APP_VERSION = '1.0.0';
export const BUILD_TIMESTAMP = Date.now();
export const VERSION_KEY = 'app-version';

export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_KEY);
};

export const setStoredVersion = () => {
  localStorage.setItem(VERSION_KEY, APP_VERSION);
};

export const hasVersionChanged = () => {
  const stored = getStoredVersion();
  return stored !== null && stored !== APP_VERSION;
};

export const clearVersionedCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => !name.includes(APP_VERSION));
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    
    console.log(`🧹 Cleared ${oldCaches.length} old caches`);
  }
};
