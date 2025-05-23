
import { useAuth } from './useAuth';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

/**
 * Simplified hook that consolidates authentication state
 * Now uses only useAuth as the single source of truth
 */
export const useUserSession = () => {
  const { user, session, userProfile, isLoading, isLoggedIn, logout, hasRole } = useAuth();

  console.log('useUserSession - Estado atual:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isLoggedIn,
    isLoading
  });

  return {
    user: userProfile, // Use userProfile as user for backward compatibility
    sessionUser: user, // Original auth user
    session,
    isLoading,
    isLoggedIn,
    logout,
    updateUserProfile: async () => ({ success: true }), // Legacy - not needed
    hasRole,
    setUserRole: async () => ({ success: true }) // Legacy - not needed
  };
};
