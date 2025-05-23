
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Set up auth state listener FIRST (critical for proper session handling)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
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
            try {
              const dbRole = await fetchUserRole(currentSession.user.id);
              
              // If we found a role in the database, use it (it's the source of truth)
              if (dbRole) {
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
      setIsLoading(true);
      try {
        // Get session with robust error handling
        const { data, error } = await supabase.auth.getSession();
        
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
        setIsLoading(false);
      }
    };

    // Força atualização a cada 60 segundos para evitar sessão desatualizada
    const refreshInterval = setInterval(() => {
      // Nova verificação periódica da sessão para garantir que não perdemos nenhuma mudança
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (currentSession) {
          // Se temos uma sessão válida, validamos o estado do usuário
          if (!user) {
            console.log('Sessão restaurada pela verificação periódica');
            
            // Atualizar o estado do usuário com a sessão atual
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
          }
        } else if (user) {
          // Se temos um usuário no estado, mas não temos uma sessão válida
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
      });
    }, 60000); // 60 segundos

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [user]);

  return {
    user,
    session,
    isLoading,
    setUser
  };
};
