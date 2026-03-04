import { useEffect, useRef } from 'react';
import { APP_VERSION, setStoredVersion } from '@/config/version';

/**
 * Hook that logs the current version on mount.
 * SW/cache cleanup is now handled by inline script in index.html.
 */
export const useForceCacheClear = () => {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    setStoredVersion();
    console.log(`✅ App version: ${APP_VERSION}`);
  }, []);

  return { version: APP_VERSION };
};
