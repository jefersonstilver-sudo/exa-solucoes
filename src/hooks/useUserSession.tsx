
import { useAuth } from './useAuth';
import { useMemo } from 'react';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

/**
 * INDEXA COMPATIBILITY LAYER - Hook simplificado que usa APENAS JWT claims
 * OTIMIZADO para evitar logs excessivos e re-renderizações
 */
export const useUserSession = () => {
  const { user, session, userProfile, isLoading, isLoggedIn, logout, hasRole } = useAuth();

  // FIXED: Memoizar para evitar re-computações desnecessárias
  const sessionData = useMemo(() => {
    console.log('🔍 [useUserSession] Memoizando dados:', {
      hasUser: !!user,
      hasUserProfile: !!userProfile,
      hasSession: !!session,
      isLoggedIn,
      isLoading,
      userEmail: user?.email,
      profileRole: userProfile?.role
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
  }, [userProfile, user, session, isLoading, isLoggedIn, logout, hasRole]);

  return sessionData;
};
