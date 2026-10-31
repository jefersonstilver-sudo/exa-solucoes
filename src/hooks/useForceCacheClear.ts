import { useEffect, useRef } from 'react';
import { APP_VERSION, BUILD_TIMESTAMP } from '@/config/version';
import { setStoredVersion } from '@/config/version';
import { ROTAS_SEM_RECARGA } from '@/hooks/useVersionWatcher';

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
        // mantém só o /sw-exa.js (avisos no celular; não guarda cache de nada)
        regs.forEach((r) => {
          const w = r.active || r.waiting || r.installing;
          if (!w || !/\/sw-exa\.js(\?|$)/.test(w.scriptURL)) r.unregister();
        });
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
      // páginas de link único (senha, confirmação) não recarregam sozinhas: perderiam o token do link
      if (ROTAS_SEM_RECARGA.test(window.location.pathname)) return;

      // Anti-loop: only reload once per session
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (alreadyReloaded) {
        console.log('🔒 Already reloaded this session, skipping remote version check');
        return;
      }

      // versão publicada junto com o site (/version.json, mesma origem). A get-app-version estava parada
      // em abril/2026 e fazia o app recarregar em toda abertura.
      let data: any = null;
      try {
        const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return;
        data = await r.json();
      } catch {
        return; // sem version.json (ambiente local) ou rede: não recarrega
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
        url.searchParams.delete('_v');
        url.searchParams.set('_cb', String(Date.now()));
        window.location.replace(url.toString());
        return;
      }

    } catch (err) {
      console.warn('⚠️ Remote version check failed:', err);
    }
  };

  return { version: APP_VERSION };
};
