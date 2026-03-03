import { useEffect, useRef } from 'react';
import { 
  APP_VERSION, 
  hasVersionChanged, 
  clearAllCaches, 
  setStoredVersion 
} from '@/config/version';
import { toast } from 'sonner';

/**
 * Hook that forces cache clearing when a new version is detected
 * Runs once on app mount and handles the update seamlessly
 */
export const useForceCacheClear = () => {
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once per app lifecycle
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAndClear = async () => {
      console.log(`🔍 Checking version: ${APP_VERSION}`);
      
      if (hasVersionChanged()) {
        console.log('🔄 New version detected, clearing caches silently...');
        await clearAllCaches();
        setStoredVersion();
        console.log('✅ Caches cleared, version stored');
      } else {
        setStoredVersion();
        console.log('✅ Version up to date');
      }
    };

    checkAndClear();
  }, []);

  return { version: APP_VERSION };
};
