
import { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';
import { fetchUserRole } from '@/services/userRoleService';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const useSessionInit = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Set up auth state listener FIRST (critical for proper session handling)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
        if (!isMounted) return;
        
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
            if (!isMounted) return;
            try {
              const dbRole = await fetchUserRole(currentSession.user.id);
              
              // If we found a role in the database, use it (it's the source of truth)
              if (dbRole && isMounted) {
                setUser(prev => prev ? {
                  ...prev,
                  role: dbRole as UserRole
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

    // AFTER setting up listener, check for existing session
    const initializeAuth = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        // Get session with robust error handling
        const { data, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
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
            
            if (!isMounted) return;
            
            // If we found a role in the database, it overrides metadata
            if (dbRole) {
              setUser(prev => prev ? {
                ...prev,
                role: dbRole as UserRole
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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up periodic session check at a longer interval (every 3 minutes instead of every 60s)
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = window.setInterval(() => {
      if (!isMounted) return;
      
      // Only do periodic checks if we're in an ambiguous state or if there might be changes
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (!isMounted) return;
        
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

    // Cleanup subscription and interval on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  return {
    user,
    session,
    isLoading,
    setUser
  };
};
