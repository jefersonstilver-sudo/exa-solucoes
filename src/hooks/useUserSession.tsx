
import { useAuth } from './useAuth';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

/**
 * OPERAÇÃO PHOENIX MASTER - Hook simplificado que usa useAuth como fonte única
 * Mantém compatibilidade mas redireciona para useAuth
 */
export const useUserSession = () => {
  const { user, session, userProfile, isLoading, isLoggedIn, logout, hasRole } = useAuth();

  console.log('🔧 useUserSession - Redirecionando para useAuth:', {
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
