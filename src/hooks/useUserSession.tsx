
import { useAuth } from './useAuth';
import { useMemo } from 'react';

// Re-export UserProfile type
export type { UserProfile } from '@/types/userTypes';

/**
 * INDEXA COMPATIBILITY LAYER - Hook simplificado que usa APENAS JWT claims
 * OTIMIZADO para evitar logs excessivos e re-renderizações
 * CORRIGIDO para debug do problema de autenticação
 */
export const useUserSession = () => {
  const { user, session, userProfile, isLoading, isLoggedIn, logout, hasRole } = useAuth();

  console.log('🔍 [USER SESSION DEBUG] Estado do useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    hasUserProfile: !!userProfile,
    isLoading,
    isLoggedIn,
    userEmail: user?.email,
    profileRole: userProfile?.role
  });

  // FIXED: Memoizar para evitar re-computações desnecessárias
  const sessionData = useMemo(() => {
    const result = {
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

    console.log('🔍 [USER SESSION DEBUG] Dados retornados:', {
      hasUser: !!result.user,
      hasSessionUser: !!result.sessionUser,
      hasSession: !!result.session,
      isLoggedIn: result.isLoggedIn,
      userEmail: result.user?.email,
      userRole: result.user?.role
    });

    return result;
  }, [userProfile, user, session, isLoading, isLoggedIn, logout, hasRole]);

  return sessionData;
};
