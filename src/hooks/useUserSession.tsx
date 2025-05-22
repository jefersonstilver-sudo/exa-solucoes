
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Get role from user metadata
          const userRole = currentSession.user.user_metadata?.role || 'client';
          
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0],
            avatar_url: currentSession.user.user_metadata?.avatar_url,
            role: userRole
          });
          
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
          
          // Get role from user metadata
          const userRole = data.session.user.user_metadata?.role || 'client';
          
          // Set user profile
          const userData = data.session.user;
          setUser({
            id: userData.id,
            email: userData.email || '',
            name: userData.user_metadata?.name || userData.email?.split('@')[0],
            avatar_url: userData.user_metadata?.avatar_url,
            role: userRole
          });
          
          console.log('User session restored:', userData.email);
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
      const { data, error } = await supabase.auth.updateUser({
        data: userProfile
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Get role from user metadata
        const userRole = data.user.user_metadata?.role || 'client';
        
        setUser(prev => prev ? {
          ...prev,
          ...userProfile,
          role: userRole
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
