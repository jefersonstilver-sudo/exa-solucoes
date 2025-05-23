
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/userTypes';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UseSessionRefreshProps {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setSession: React.Dispatch<React.SetStateAction<any>>;
  isMounted: React.MutableRefObject<boolean>;
}

export const useSessionRefresh = ({ 
  user, 
  setUser, 
  setSession, 
  isMounted 
}: UseSessionRefreshProps) => {
  const refreshIntervalRef = useRef<number | null>(null);
  const lastSessionStatus = useRef<boolean | null>(null);
  const isRefreshing = useRef<boolean>(false);

  useEffect(() => {
    // Set up periodic session check at a shorter interval (every 60s)
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = window.setInterval(() => {
      if (!isMounted.current || isRefreshing.current) return;
      
      isRefreshing.current = true;
      console.log('Verificação periódica de sessão');
      
      // Realizar verificação explícita de sessão
      supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
        if (!isMounted.current) {
          isRefreshing.current = false;
          return;
        }
        
        if (error) {
          console.error('Erro na verificação periódica de sessão:', error);
          isRefreshing.current = false;
          return;
        }
        
        const hasSession = !!currentSession;
        const hasUser = !!user;
        
        // Registra alteração de estado da sessão quando há mudança
        if (lastSessionStatus.current !== hasSession) {
          console.log(`Estado da sessão mudou: ${lastSessionStatus.current} -> ${hasSession}`);
          lastSessionStatus.current = hasSession;
        }
        
        // Only update if there's a mismatch between our state and reality
        if (hasSession !== hasUser) {
          if (hasSession && !hasUser) {
            console.log('Sessão restaurada pela verificação periódica');
            setSession(currentSession);
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
              avatar_url: currentSession.user.user_metadata?.avatar_url,
              role: currentSession.user.user_metadata?.role
            });
            
            logCheckoutEvent(
              CheckoutEvent.AUTH_EVENT,
              LogLevel.INFO,
              "Sessão restaurada por verificação periódica",
              { 
                userId: currentSession.user.id,
                timestamp: new Date().toISOString() 
              }
            );
          } else if (!hasSession && hasUser) {
            console.log('Sessão expirada detectada na verificação periódica');
            setUser(null);
            setSession(null);
            
            logCheckoutEvent(
              CheckoutEvent.AUTH_EVENT,
              LogLevel.WARNING,
              "Sessão expirada detectada",
              { timestamp: new Date().toISOString() }
            );
          }
        }
        
        isRefreshing.current = false;
      }).catch((err) => {
        console.error('Erro crítico na verificação periódica:', err);
        isRefreshing.current = false;
      });
    }, 60000); // Check every 60 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, setUser, setSession, isMounted]);

  return null;
};
