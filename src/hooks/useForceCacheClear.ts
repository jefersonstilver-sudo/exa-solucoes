import { useEffect, useRef } from 'react';
import { APP_VERSION, setStoredVersion } from '@/config/version';

/**
 * Hook that logs the current version on mount.
 * Also actively cleans up any lingering Service Workers and stale session flags.
 */
export const useForceCacheClear = () => {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    setStoredVersion();
    console.log(`✅ App version: ${APP_VERSION}`);

    // Active SW cleanup on every mount
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
        if (regs.length > 0) console.log(`🧹 Unregistered ${regs.length} stale Service Workers`);
      });
    }

    // Clear stale sessionStorage flags from old PWA builds
    try {
      const keysToRemove = ['sw-registered', 'pwa-installed', 'cache-version'];
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (_) {}

    // Clear browser caches (fetch/API cache)
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((n) => caches.delete(n));
        if (names.length > 0) console.log(`🧹 Cleared ${names.length} browser caches`);
      });
    }
  }, []);

  return { version: APP_VERSION };
};
