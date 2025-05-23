
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserProfile, UserRole } from '@/types/userTypes';
import { logoutUser, updateUserProfileData, setUserRoleData } from '@/services/userAuthService';
import { hasUserRole } from '@/services/userRoleService';

export const useSessionActions = (
  user: UserProfile | null,
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>
) => {
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    const result = await logoutUser();
    
    if (result.success) {
      // Clear state
      setUser(null);
      
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } else {
      console.error('Erro ao fazer logout:', result.error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  }, [setUser, navigate]);
  
  // Function to update user profile
  const updateUserProfile = useCallback(async (userProfile: Partial<UserProfile>) => {
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
  }, [user, setUser]);
  
  // Function to check if user has a specific role
  const hasRole = useCallback((requiredRole: UserRole): boolean => {
    return hasUserRole(user?.role, requiredRole);
  }, [user]);
  
  // Function to set user role (for dev/testing purposes)
  const setUserRole = useCallback(async (role: UserRole) => {
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
  }, [user, setUser]);

  return {
    logout,
    updateUserProfile,
    hasRole,
    setUserRole
  };
};
