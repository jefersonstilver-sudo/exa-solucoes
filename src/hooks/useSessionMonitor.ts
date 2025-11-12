import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Hook de monitoramento de sessão
 * Verifica periodicamente se a sessão do usuário ainda é válida
 * Redireciona para login se a sessão expirar
 */
export const useSessionMonitor = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('🚨 [SESSION_MONITOR] Sessão perdida detectada!');
        toast.error('Sua sessão expirou. Redirecionando para login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        console.log('✅ [SESSION_MONITOR] Sessão válida:', {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
        });
      }
    };
    
    // Checar imediatamente ao montar
    checkSession();
    
    // Checar a cada 5 minutos
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [navigate]);
};
