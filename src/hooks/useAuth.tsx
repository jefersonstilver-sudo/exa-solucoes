
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // FUNÇÃO CRÍTICA: Extrair role EXCLUSIVAMENTE do JWT
  const extractUserRoleFromJWT = (session: Session | null): UserRole | null => {
    if (!session?.access_token) {
      console.log('🔍 OPERAÇÃO PHOENIX: Sessão sem access_token');
      return null;
    }
    
    try {
      // Decodificar JWT
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      const userRole = payload.user_role as UserRole;
      
      console.log('🔍 OPERAÇÃO PHOENIX: JWT decodificado:', {
        user_role: userRole,
        email: payload.email,
        sub: payload.sub,
        iat: payload.iat,
        exp: payload.exp
      });
      
      return userRole || null;
    } catch (error) {
      console.error('❌ Erro ao extrair role do JWT:', error);
      return null;
    }
  };

  // FUNÇÃO OTIMIZADA: Criar UserProfile baseado exclusivamente no JWT
  const createUserProfileFromSession = (session: Session | null): UserProfile | null => {
    if (!session?.user) {
      console.log('🔍 OPERAÇÃO PHOENIX: Sessão sem usuário');
      return null;
    }

    const userRole = extractUserRoleFromJWT(session);
    
    if (!userRole) {
      console.warn('⚠️ ATENÇÃO: JWT sem user_role - usuário sem permissões definidas');
      // Para debug, vamos ainda permitir criar o profile sem role
      const profile: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        role: undefined, // Sem role definida
        data_criacao: session.user.created_at
      };
      return profile;
    }
    
    const profile: UserProfile = {
      id: session.user.id,
      email: session.user.email || '',
      role: userRole,
      data_criacao: session.user.created_at
    };

    console.log('✅ OPERAÇÃO PHOENIX: UserProfile criado do JWT:', {
      email: profile.email,
      role: profile.role,
      source: 'JWT_CLAIMS_ONLY'
    });

    return profile;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 OPERAÇÃO PHOENIX: Inicializando autenticação...');
        
        // Verificar sessão existente primeiro
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user && mounted) {
          console.log('🔍 OPERAÇÃO PHOENIX: Sessão inicial encontrada para:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Criar perfil EXCLUSIVAMENTE baseado no JWT
          const profile = createUserProfileFromSession(initialSession);
          setUserProfile(profile);
        } else {
          console.log('🔍 OPERAÇÃO PHOENIX: Nenhuma sessão inicial encontrada');
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
        
        console.log('🔄 OPERAÇÃO PHOENIX: Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Criar perfil EXCLUSIVAMENTE baseado no JWT
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
    console.log('🚪 OPERAÇÃO PHOENIX: Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      localStorage.clear();
      console.log('✅ OPERAÇÃO PHOENIX: Logout realizado com sucesso');
    } else {
      console.error('❌ Erro no logout:', error);
    }
    return { success: !error, error };
  };

  const hasRole = (requiredRole: string): boolean => {
    if (!userProfile?.role) {
      console.log('🔍 hasRole: Usuário sem role definida');
      return false;
    }
    
    // Super admins têm acesso a tudo
    if (userProfile.role === 'super_admin') {
      console.log('✅ hasRole: Super admin tem acesso total');
      return true;
    }
    
    // Verificação direta de role
    const hasAccess = userProfile.role === requiredRole;
    console.log('🔍 hasRole: Verificação de role:', {
      userRole: userProfile.role,
      requiredRole,
      hasAccess
    });
    
    return hasAccess;
  };

  return {
    user,
    session,
    userProfile,
    isLoading,
    isLoggedIn: !!user && !!session && !!userProfile,
    logout,
    hasRole
  };
};
