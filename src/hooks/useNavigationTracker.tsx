import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

const STORAGE_KEY_SESSION_ID = 'exa_session_id';
const STORAGE_KEY_SESSION_CREATED = 'exa_session_created_at';
const SESSION_EXPIRY_HOURS = 24;

// Helper to convert any object to Supabase Json type safely
const toJson = (obj: unknown): Json => {
  if (obj === null || obj === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(obj)) as Json;
  } catch {
    return null;
  }
};

/**
 * Hook que rastreia navegação de todos os usuários para auditoria premium
 * Salva cada mudança de página na tabela session_navigation_history
 */
export const useNavigationTracker = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastPathRef = useRef<string>('');
  const pageStartTimeRef = useRef<number>(Date.now());
  const clickCountRef = useRef<number>(0);
  const scrollDepthRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);

  // Obter ou criar session_id persistente
  const getSessionId = useCallback((): string => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY_SESSION_ID);
      const storedCreatedAt = localStorage.getItem(STORAGE_KEY_SESSION_CREATED);
      
      // Verificar se sessão expirou (24h)
      if (storedId && storedCreatedAt) {
        const createdAt = new Date(storedCreatedAt).getTime();
        const now = Date.now();
        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
        
        if (hoursDiff < SESSION_EXPIRY_HOURS) {
          return storedId;
        }
      }
      
      // Criar nova sessão
      const newId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY_SESSION_ID, newId);
      localStorage.setItem(STORAGE_KEY_SESSION_CREATED, new Date().toISOString());
      return newId;
    } catch {
      return crypto.randomUUID();
    }
  }, []);

  // Mapear path para título amigável
  const getPageTitle = useCallback((path: string): string => {
    const pathMappings: Record<string, string> = {
      '/': 'Home',
      '/loja': 'Loja de Prédios',
      '/selecionar-plano': 'Seleção de Plano',
      '/checkout/cupom': 'Cupom de Desconto',
      '/checkout/resumo': 'Resumo do Pedido',
      '/checkout/finalizar': 'Finalizar Pedido',
      '/payment': 'Pagamento',
      '/login': 'Login',
      '/cadastro': 'Cadastro',
      '/super_admin': 'Super Admin',
      '/admin': 'Admin',
      '/anunciante': 'Área do Anunciante',
      '/anunciante/pedidos': 'Meus Pedidos',
      '/anunciante/campanhas': 'Minhas Campanhas',
      '/anunciante/videos': 'Meus Vídeos',
      '/sou-sindico': 'Sou Síndico',
      '/quem-somos': 'Quem Somos',
      '/contato': 'Contato',
      '/configuracoes': 'Configurações',
    };

    // Match exato
    if (pathMappings[path]) return pathMappings[path];

    // Match por prefixo
    for (const [prefix, title] of Object.entries(pathMappings)) {
      if (path.startsWith(prefix) && prefix !== '/') {
        return title;
      }
    }

    // Extrair nome do path
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1]
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }

    return 'Página';
  }, []);

  // Rastrear cliques
  useEffect(() => {
    const handleClick = () => {
      clickCountRef.current += 1;
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Rastrear scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const depth = Math.round((window.scrollY / scrollHeight) * 100);
        if (depth > scrollDepthRef.current) {
          scrollDepthRef.current = depth;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Salvar navegação no Supabase
  const saveNavigation = useCallback(async (
    path: string,
    timeSpent: number,
    isPageExit: boolean = false
  ) => {
    if (isTrackingRef.current) return;
    isTrackingRef.current = true;

    try {
      const sessionId = getSessionId();
      const pageTitle = getPageTitle(path);

      await supabase.from('session_navigation_history').insert([{
        session_id: sessionId,
        user_id: user?.id || null,
        path,
        page_title: pageTitle,
        action_type: isPageExit ? 'page_exit' : 'page_view',
        time_spent_seconds: timeSpent,
        scroll_depth: scrollDepthRef.current,
        clicks_count: clickCountRef.current,
        action_details: toJson({
          referrer: document.referrer || null,
          timestamp: new Date().toISOString(),
        })
      }]);
    } catch (error) {
      console.error('❌ Erro ao salvar navegação:', error);
    } finally {
      isTrackingRef.current = false;
    }
  }, [user?.id, getSessionId, getPageTitle]);

  // Rastrear mudanças de página
  useEffect(() => {
    const currentPath = location.pathname;

    // Se mudou de página, salvar tempo da página anterior
    if (lastPathRef.current && lastPathRef.current !== currentPath) {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      saveNavigation(lastPathRef.current, timeSpent, true);
    }

    // Reset contadores para nova página
    pageStartTimeRef.current = Date.now();
    clickCountRef.current = 0;
    scrollDepthRef.current = 0;
    lastPathRef.current = currentPath;

    // Salvar visualização da nova página
    saveNavigation(currentPath, 0, false);

  }, [location.pathname, saveNavigation]);

  // Salvar ao sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      
      // Usar sendBeacon para garantir envio mesmo ao fechar
      const sessionId = localStorage.getItem(STORAGE_KEY_SESSION_ID);
      if (sessionId && lastPathRef.current) {
        const data = {
          session_id: sessionId,
          user_id: user?.id || null,
          path: lastPathRef.current,
          page_title: getPageTitle(lastPathRef.current),
          action_type: 'page_unload',
          time_spent_seconds: timeSpent,
          scroll_depth: scrollDepthRef.current,
          clicks_count: clickCountRef.current,
        };
        
        // Tentar usar sendBeacon se disponível
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
          // Note: sendBeacon não funciona diretamente com Supabase, 
          // mas deixamos o registro para futura implementação via Edge Function
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user?.id, getPageTitle]);

  // Expor função para registrar ações manuais
  const trackAction = useCallback(async (
    actionType: string,
    details?: Record<string, unknown>
  ) => {
    try {
      const sessionId = getSessionId();
      
      await supabase.from('session_navigation_history').insert([{
        session_id: sessionId,
        user_id: user?.id || null,
        path: location.pathname,
        page_title: getPageTitle(location.pathname),
        action_type: actionType,
        action_details: toJson(details),
      }]);
    } catch (error) {
      console.error('❌ Erro ao registrar ação:', error);
    }
  }, [user?.id, location.pathname, getSessionId, getPageTitle]);

  return { trackAction, getSessionId };
};

// Exportar função utilitária para obter session_id atual
export const getCurrentSessionId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_SESSION_ID);
  } catch {
    return null;
  }
};
