
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // CORREÇÃO: Extrair role do JWT de forma otimizada
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

  // CORREÇÃO: Criar perfil de forma otimizada
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

  // CORREÇÃO: useEffect consolidado e otimizado
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 INDEXA AUTH: Inicializando autenticação...');
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user && mounted) {
          console.log('🔍 INDEXA AUTH: Sessão inicial encontrada para:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          const profile = createUserProfileFromSession(initialSession);
          setUserProfile(profile);
        } else {
          console.log('🔍 INDEXA AUTH: Nenhuma sessão inicial encontrada');
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('💥 Erro na inicialização de auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 INDEXA AUTH: Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = createUserProfileFromSession(session);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [createUserProfileFromSession]);

  // CORREÇÃO: Funções otimizadas com useCallback
  const logout = useCallback(async () => {
    console.log('🚪 INDEXA AUTH: Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      localStorage.clear();
      console.log('✅ INDEXA AUTH: Logout realizado com sucesso');
    } else {
      console.error('❌ Erro no logout:', error);
    }
    return { success: !error, error };
  }, []);

  const hasRole = useCallback((requiredRole: string): boolean => {
    if (!userProfile?.role) {
      return false;
    }
    
    if (userProfile.role === 'super_admin') {
      return true;
    }
    
    return userProfile.role === requiredRole;
  }, [userProfile?.role]);

  // CORREÇÃO: Usar useMemo para valores computados
  const isLoggedIn = useMemo(() => 
    !!user && !!session && !!userProfile
  , [user, session, userProfile]);

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
