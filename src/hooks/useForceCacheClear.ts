import { useEffect, useRef } from 'react';
import { APP_VERSION, BUILD_TIMESTAMP } from '@/config/version';
import { setStoredVersion } from '@/config/version';
import { supabase } from '@/integrations/supabase/client';

const RELOAD_KEY = 'cache-reload-done';

/**
 * Hook that checks the server-side build version on mount.
 * If the local build is stale, forces a clean reload.
 * Also cleans up Service Workers and browser caches.
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

    // Remote version check — compare server version with local build
    checkRemoteVersion();
  }, []);

  const checkRemoteVersion = async () => {
    try {
      // Anti-loop: only reload once per session
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (alreadyReloaded) {
        console.log('🔒 Already reloaded this session, skipping remote version check');
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-app-version', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (error) {
        console.warn('⚠️ Could not check remote version:', error.message);
        return;
      }

      const serverVersion = data?.version;
      const localVersion = String(BUILD_TIMESTAMP);

      console.log(`🔍 Version check — local: ${localVersion}, server: ${serverVersion}`);

      if (serverVersion && serverVersion !== '0' && serverVersion !== localVersion) {
        console.log('🚀 New version detected! Forcing clean reload...');
        
        // Mark that we already reloaded to prevent infinite loop
        sessionStorage.setItem(RELOAD_KEY, '1');

        // Clear all caches before reload
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }

        // Force browser to bypass cache — location.replace works better on Safari/iOS
        const url = new URL(window.location.href);
        url.searchParams.set('_cb', String(Date.now()));
        window.location.replace(url.toString());
        return;
      }

      // If versions match, update server with our version (for first deploy / manual updates)
      if (serverVersion === '0') {
        console.log('📤 Registering build version on server...');
        await supabase.functions.invoke('get-app-version', {
          method: 'POST',
          body: { version: localVersion },
        });
      }
    } catch (err) {
      console.warn('⚠️ Remote version check failed:', err);
    }
  };

  return { version: APP_VERSION };
};
