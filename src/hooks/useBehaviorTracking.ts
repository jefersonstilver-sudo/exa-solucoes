import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface TrackEventParams {
  eventType: string;
  eventData?: Record<string, any>;
  timeSpentSeconds?: number;
}

// Gerar ou recuperar session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('behavior_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('behavior_session_id', sessionId);
  }
  return sessionId;
};

// Obter informações do dispositivo
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    platform: navigator.platform,
  };
};

export const useBehaviorTracking = () => {
  const pageStartTime = useRef<number>(Date.now());
  const sessionId = useRef<string>(getSessionId());
  const currentUserId = useRef<string | null>(null);

  // Inicializar user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId.current = user?.id || null;
    };
    getUserId();
  }, []);

  // Rastrear tempo em página ao sair
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
      await trackEvent({
        eventType: 'page_view',
        eventData: {
          page: window.location.pathname,
          title: document.title,
        },
        timeSpentSeconds: timeSpent,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const trackEvent = useCallback(async ({
    eventType,
    eventData = {},
    timeSpentSeconds,
  }: TrackEventParams) => {
    try {
      const { error } = await supabase
        .from('user_behavior_tracking')
        .insert({
          user_id: currentUserId.current,
          session_id: sessionId.current,
          event_type: eventType,
          event_data: eventData,
          page_url: window.location.pathname,
          page_title: document.title,
          time_spent_seconds: timeSpentSeconds,
          device_info: getDeviceInfo(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

      if (error) {
        console.error('❌ Erro ao rastrear evento:', error);
      } else {
        console.log('✅ Evento rastreado:', eventType, eventData);
      }
    } catch (error) {
      console.error('💥 Erro crítico no tracking:', error);
    }
  }, []);

  // Funções específicas de tracking
  const trackPageView = useCallback((pageName: string) => {
    pageStartTime.current = Date.now();
    trackEvent({
      eventType: 'page_view',
      eventData: { page: pageName },
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm: string, filters?: Record<string, any>) => {
    trackEvent({
      eventType: 'search',
      eventData: {
        search_term: searchTerm,
        filters: filters || {},
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackBuildingClick = useCallback((building: {
    id: string;
    nome: string;
    bairro: string;
    endereco?: string;
  }) => {
    trackEvent({
      eventType: 'building_click',
      eventData: {
        building: {
          id: building.id,
          name: building.nome,
          neighborhood: building.bairro,
          address: building.endereco,
        },
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackMapPinClick = useCallback((building: {
    id: string;
    nome: string;
    bairro: string;
    latitude?: number;
    longitude?: number;
  }) => {
    trackEvent({
      eventType: 'map_pin_click',
      eventData: {
        building: {
          id: building.id,
          name: building.nome,
          neighborhood: building.bairro,
          coordinates: {
            lat: building.latitude,
            lng: building.longitude,
          },
        },
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackCartAdd = useCallback((buildingId: string, buildingName: string, price?: number) => {
    trackEvent({
      eventType: 'cart_add',
      eventData: {
        building_id: buildingId,
        building_name: buildingName,
        price: price,
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackCartRemove = useCallback((buildingId: string) => {
    trackEvent({
      eventType: 'cart_remove',
      eventData: {
        building_id: buildingId,
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackCheckoutStart = useCallback((cartItems: any[], totalValue: number) => {
    trackEvent({
      eventType: 'checkout_start',
      eventData: {
        items_count: cartItems.length,
        total_value: totalValue,
        items: cartItems,
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackCheckoutComplete = useCallback((orderId: string, totalValue: number) => {
    trackEvent({
      eventType: 'checkout_complete',
      eventData: {
        order_id: orderId,
        total_value: totalValue,
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackVideoPlay = useCallback((videoUrl: string, source: string) => {
    trackEvent({
      eventType: 'video_play',
      eventData: {
        video_url: videoUrl,
        source: source,
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  const trackButtonClick = useCallback((buttonName: string, location: string) => {
    trackEvent({
      eventType: 'button_click',
      eventData: {
        button_name: buttonName,
        location: location,
        timestamp: new Date().toISOString(),
      },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackSearch,
    trackBuildingClick,
    trackMapPinClick,
    trackCartAdd,
    trackCartRemove,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackVideoPlay,
    trackButtonClick,
  };
};
