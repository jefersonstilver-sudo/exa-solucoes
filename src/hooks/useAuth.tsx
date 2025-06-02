
import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<{ success: boolean; error: any }>;
  hasRole: (requiredRole: string) => boolean;
  refreshUserProfile: () => Promise<void>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // NOVA: Função para buscar role do banco de dados diretamente
  const fetchUserRoleFromDB = useCallback(async (userId: string): Promise<UserRole | null> => {
    try {
      console.log('🔍 Buscando role do usuário no banco:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Erro ao buscar role do banco:', error);
        return null;
      }
      
      console.log('✅ Role encontrado no banco:', data);
      return data?.role as UserRole || null;
    } catch (error) {
      console.error('💥 Exceção ao buscar role do banco:', error);
      return null;
    }
  }, []);

  // Função para extrair role do JWT - mantida como fallback
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

  // MELHORADA: Função para criar perfil do usuário com fallback para DB
  const createUserProfileFromSession = useCallback(async (session: Session | null): Promise<UserProfile | null> => {
    if (!session?.user) {
      return null;
    }

    // Primeiro tenta extrair do JWT
    let userRole = extractUserRoleFromJWT(session);
    
    // Se não encontrou no JWT, busca no banco de dados
    if (!userRole) {
      console.log('⚠️ Role não encontrado no JWT, buscando no banco...');
      userRole = await fetchUserRoleFromDB(session.user.id);
    }
    
    console.log('📋 Criando perfil do usuário:', {
      id: session.user.id,
      email: session.user.email,
      role: userRole,
      source: userRole === extractUserRoleFromJWT(session) ? 'JWT' : 'Database'
    });
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      role: userRole,
      data_criacao: session.user.created_at
    };
  }, [extractUserRoleFromJWT, fetchUserRoleFromDB]);

  // CORRIGIDA: Verificação Super Admin mais robusta com múltiplas verificações
  const isSuperAdmin = useCallback((profile: UserProfile | null, sessionData: Session | null): boolean => {
    if (!profile || !sessionData) {
      console.log('🔍 SUPER ADMIN CHECK: Sem perfil ou sessão');
      return false;
    }

    // Verificações múltiplas para robustez
    const emailMatch = profile.email === 'jefersonstilver@gmail.com' || 
                      sessionData.user?.email === 'jefersonstilver@gmail.com';
    const roleMatch = profile.role === 'super_admin';
    
    // NOVA: Verificação adicional de ID específico (caso tenha)
    const isTargetUser = sessionData.user?.id && 
                        (profile.email === 'jefersonstilver@gmail.com' || 
                         sessionData.user.email === 'jefersonstilver@gmail.com');
    
    const result = emailMatch && roleMatch && isTargetUser;
    
    console.log('🔍 SUPER ADMIN CHECK DETALHADO:', {
      email: profile.email,
      sessionEmail: sessionData.user?.email,
      role: profile.role,
      userId: sessionData.user?.id,
      emailMatch,
      roleMatch,
      isTargetUser,
      finalResult: result
    });
    
    return result;
  }, []);

  // OTIMIZADA: Atualização de estado com verificação melhorada
  const updateAuthState = useCallback(async (newSession: Session | null) => {
    const newUser = newSession?.user ?? null;
    
    // NOVA: Criar perfil com busca no banco
    const newProfile = newSession ? await createUserProfileFromSession(newSession) : null;
    
    // Log detalhado para debug
    console.log('🔄 AUTH UPDATE DETALHADO:', {
      hasSession: !!newSession,
      email: newUser?.email,
      userId: newUser?.id,
      profileRole: newProfile?.role,
      isSuperAdminResult: isSuperAdmin(newProfile, newSession),
      sessionCreatedAt: newSession?.user?.created_at
    });
    
    // Atualização atômica do estado
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
  }, [createUserProfileFromSession, isSuperAdmin]);

  // NOVA: Função para refrescar perfil do usuário
  const refreshUserProfile = useCallback(async () => {
    if (session?.user?.id) {
      console.log('🔄 Refreshing user profile...');
      const role = await fetchUserRoleFromDB(session.user.id);
      if (role && userProfile) {
        setUserProfile(prev => prev ? { ...prev, role } : null);
      }
    }
  }, [session?.user?.id, userProfile, fetchUserRoleFromDB]);

  // Inicialização melhorada
  useEffect(() => {
    if (initialized.current) return;
    
    let mounted = true;
    initialized.current = true;

    console.log('🚀 Inicializando autenticação...');

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          console.log('📡 Sessão inicial obtida:', !!initialSession);
          await updateAuthState(initialSession);
        }
      } catch (error) {
        console.error('💥 Erro na inicialização:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listener otimizado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 AUTH EVENT:', event, !!session);
        await updateAuthState(session);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Dependências vazias para executar apenas uma vez

  // Função de logout melhorada
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Iniciando logout...');
      
      // Limpar estado local primeiro
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Limpar storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('⚠️ Erro no logout do Supabase:', error);
      } else {
        console.log('✅ Logout realizado com sucesso');
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('💥 Erro no logout:', error);
      return { success: false, error };
    }
  }, []);

  // Função de verificação de role
  const hasRole = useCallback((requiredRole: string): boolean => {
    if (!userProfile?.role) {
      return false;
    }
    
    if (userProfile.role === 'super_admin') {
      return true;
    }
    
    return userProfile.role === requiredRole;
  }, [userProfile?.role]);

  // Estado computado
  const isLoggedIn = Boolean(user && session && userProfile);
  const computedIsSuperAdmin = isSuperAdmin(userProfile, session);

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    isLoading,
    isLoggedIn,
    logout,
    hasRole,
    refreshUserProfile,
    isSuperAdmin: computedIsSuperAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
