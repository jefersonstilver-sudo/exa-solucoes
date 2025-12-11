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
        console.log('🔄 New version detected, clearing caches...');
        
        // Show toast while clearing
        toast.loading('Atualizando aplicação...', { id: 'cache-clear' });
        
        const success = await clearAllCaches();
        
        if (success) {
          // Store new version BEFORE reload
          setStoredVersion();
          
          toast.success('Aplicação atualizada!', { 
            id: 'cache-clear',
            duration: 1500 
          });
          
          // Small delay then reload to apply changes
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error('Erro ao atualizar. Recarregue manualmente.', {
            id: 'cache-clear'
          });
        }
      } else {
        // First visit or same version - just ensure version is stored
        setStoredVersion();
        console.log('✅ Version up to date');
      }
    };

    checkAndClear();
  }, []);

  return { version: APP_VERSION };
};
