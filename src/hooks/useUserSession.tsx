
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

import { UserProfile, UserRole, UserSessionState } from '@/types/userTypes';
import { fetchUserRole, hasUserRole } from '@/services/userRoleService';
import { logoutUser, updateUserProfileData, setUserRoleData } from '@/services/userAuthService';

export { UserProfile } from '@/types/userTypes';

export const useUserSession = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  const logout = async () => {
    const result = await logoutUser();
    
    if (result.success) {
      // Clear state
      setUser(null);
      setSession(null);
      
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } else {
      console.error('Erro ao fazer logout:', result.error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };
  
  // Function to update user profile
  const updateUserProfile = async (userProfile: Partial<UserProfile>) => {
    const result = await updateUserProfileData(userProfile, user?.id);
    
    if (result.success) {
      // Get role from database (source of truth)
      let role = user?.role;
      if (userProfile.role) {
        role = userProfile.role;
      }
      
      setUser(prev => prev ? {
        ...prev,
        ...userProfile,
        role: role
      } : null);
      
      toast.success('Perfil atualizado com sucesso');
    } else {
      toast.error('Erro ao atualizar perfil: ' + result.error?.message);
    }
    
    return result;
  };
  
  // Function to check if user has a specific role
  const hasRole = (requiredRole: UserRole): boolean => {
    return hasUserRole(user?.role, requiredRole);
  };
  
  // Function to set user role (for dev/testing purposes)
  const setUserRole = async (role: UserRole) => {
    if (!user?.id) {
      toast.error('Nenhum usuário logado');
      return { success: false, error: new Error('No user logged in') };
    }
    
    const result = await setUserRoleData(user.id, role);
    
    if (result.success) {
      setUser(prev => prev ? {
        ...prev,
        role
      } : null);
      
      toast.success(`Role atualizada para: ${role}`);
    } else {
      toast.error('Erro ao atualizar role: ' + result.error?.message);
    }
    
    return result;
  };

  return {
    user,
    sessionUser: user, // Add sessionUser as an alias to user for backward compatibility
    session,
    isLoading,
    isLoggedIn: !!user,
    logout,
    updateUserProfile,
    hasRole,
    setUserRole
  };
};
