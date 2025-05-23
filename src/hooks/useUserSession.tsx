
import { useSessionInit } from './session/useSessionInit';
import { useSessionActions } from './session/useSessionActions';
import { UserSessionHookReturn } from '@/types/sessionTypes';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

/**
 * Main hook for managing user authentication session
 * Provides user data, session status, and authentication actions
 */
export const useUserSession = (): UserSessionHookReturn => {
  const { user, session, isLoading, setUser } = useSessionInit();
  const { logout, updateUserProfile, hasRole, setUserRole } = useSessionActions(user, setUser);

  // Make sure we have consistent isLoggedIn value based on both user and session
  const isLoggedIn = !!user && !!session;
  
  return {
    user,
    sessionUser: user, // Keep sessionUser as an alias to user for backward compatibility
    session,
    isLoading,
    isLoggedIn,
    logout,
    updateUserProfile,
    hasRole,
    setUserRole
  };
};
