
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

  // Função para buscar role do banco de dados diretamente
  const fetchUserRoleFromDB = useCallback(async (userId: string): Promise<UserRole | null> => {
    try {
      console.log('🔍 [AUTH DEBUG] Buscando role do usuário no banco:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ [AUTH DEBUG] Erro ao buscar role do banco:', error);
        return 'client'; // Fallback para cliente
      }
      
      console.log('✅ [AUTH DEBUG] Role encontrado no banco:', data);
      return data?.role as UserRole || 'client';
    } catch (error) {
      console.error('💥 [AUTH DEBUG] Exceção ao buscar role do banco:', error);
      return 'client'; // Fallback para cliente
    }
  }, []);

  // Função para extrair role do JWT - mantida como fallback
  const extractUserRoleFromJWT = useCallback((session: Session | null): UserRole | null => {
    if (!session?.access_token) {
      return null;
    }
    
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      console.log('🔍 [AUTH DEBUG] JWT payload:', payload);
      return payload.user_role as UserRole || null;
    } catch (error) {
      console.error('❌ [AUTH DEBUG] Erro ao extrair role do JWT:', error);
      return null;
    }
  }, []);

  // CORRIGIDA: Função para criar perfil do usuário com fallback garantido
  const createUserProfileFromSession = useCallback(async (session: Session | null): Promise<UserProfile | null> => {
    if (!session?.user) {
      console.log('⚠️ [AUTH DEBUG] Sem sessão/usuário para criar perfil');
      return null;
    }

    console.log('🔄 [AUTH DEBUG] Criando perfil do usuário:', {
      userId: session.user.id,
      email: session.user.email
    });

    // Primeiro tenta extrair do JWT
    let userRole = extractUserRoleFromJWT(session);
    console.log('🔍 [AUTH DEBUG] Role do JWT:', userRole);
    
    // Se não encontrou no JWT, busca no banco de dados
    if (!userRole) {
      console.log('⚠️ [AUTH DEBUG] Role não encontrado no JWT, buscando no banco...');
      userRole = await fetchUserRoleFromDB(session.user.id);
    }
    
    // Garantir que sempre temos um role
    if (!userRole) {
      console.log('⚠️ [AUTH DEBUG] Nenhum role encontrado, usando client como fallback');
      userRole = 'client';
    }
    
    const profile = {
      id: session.user.id,
      email: session.user.email || '',
      role: userRole,
      data_criacao: session.user.created_at
    };
    
    console.log('✅ [AUTH DEBUG] Perfil criado com sucesso:', profile);
    return profile;
  }, [extractUserRoleFromJWT, fetchUserRoleFromDB]);

  // Verificação Super Admin
  const isSuperAdmin = useCallback((profile: UserProfile | null, sessionData: Session | null): boolean => {
    if (!profile || !sessionData) {
      return false;
    }

    const emailMatch = profile.email === 'jefersonstilver@gmail.com' || 
                      sessionData.user?.email === 'jefersonstilver@gmail.com';
    const roleMatch = profile.role === 'super_admin';
    
    const result = emailMatch && roleMatch;
    
    console.log('🔍 [AUTH DEBUG] Super Admin Check:', {
      email: profile.email,
      role: profile.role,
      result
    });
    
    return result;
  }, []);

  // CORRIGIDA: Atualização de estado com logs detalhados
  const updateAuthState = useCallback(async (newSession: Session | null) => {
    console.log('🔄 [AUTH DEBUG] ===== ATUALIZANDO ESTADO DE AUTH =====');
    console.log('🔄 [AUTH DEBUG] Nova sessão recebida:', !!newSession);
    
    const newUser = newSession?.user ?? null;
    console.log('🔄 [AUTH DEBUG] Novo usuário:', {
      hasUser: !!newUser,
      userId: newUser?.id,
      email: newUser?.email
    });
    
    // Criar perfil com busca no banco
    const newProfile = newSession ? await createUserProfileFromSession(newSession) : null;
    console.log('🔄 [AUTH DEBUG] Novo perfil:', newProfile);
    
    // LÓGICA DE LOGIN SIMPLIFICADA E MAIS ROBUSTA
    const newIsLoggedIn = !!(newSession && newUser && newProfile);
    console.log('🔄 [AUTH DEBUG] Estado de login calculado:', {
      hasSession: !!newSession,
      hasUser: !!newUser,
      hasProfile: !!newProfile,
      isLoggedIn: newIsLoggedIn
    });
    
    // Atualização atômica do estado
    setSession(newSession);
    setUser(newUser);
    setUserProfile(newProfile);
    setIsLoading(false);
    
    console.log('✅ [AUTH DEBUG] Estado atualizado com sucesso');
    console.log('🔄 [AUTH DEBUG] ===== FIM DA ATUALIZAÇÃO =====');
  }, [createUserProfileFromSession]);

  // Função para refrescar perfil do usuário
  const refreshUserProfile = useCallback(async () => {
    if (session?.user?.id) {
      console.log('🔄 [AUTH DEBUG] Refreshing user profile...');
      const role = await fetchUserRoleFromDB(session.user.id);
      if (role && userProfile) {
        setUserProfile(prev => prev ? { ...prev, role } : null);
      }
    }
  }, [session?.user?.id, userProfile, fetchUserRoleFromDB]);

  // Inicialização melhorada com logs
  useEffect(() => {
    if (initialized.current) return;
    
    let mounted = true;
    initialized.current = true;

    console.log('🚀 [AUTH DEBUG] ===== INICIALIZANDO AUTENTICAÇÃO =====');

    const initializeAuth = async () => {
      try {
        console.log('🔍 [AUTH DEBUG] Obtendo sessão inicial...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        console.log('📡 [AUTH DEBUG] Sessão inicial:', {
          hasSession: !!initialSession,
          userId: initialSession?.user?.id,
          email: initialSession?.user?.email
        });
        
        if (mounted) {
          await updateAuthState(initialSession);
        }
      } catch (error) {
        console.error('💥 [AUTH DEBUG] Erro na inicialização:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listener otimizado com logs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 [AUTH DEBUG] ===== AUTH STATE CHANGE =====');
        console.log('🔄 [AUTH DEBUG] Event:', event);
        console.log('🔄 [AUTH DEBUG] Session:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        });
        
        await updateAuthState(session);
        console.log('🔄 [AUTH DEBUG] ===== FIM AUTH STATE CHANGE =====');
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
      console.log('🚪 [AUTH DEBUG] Iniciando logout...');
      
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
        console.warn('⚠️ [AUTH DEBUG] Erro no logout do Supabase:', error);
      } else {
        console.log('✅ [AUTH DEBUG] Logout realizado com sucesso');
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('💥 [AUTH DEBUG] Erro no logout:', error);
      return { success: false, error };
    }
  }, []);

  // Função de verificação de role
  const hasRole = useCallback((requiredRole: string): boolean => {
    if (!userProfile?.role) {
      console.log('⚠️ [AUTH DEBUG] hasRole: Sem role no perfil');
      return false;
    }
    
    if (userProfile.role === 'super_admin') {
      console.log('✅ [AUTH DEBUG] hasRole: Super admin tem acesso total');
      return true;
    }
    
    const hasAccess = userProfile.role === requiredRole;
    console.log('🔍 [AUTH DEBUG] hasRole:', {
      userRole: userProfile.role,
      requiredRole,
      hasAccess
    });
    
    return hasAccess;
  }, [userProfile?.role]);

  // Estado computado com logs
  const isLoggedIn = Boolean(user && session && userProfile);
  const computedIsSuperAdmin = isSuperAdmin(userProfile, session);

  // Log do estado final a cada render
  console.log('📊 [AUTH DEBUG] Estado atual:', {
    hasUser: !!user,
    hasSession: !!session,
    hasUserProfile: !!userProfile,
    isLoggedIn,
    isLoading,
    userEmail: user?.email,
    userRole: userProfile?.role
  });

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
