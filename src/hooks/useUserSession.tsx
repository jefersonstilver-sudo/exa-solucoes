import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: 'client' | 'admin' | 'super_admin';
}

export const useUserSession = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user role from the public.users table
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.role;
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return null;
    }
  };

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
                role: dbRole as 'client' | 'admin' | 'super_admin'
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
              role: dbRole as 'client' | 'admin' | 'super_admin'
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
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Limpar localStorage (carrinhos, preferências, etc)
      localStorage.removeItem('indexa_cart');
      localStorage.removeItem('indexa_preferences');
      localStorage.removeItem('panelCart'); // Make sure we clear any cart data
      
      // Clear state
      setUser(null);
      setSession(null);
      
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };
  
  // Function to update user profile
  const updateUserProfile = async (userProfile: Partial<UserProfile>) => {
    try {
      // Update auth metadata
      const { data, error } = await supabase.auth.updateUser({
        data: userProfile
      });
      
      if (error) {
        throw error;
      }
      
      // If trying to update role, we also need to update the users table
      if (userProfile.role && user?.id) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ role: userProfile.role })
          .eq('id', user.id);
          
        if (userUpdateError) {
          console.error('Error updating role in users table:', userUpdateError);
          toast.error('Erro ao atualizar função do usuário na base de dados');
        }
      }
      
      if (data.user) {
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
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil: ' + error.message);
      return { success: false, error };
    }
  };
  
  // Function to check if user has a specific role
  const hasRole = (requiredRole: 'client' | 'admin' | 'super_admin'): boolean => {
    if (!user || !user.role) return false;
    
    // Super admin has access to all roles
    if (user.role === 'super_admin') return true;
    
    // Admin has access to admin and client roles
    if (user.role === 'admin' && (requiredRole === 'admin' || requiredRole === 'client')) return true;
    
    // Client has access only to client role
    if (user.role === 'client' && requiredRole === 'client') return true;
    
    return false;
  };
  
  // Function to set user role (for dev/testing purposes)
  const setUserRole = async (role: 'client' | 'admin' | 'super_admin') => {
    try {
      if (!user?.id) {
        throw new Error('No user logged in');
      }
      
      // Update the users table (source of truth)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user.id);
        
      if (userUpdateError) {
        throw userUpdateError;
      }
      
      // Also update auth metadata to keep them in sync
      const { data, error } = await supabase.auth.updateUser({
        data: { role }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        setUser(prev => prev ? {
          ...prev,
          role
        } : null);
        
        toast.success(`Role atualizada para: ${role}`);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role: ' + error.message);
      return { success: false, error };
    }
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
