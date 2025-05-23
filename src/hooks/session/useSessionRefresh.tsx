
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

  useEffect(() => {
    // Set up periodic session check at a longer interval (every 3 minutes instead of every 60s)
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = window.setInterval(() => {
      if (!isMounted.current) return;
      
      // Only do periodic checks if we're in an ambiguous state or if there might be changes
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (!isMounted.current) return;
        
        const hasSession = !!currentSession;
        const hasUser = !!user;
        
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
      });
    }, 180000); // Check every 3 minutes instead of every 60 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, setUser, setSession, isMounted]);

  return null;
};
