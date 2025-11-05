import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface TrackingData {
  page: string;
  timeSpent: number;
  buildingId?: string;
  videoId?: string;
  watchDuration?: number;
  completed?: boolean;
}

export const useClientBehaviorTracking = () => {
  const location = useLocation();
  const [sessionId] = useState(() => uuidv4());
  const [userId, setUserId] = useState<string | null>(null);
  const pageStartTime = useRef<number>(Date.now());
  const trackingQueue = useRef<any[]>([]);
  const isProcessing = useRef(false);

  // Detectar tipo de dispositivo
  const getDeviceType = (): string => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  // Buscar usuário autenticado
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Processar fila de tracking
  const processQueue = async () => {
    if (isProcessing.current || trackingQueue.current.length === 0 || !userId) {
      return;
    }

    isProcessing.current = true;

    while (trackingQueue.current.length > 0) {
      const event = trackingQueue.current.shift();
      
      try {
        await supabase.functions.invoke('track-client-behavior', {
          body: {
            user_id: userId,
            session_id: sessionId,
            event_type: event.type,
            data: {
              ...event.data,
              device_type: getDeviceType(),
            },
          },
        });
        console.log('✅ Tracking event sent:', event.type);
      } catch (error) {
        console.error('❌ Error tracking event:', error);
      }
    }

    isProcessing.current = false;
  };

  // Adicionar evento à fila
  const queueEvent = (type: string, data: any) => {
    trackingQueue.current.push({ type, data });
    processQueue();
  };

  // Rastrear mudança de página
  useEffect(() => {
    const currentTime = Date.now();
    const timeSpent = Math.floor((currentTime - pageStartTime.current) / 1000); // em segundos

    // Registrar tempo na página anterior
    if (timeSpent > 2 && userId) { // Apenas se passou mais de 2 segundos
      queueEvent('page_view', {
        page: location.pathname,
        time_spent: timeSpent,
      });
    }

    // Resetar timer para nova página
    pageStartTime.current = currentTime;

    // Cleanup ao sair da página
    return () => {
      const finalTime = Math.floor((Date.now() - pageStartTime.current) / 1000);
      if (finalTime > 2 && userId) {
        queueEvent('page_view', {
          page: location.pathname,
          time_spent: finalTime,
        });
      }
    };
  }, [location.pathname, userId]);

  // Processar fila a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(processQueue, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Processar fila ao sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      processQueue();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId]);

  return {
    // Rastrear visualização de prédio
    trackBuildingView: (buildingId: string, timeSpent: number) => {
      if (userId) {
        queueEvent('building_view', {
          building_id: buildingId,
          time_spent: Math.floor(timeSpent),
        });
      }
    },

    // Rastrear visualização de vídeo
    trackVideoWatch: (videoId: string, watchDuration: number, completed: boolean) => {
      if (userId) {
        queueEvent('video_watch', {
          video_id: videoId,
          watch_duration: Math.floor(watchDuration),
          completed,
        });
      }
    },

    // Rastrear adição ao carrinho
    trackCartAdd: (buildingId: string) => {
      if (userId) {
        queueEvent('cart_add', {
          building_id: buildingId,
        });
      }
    },

    // Rastrear início de checkout
    trackCheckoutStart: () => {
      if (userId) {
        queueEvent('checkout_start', {});
      }
    },

    // Rastrear abandono de carrinho
    trackCartAbandon: () => {
      if (userId) {
        queueEvent('cart_abandon', {});
      }
    },
  };
};
