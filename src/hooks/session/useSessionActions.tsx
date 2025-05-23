
import { UserProfile, UserRole } from '@/types/userTypes';
import { updateUserProfileData, logoutUser, setUserRoleData } from '@/services/userAuthService';

/**
 * Hook for user session actions (logout, profile updates, role checks)
 */
export const useSessionActions = (
  user: UserProfile | null,
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>
) => {
  /**
   * Log out the current user
   */
  const logout = async (): Promise<void> => {
    const result = await logoutUser();
    if (!result.success) {
      console.error('Error logging out:', result.error);
    }
  };

  /**
   * Update the user's profile
   */
  const updateUserProfile = async (
    userProfile: Partial<UserProfile>
  ): Promise<{success: boolean, error?: any}> => {
    if (!user) {
      return { success: false, error: new Error('No user logged in') };
    }
    
    const result = await updateUserProfileData(userProfile, user.id);
    
    if (result.success) {
      // Update local state
      setUser(prev => prev ? { ...prev, ...userProfile } : null);
    }
    
    return result;
  };
  
  /**
   * Check if the user has a required role
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user || !user.role) return false;
    
    // Super admins can access everything
    if (user.role === 'super_admin') return true;
    
    // Admins can access admin and client areas
    if (user.role === 'admin' && (requiredRole === 'admin' || requiredRole === 'client')) {
      return true;
    }
    
    // Direct role match
    return user.role === requiredRole;
  };
  
  /**
   * Set the user's role (both in auth and database)
   */
  const setUserRole = async (
    role: UserRole
  ): Promise<{success: boolean, error?: any}> => {
    if (!user) {
      return { success: false, error: new Error('No user logged in') };
    }
    
    const result = await setUserRoleData(user.id, role);
    
    if (result.success) {
      // Update local state
      setUser(prev => prev ? { ...prev, role } : null);
    }
    
    return result;
  };

  return {
    logout,
    updateUserProfile,
    hasRole,
    setUserRole
  };
};
