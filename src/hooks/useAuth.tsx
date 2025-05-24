
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // FUNÇÃO CRÍTICA: Extrair role diretamente do JWT
  const extractUserRoleFromJWT = (session: Session | null): UserRole | null => {
    if (!session?.access_token) return null;
    
    try {
      // Decodificar JWT sem verificação (já está validado pelo Supabase)
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      const userRole = payload.user_role as UserRole;
      
      console.log('🔍 PHOENIX: Role extraída do JWT:', userRole);
      return userRole;
    } catch (error) {
      console.error('❌ Erro ao extrair role do JWT:', error);
      return null;
    }
  };

  // FUNÇÃO OTIMIZADA: Criar UserProfile baseado apenas no JWT
  const createUserProfileFromSession = (session: Session | null): UserProfile | null => {
    if (!session?.user) return null;

    const userRole = extractUserRoleFromJWT(session);
    
    const profile: UserProfile = {
      id: session.user.id,
      email: session.user.email || '',
      role: userRole || 'client',
      data_criacao: session.user.created_at
    };

    console.log('✅ PHOENIX: UserProfile criado do JWT:', {
      email: profile.email,
      role: profile.role,
      isSuperAdmin: profile.email === 'jefersonstilver@gmail.com' && profile.role === 'super_admin'
    });

    return profile;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Verificar sessão existente primeiro
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user && mounted) {
          console.log('🔍 PHOENIX: Sessão inicial encontrada para:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Criar perfil APENAS baseado no JWT
          const profile = createUserProfileFromSession(initialSession);
          setUserProfile(profile);
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

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 PHOENIX: Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Criar perfil APENAS baseado no JWT (sem consultas à tabela)
          const profile = createUserProfileFromSession(session);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Inicializar
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    console.log('🚪 PHOENIX: Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      localStorage.clear();
      console.log('✅ PHOENIX: Logout realizado com sucesso');
    } else {
      console.error('❌ Erro no logout:', error);
    }
    return { success: !error, error };
  };

  const hasRole = (requiredRole: string): boolean => {
    if (!userProfile?.role) return false;
    
    // Super admins têm acesso a tudo
    if (userProfile.role === 'super_admin') return true;
    
    // Verificação direta de role
    return userProfile.role === requiredRole;
  };

  return {
    user,
    session,
    userProfile,
    isLoading,
    isLoggedIn: !!user && !!session,
    logout,
    hasRole
  };
};
