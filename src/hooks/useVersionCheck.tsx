import { useEffect, useState } from 'react';
import { APP_VERSION, hasVersionChanged, setStoredVersion, clearVersionedCaches } from '@/config/version';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const useVersionCheck = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    const checkVersion = () => {
      if (hasVersionChanged()) {
        setNeedsUpdate(true);
        
        toast.info(
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Nova versão disponível!</p>
            <p className="text-sm text-muted-foreground">Clique para atualizar e ver as melhorias</p>
          </div>,
          {
            duration: Infinity,
            action: {
              label: 'Atualizar Agora',
              onClick: handleUpdate,
            },
          }
        );
      } else {
        setStoredVersion();
      }
    };

    checkVersion();
  }, []);

  const handleUpdate = async () => {
    try {
      toast.loading('Atualizando aplicação...');
      
      // Limpar caches antigos
      await clearVersionedCaches();
      
      // Atualizar service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
      
      // Salvar nova versão
      setStoredVersion();
      
      // Recarregar página
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar. Tente recarregar a página manualmente.');
    }
  };

  return {
    needsUpdate,
    currentVersion: APP_VERSION,
    handleUpdate,
  };
};
