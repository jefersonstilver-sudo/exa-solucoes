
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // Função para extrair role do JWT - memoizada
  const extractUserRoleFromJWT = useCallback((session: Session | null): UserRole | null => {
    if (!session?.access_token) {
      return null;
    }
    
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      return payload.user_role as UserRole || null;
    } catch (error) {
      console.error('❌ Erro ao extrair role do JWT:', error);
      return null;
    }
  }, []);

  // Função para criar perfil do usuário - memoizada
  const createUserProfileFromSession = useCallback((session: Session | null): UserProfile | null => {
    if (!session?.user) {
      return null;
    }

    const userRole = extractUserRoleFromJWT(session);
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      role: userRole,
      data_criacao: session.user.created_at
    };
  }, [extractUserRoleFromJWT]);

  // FIXED: Otimização crítica para evitar re-renderizações excessivas
  const updateAuthState = useCallback((newSession: Session | null) => {
    const newUser = newSession?.user ?? null;
    const newProfile = newSession ? createUserProfileFromSession(newSession) : null;
    
    // Só atualiza se realmente mudou para evitar loops
    setSession(prevSession => {
      if (prevSession?.access_token !== newSession?.access_token) {
        return newSession;
      }
      return prevSession;
    });
    
    setUser(prevUser => {
      if (prevUser?.id !== newUser?.id) {
        return newUser;
      }
      return prevUser;
    });
    
    setUserProfile(prevProfile => {
      if (prevProfile?.id !== newProfile?.id || prevProfile?.role !== newProfile?.role) {
        return newProfile;
      }
      return prevProfile;
    });
    
    setIsLoading(false);
  }, [createUserProfileFromSession]);

  // Inicialização e listener de auth - OTIMIZADA
  useEffect(() => {
    if (initialized.current) return;
    
    let mounted = true;
    initialized.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          updateAuthState(initialSession);
        }
      } catch (error) {
        console.error('💥 Erro na inicialização:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // FIXED: Listener otimizado para prevenir loops
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // CRITICAL: Apenas log para eventos importantes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          console.log('🔄 AUTH: State changed:', event);
        }
        
        updateAuthState(session);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // CRITICAL: Dependências vazias para executar apenas uma vez

  // Função de logout - memoizada
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      localStorage.clear();
    }
    return { success: !error, error };
  }, []);

  // Função de verificação de role - memoizada
  const hasRole = useCallback((requiredRole: string): boolean => {
    if (!userProfile?.role) {
      return false;
    }
    
    if (userProfile.role === 'super_admin') {
      return true;
    }
    
    return userProfile.role === requiredRole;
  }, [userProfile?.role]);

  // Estado computado - memoizado
  const isLoggedIn = Boolean(user && session && userProfile);

  return {
    user,
    session,
    userProfile,
    isLoading,
    isLoggedIn,
    logout,
    hasRole
  };
};
