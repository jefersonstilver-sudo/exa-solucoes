
import { useAuth } from './useAuth';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

/**
 * Main hook for managing user authentication session
 * Now simplified to use the new useAuth hook
 */
export const useUserSession = () => {
  const { user, session, userProfile, isLoading, isLoggedIn, logout, hasRole } = useAuth();

  return {
    user: userProfile, // Use userProfile as user for backward compatibility
    sessionUser: user, // Original auth user
    session,
    isLoading,
    isLoggedIn,
    logout,
    updateUserProfile: async () => ({ success: true }), // Simplified - not needed anymore
    hasRole,
    setUserRole: async () => ({ success: true }) // Simplified - not needed anymore
  };
};
