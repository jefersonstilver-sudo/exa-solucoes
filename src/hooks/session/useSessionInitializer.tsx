
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/userTypes';
import { fetchUserRole } from '@/services/userRoleService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UseSessionInitializerProps {
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setSession: React.Dispatch<React.SetStateAction<any>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isMounted: React.MutableRefObject<boolean>;
}

export const useSessionInitializer = ({ 
  setUser, 
  setSession, 
  setIsLoading, 
  isMounted 
}: UseSessionInitializerProps) => {
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isMounted.current) return;
      setIsLoading(true);
      try {
        // Get session with robust error handling
        const { data, error } = await supabase.auth.getSession();
        
        if (!isMounted.current) return;
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setUser(null);
          setSession(null);
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.ERROR,
            "Failed to get session",
            { error: String(error), timestamp: new Date().toISOString() }
          );
        } else if (data?.session) {
          console.log('Session found during initialization:', data.session.user.email);
          
          // Sync session state
          setSession(data.session);
          
          // Get user ID
          const userId = data.session.user.id;
          
          // Create base user object
          const baseUser = {
            id: userId,
            email: data.session.user.email || '',
            name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0],
            avatar_url: data.session.user.user_metadata?.avatar_url,
          };
          
          // First set user with metadata role (faster UI update)
          const metadataRole = data.session.user.user_metadata?.role;
          setUser({
            ...baseUser,
            role: metadataRole
          });
          
          // Then fetch role from database (without blocking UI)
          try {
            const dbRole = await fetchUserRole(userId);
            
            if (!isMounted.current) return;
            
            // If we found a role in the database, it overrides metadata
            if (dbRole) {
              setUser(prev => prev ? {
                ...prev,
                role: dbRole
              } : null);
            }
            
            logCheckoutEvent(
              CheckoutEvent.AUTH_EVENT,
              LogLevel.INFO,
              "User session restored successfully",
              { 
                userId, 
                email: data.session.user.email,
                hasDbRole: !!dbRole,
                timestamp: new Date().toISOString() 
              }
            );
          } catch (err) {
            console.error('Error fetching user role:', err);
          }
        } else {
          console.log('No session found during initialization');
          setUser(null);
          setSession(null);
          
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.INFO,
            "No authenticated session found",
            { timestamp: new Date().toISOString() }
          );
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
        setSession(null);
        
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.ERROR,
          "Error checking authentication",
          { error: String(error), timestamp: new Date().toISOString() }
        );
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
  }, [setUser, setSession, setIsLoading, isMounted]);

  return null;
};
