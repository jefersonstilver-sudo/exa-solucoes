
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';
import { fetchUserRole } from '@/services/userRoleService';
import { toast } from 'sonner';

export const useSessionInit = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          // First get metadata role from session
          const metadataRole = currentSession.user.user_metadata?.role;
          
          // Create base user object
          const baseUser = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
            avatar_url: currentSession.user.user_metadata?.avatar_url,
          };
          
          // Set initial user state with metadata (will be updated with DB role)
          setUser({
            ...baseUser,
            role: metadataRole
          });
          
          // Then fetch role from database in non-blocking way
          setTimeout(async () => {
            const dbRole = await fetchUserRole(currentSession.user.id);
            
            // If we found a role in the database, use it (it's the source of truth)
            if (dbRole) {
              setUser(prev => prev ? {
                ...prev,
                role: dbRole as UserRole
              } : null);
            } else if (metadataRole) {
              // If no DB role but metadata role exists, try to sync it to DB
              console.log('No DB role found, using metadata role:', metadataRole);
            }
          }, 0);
          
          if (event === 'SIGNED_IN') {
            toast.success('Login realizado com sucesso!');
          }
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setUser(null);
          setSession(null);
        } else if (data?.session) {
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
          
          // First set user with metadata role
          const metadataRole = data.session.user.user_metadata?.role;
          setUser({
            ...baseUser,
            role: metadataRole
          });
          
          // Then fetch role from database
          const dbRole = await fetchUserRole(userId);
          
          // If we found a role in the database, it overrides metadata
          if (dbRole) {
            setUser(prev => prev ? {
              ...prev,
              role: dbRole as UserRole
            } : null);
          }
          
          console.log('User session restored:', data.session.user.email, 'Database role:', dbRole);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isLoading,
    setUser
  };
};
