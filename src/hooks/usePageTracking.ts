import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useBehaviorTracking } from './useBehaviorTracking';

/**
 * Hook para rastrear automaticamente visualizações de página e tempo gasto
 * Deve ser usado no componente raiz ou em cada página principal
 */
export const usePageTracking = () => {
  const location = useLocation();
  const { trackPageView, trackEvent } = useBehaviorTracking();
  const pageStartTime = useRef<number>(Date.now());
  const lastPath = useRef<string>('');

  useEffect(() => {
    // Se a rota mudou, registrar tempo gasto na página anterior
    if (lastPath.current && lastPath.current !== location.pathname) {
      const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
      trackEvent({
        eventType: 'page_view',
        eventData: {
          page: lastPath.current,
          exit_time: new Date().toISOString(),
        },
        timeSpentSeconds: timeSpent,
      });
    }

    // Registrar visualização da nova página
    pageStartTime.current = Date.now();
    lastPath.current = location.pathname;
    trackPageView(location.pathname);
  }, [location.pathname, trackPageView, trackEvent]);

  // Registrar tempo ao desmontar
  useEffect(() => {
    return () => {
      const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
      trackEvent({
        eventType: 'page_view',
        eventData: {
          page: lastPath.current,
          exit_time: new Date().toISOString(),
        },
        timeSpentSeconds: timeSpent,
      });
    };
  }, [trackEvent]);
};
