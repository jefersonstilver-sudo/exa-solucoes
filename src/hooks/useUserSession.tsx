
import { useSessionInit } from './session/useSessionInit';
import { useSessionActions } from './session/useSessionActions';
import { UserSessionHookReturn } from '@/types/sessionTypes';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

export const useUserSession = (): UserSessionHookReturn => {
  const { user, session, isLoading, setUser } = useSessionInit();
  const { logout, updateUserProfile, hasRole, setUserRole } = useSessionActions(user, setUser);

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
