
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/userTypes';
import { fetchUserRole } from '@/services/userRoleService';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UseSessionEventsProps {
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setSession: React.Dispatch<React.SetStateAction<any>>;
  isMounted: React.MutableRefObject<boolean>;
}

export const useSessionEvents = ({ setUser, setSession, isMounted }: UseSessionEventsProps) => {
  useEffect(() => {
    // Set up auth state listener FIRST (critical for proper session handling)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
        if (!isMounted.current) return;
        
        if (event === 'SIGNED_OUT') {
          // Clear user and session immediately on sign out
          setUser(null);
          setSession(null);
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.INFO,
            "User signed out",
            { event, timestamp: new Date().toISOString() }
          );
          return;
        }
        
        if (currentSession?.user) {
          // Update session state immediately
          setSession(currentSession);
          
          // Create base user object from auth data
          const baseUser = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
            avatar_url: currentSession.user.user_metadata?.avatar_url,
          };
          
          // First set user with metadata role (faster UI update)
          const metadataRole = currentSession.user.user_metadata?.role;
          setUser({
            ...baseUser,
            role: metadataRole
          });
          
          // Then fetch role from database using setTimeout to prevent auth deadlocks
          setTimeout(async () => {
            if (!isMounted.current) return;
            try {
              const dbRole = await fetchUserRole(currentSession.user.id);
              
              // If we found a role in the database, use it (it's the source of truth)
              if (dbRole && isMounted.current) {
                setUser(prev => prev ? {
                  ...prev,
                  role: dbRole
                } : null);
              } else if (metadataRole) {
                // If no DB role but metadata role exists, log but don't block UI
                console.log('No DB role found, using metadata role:', metadataRole);
              }
            } catch (err) {
              console.error('Error fetching user role:', err);
            }
          }, 0);
          
          if (event === 'SIGNED_IN') {
            toast.success('Login realizado com sucesso!');
            logCheckoutEvent(
              CheckoutEvent.AUTH_EVENT,
              LogLevel.INFO,
              "User signed in successfully",
              { 
                userId: currentSession.user.id, 
                email: currentSession.user.email,
                timestamp: new Date().toISOString() 
              }
            );
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, isMounted]);

  return null;
};
