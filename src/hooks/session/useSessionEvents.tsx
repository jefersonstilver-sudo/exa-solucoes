
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
  // Add a ref to track if we've already shown a login toast in this session
  const loginToastShown = useRef<boolean>(false);
  // Adiciona um ref para evitar atualizações duplicadas
  const initialSessionChecked = useRef<boolean>(false);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!isMounted.current) return;
    
    console.log('Configurando eventos de sessão e verificação inicial');
    
    // Set up auth state listener FIRST (critical for proper session handling)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email || 'No email');
        
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
          console.log('Sessão encontrada no evento onAuthStateChange:', currentSession.user.email);
          
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
          
          // Cancel any pending role update to avoid race conditions
          if (pendingUpdateRef.current) {
            clearTimeout(pendingUpdateRef.current);
          }
          
          // Then fetch role from database using setTimeout to prevent auth deadlocks
          pendingUpdateRef.current = setTimeout(async () => {
            if (!isMounted.current) return;
            try {
              const dbRole = await fetchUserRole(currentSession.user.id);
              pendingUpdateRef.current = null;
              
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
              pendingUpdateRef.current = null;
            }
          }, 0);
          
          if (event === 'SIGNED_IN') {
            // Only show toast if we haven't shown it yet and we're not on login page
            const isOnLoginPage = window.location.pathname === '/login';
            if (!loginToastShown.current && !isOnLoginPage) {
              toast.success('Login realizado com sucesso!');
              loginToastShown.current = true;
              
              // Reset the flag after 3 seconds to prevent spamming toasts
              // but allow future logins to show the toast
              setTimeout(() => {
                loginToastShown.current = false;
              }, 3000);
            }
            
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
    
    // Verificação inicial de sessão após configurar o listener
    if (!initialSessionChecked.current) {
      supabase.auth.getSession().then(({ data, error }) => {
        if (!isMounted.current) return;
        
        if (error) {
          console.error('Erro ao verificar sessão inicial:', error);
          initialSessionChecked.current = true;
          return;
        }
        
        const currentSession = data.session;
        
        if (currentSession?.user) {
          console.log('Sessão inicial encontrada:', currentSession.user.email);
          
          // Atualiza o estado da sessão
          setSession(currentSession);
          
          // Cria o objeto de usuário
          const baseUser = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
            avatar_url: currentSession.user.user_metadata?.avatar_url,
          };
          
          // Define o usuário com a função dos metadados
          const metadataRole = currentSession.user.user_metadata?.role;
          setUser({
            ...baseUser,
            role: metadataRole
          });
          
          // Busca a função do banco de dados
          setTimeout(async () => {
            if (!isMounted.current) return;
            
            try {
              const dbRole = await fetchUserRole(currentSession.user.id);
              
              if (dbRole && isMounted.current) {
                setUser(prev => prev ? {
                  ...prev,
                  role: dbRole
                } : null);
              }
              
              initialSessionChecked.current = true;
            } catch (err) {
              console.error('Erro ao buscar função do usuário:', err);
              initialSessionChecked.current = true;
            }
          }, 0);
          
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.INFO,
            "Sessão inicial do usuário detectada",
            { 
              userId: currentSession.user.id,
              email: currentSession.user.email,
              timestamp: new Date().toISOString() 
            }
          );
        } else {
          console.log('Nenhuma sessão inicial encontrada');
          initialSessionChecked.current = true;
        }
      });
    }

    return () => {
      // Clean up all timeouts and subscriptions
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
      subscription.unsubscribe();
    };
  }, [setUser, setSession, isMounted]);

  return null;
};
