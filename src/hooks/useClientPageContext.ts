import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

interface PageContextData {
  currentPath: string;
  currentPage: string;
  section: string;
  lastActions: string[];
  timeOnPage: number;
}

export const useClientPageContext = () => {
  const location = useLocation();
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(uuidv4());
  const [context, setContext] = useState<PageContextData>({
    currentPath: location.pathname,
    currentPage: 'unknown',
    section: 'general',
    lastActions: [],
    timeOnPage: 0,
  });
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now());

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

  // Map routes to friendly page names
  const getPageInfo = useCallback((path: string) => {
    const routes: Record<string, { name: string; section: string }> = {
      '/advertiser': { name: 'Dashboard', section: 'dashboard' },
      '/advertiser/predios': { name: 'Prédios Disponíveis', section: 'buildings' },
      '/advertiser/meus-pedidos': { name: 'Meus Pedidos', section: 'orders' },
      '/advertiser/carrinho': { name: 'Carrinho', section: 'cart' },
      '/advertiser/profile': { name: 'Meu Perfil', section: 'profile' },
      '/advertiser/suporte': { name: 'Suporte', section: 'support' },
    };

    // Check for dynamic routes
    if (path.includes('/advertiser/meus-pedidos/')) {
      return { name: 'Detalhes do Pedido', section: 'order_detail' };
    }
    if (path.includes('/advertiser/predios/')) {
      return { name: 'Detalhes do Prédio', section: 'building_detail' };
    }

    return routes[path] || { name: 'Página', section: 'other' };
  }, []);

  // Update context when route changes
  useEffect(() => {
    const pageInfo = getPageInfo(location.pathname);
    setPageStartTime(Date.now());
    
    setContext(prev => ({
      ...prev,
      currentPath: location.pathname,
      currentPage: pageInfo.name,
      section: pageInfo.section,
      timeOnPage: 0,
    }));

    // Track page view
    if (user?.id) {
      trackEvent('page_view', {
        page: pageInfo.name,
        path: location.pathname,
        section: pageInfo.section,
      });
    }
  }, [location.pathname, getPageInfo, user?.id]);

  // Update time on page periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setContext(prev => ({
        ...prev,
        timeOnPage: Math.floor((Date.now() - pageStartTime) / 1000),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [pageStartTime]);

  // Track user actions
  const trackEvent = useCallback(async (eventType: string, eventData: Record<string, any>) => {
    if (!user?.id) return;

    // Mapear event_type para tipos válidos da Edge Function
    const validEventTypes = ['page_view', 'building_view', 'video_watch', 'cart_add', 'checkout_start', 'cart_abandon'];
    const mappedEventType = validEventTypes.includes(eventType) ? eventType : 'page_view';

    try {
      await supabase.functions.invoke('track-client-behavior', {
        body: {
          user_id: user.id,
          session_id: sessionIdRef.current,
          event_type: mappedEventType,
          data: {
            page: eventData.page || eventData.path || location.pathname,
            time_spent: eventData.time_spent || Math.floor((Date.now() - pageStartTime) / 1000),
            device_type: getDeviceType(),
            ...eventData,
          },
        },
      });
    } catch (error) {
      console.log('[PageContext] Failed to track event:', error);
    }
  }, [user?.id, location.pathname, pageStartTime]);

  // Add action to history
  const addAction = useCallback((action: string) => {
    setContext(prev => ({
      ...prev,
      lastActions: [action, ...prev.lastActions.slice(0, 9)],
    }));

    if (user?.id) {
      trackEvent('action', { action, page: context.currentPage });
    }
  }, [context.currentPage, trackEvent, user?.id]);

  // Get context summary for Sofia
  const getContextSummary = useCallback(() => {
    return `Usuário está na página "${context.currentPage}" (${context.section}) há ${context.timeOnPage}s. Últimas ações: ${context.lastActions.slice(0, 3).join(', ') || 'nenhuma'}`;
  }, [context]);

  return {
    ...context,
    addAction,
    trackEvent,
    getContextSummary,
  };
};
