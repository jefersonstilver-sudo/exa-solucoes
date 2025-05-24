
import { useAuth } from './useAuth';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

/**
 * OPERAÇÃO PHOENIX MASTER - Hook simplificado que usa APENAS JWT claims
 * Compatibilidade mantida mas 100% baseado em JWT
 */
export const useUserSession = () => {
  const { user, session, userProfile, isLoading, isLoggedIn, logout, hasRole } = useAuth();

  console.log('🔧 PHOENIX useUserSession - Usando JWT claims:', {
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
