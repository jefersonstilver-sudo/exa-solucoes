
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para extrair role do JWT
  const extractUserRoleFromJWT = (session: Session | null): UserRole | null => {
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
  };

  // Função para criar perfil do usuário
  const createUserProfileFromSession = (session: Session | null): UserProfile | null => {
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
  };

  // Inicialização e listener de auth - simplificado
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 INDEXA AUTH: Inicializando...');
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user && mounted) {
          console.log('🔍 INDEXA AUTH: Sessão encontrada:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          const profile = createUserProfileFromSession(initialSession);
          setUserProfile(profile);
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('💥 Erro na inicialização:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 INDEXA AUTH: State changed:', event);
        
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
  }, []); // Dependências vazias para executar apenas uma vez

  // Função de logout
  const logout = async () => {
    console.log('🚪 INDEXA AUTH: Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      localStorage.clear();
      console.log('✅ INDEXA AUTH: Logout realizado');
    }
    return { success: !error, error };
  };

  // Função de verificação de role
  const hasRole = (requiredRole: string): boolean => {
    if (!userProfile?.role) {
      return false;
    }
    
    if (userProfile.role === 'super_admin') {
      return true;
    }
    
    return userProfile.role === requiredRole;
  };

  // Estado computado
  const isLoggedIn = !!user && !!session && !!userProfile;

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
