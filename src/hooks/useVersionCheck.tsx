import { useEffect } from 'react';
import { APP_VERSION, hasVersionChanged, setStoredVersion } from '@/config/version';

export const useVersionCheck = () => {
  useEffect(() => {
    if (hasVersionChanged()) {
      console.log('🔄 New version detected, storing...');
      setStoredVersion();
    } else {
      setStoredVersion();
    }
  }, []);

  return {
    needsUpdate: false,
    currentVersion: APP_VERSION,
    handleUpdate: () => window.location.reload(),
  };
};
