import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole, UserDepartment } from '@/types/userTypes';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean; // Added for backward compatibility
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derivar isLoggedIn do session e userProfile (email_verified_at verificado no login)
  const isLoggedIn = !!session?.access_token && !!userProfile;
  
  // Log de debug para diagnosticar problemas de autenticação
  useEffect(() => {
    console.log('🔍 [useAuth] Estado de autenticação:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      hasUserProfile: !!userProfile,
      isLoggedIn,
      isLoading,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      profileRole: userProfile?.role
    });
  }, [session, userProfile, isLoggedIn, isLoading]);

  // Derivar isSuperAdmin - APENAS verificar role, não email
  const isSuperAdmin = userProfile?.role === 'super_admin';

  // Derivar isAdmin (backward compatibility)
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  // 🚨 SECURITY: Função para extrair role do JWT (com admin_financeiro)
  const extractRoleFromJWT = (accessToken: string): UserRole | null => {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const role = payload.user_role || payload.role;
      // Validate that the role is a valid UserRole (INCLUINDO admin_financeiro)
      if (role && ['client', 'admin', 'admin_marketing', 'admin_financeiro', 'super_admin', 'painel'].includes(role)) {
        return role as UserRole;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao extrair role do JWT:', error);
      return null;
    }
  };

  // Função simplificada para verificar role (usa userProfile, não JWT)
  const hasRole = (role: string): boolean => {
    return userProfile?.role === role;
  };

  // Função otimizada de logout
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  // Função para buscar perfil do usuário (movida para fora do useEffect para reutilização)
  const fetchUserProfile = async (userId: string, accessToken?: string) => {
    try {
      // ⚠️ CRÍTICO: Usar RPC get_user_highest_role para buscar role de maior prioridade
      // Isso evita bug de duplicatas onde admin logava como client
      console.log('🔍 Buscando role prioritário do usuário:', userId);
      const { data: highestRole, error: roleError } = await supabase
        .rpc('get_user_highest_role', { p_user_id: userId });
      
      let role: UserRole = 'admin_departamental'; // Fallback seguro para usuários internos
      
      if (roleError) {
        console.error('❌ Erro ao buscar role via RPC:', roleError);
        // Fallback: tentar buscar da tabela users
        const { data: userRoleData } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (userRoleData?.role) {
          role = userRoleData.role as UserRole;
          console.log('✅ Role obtido da tabela users (fallback):', role);
        }
      } else {
        role = (highestRole || 'client') as UserRole;
        console.log('✅ Role prioritário obtido via RPC:', role);
      }
      
      // Buscar dados completos do usuário COM departamento
      let userData = null;
      let userError = null;
      
      const userResult = await supabase
        .from('users')
        .select(`
          id, email, nome, cpf, avatar_url, email_verified_at, departamento_id,
          departamento:process_departments(id, name, color, icon, display_order)
        `)
        .eq('id', userId)
        .maybeSingle();
      
      userData = userResult.data;
      userError = userResult.error;
      
      // FALLBACK: Se usuário não existe em public.users, sincronizar de auth.users
      if (!userData && !userError) {
        console.warn('⚠️ [useAuth] Usuário não encontrado em public.users, tentando sincronizar...');
        
        try {
          const { data: syncResult, error: syncError } = await supabase
            .rpc('sync_auth_user_to_public', { auth_user_id: userId });

          if (syncError) {
            console.error('❌ [useAuth] Erro ao sincronizar usuário:', syncError);
            setUserProfile(null);
            return;
          }

          console.log('✅ [useAuth] Usuário sincronizado:', syncResult);

          // Tentar buscar novamente após sincronização
          const retryResult = await supabase
            .from('users')
            .select('id, email, nome, cpf, avatar_url, email_verified_at')
            .eq('id', userId)
            .maybeSingle();

          userData = retryResult.data;
          userError = retryResult.error;

          if (!userData || userError) {
            console.error('❌ [useAuth] Erro ao buscar usuário após sincronização:', userError);
            setUserProfile(null);
            return;
          }
          
          console.log('✅ [useAuth] Usuário carregado após sincronização');
          
        } catch (syncException) {
          console.error('❌ [useAuth] Exceção ao sincronizar usuário:', syncException);
          setUserProfile(null);
          return;
        }
      } else if (userError) {
        console.error('❌ Erro ao buscar dados do usuário:', userError);
        setUserProfile(null);
        return;
      }
      
      // Processar departamento (pode vir como array ou objeto)
      let departamento: UserDepartment | undefined;
      if (userData.departamento) {
        const dept = Array.isArray(userData.departamento) 
          ? userData.departamento[0] 
          : userData.departamento;
        if (dept) {
          departamento = {
            id: dept.id,
            name: dept.name,
            color: dept.color,
            icon: dept.icon,
            display_order: dept.display_order
          };
        }
      }
      
      const profile: UserProfile = {
        id: userId,
        email: userData.email,
        nome: userData.nome,
        documento: userData.cpf,
        avatar_url: userData.avatar_url,
        role: role,
        departamento_id: userData.departamento_id,
        departamento: departamento,
        email_verified_at: userData.email_verified_at
      };
      
      setUserProfile(profile);
      console.log('✅ Profile carregado com sucesso:', { 
        userId,
        email: profile.email, 
        role: profile.role 
      });
      console.log('🔍 DEBUG DETALHADO - Profile completo:', JSON.stringify(profile, null, 2));
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar profile:', error);
      setUserProfile(null);
    }
  };

  // Setup inicial otimizado
  useEffect(() => {
    // Verificação de existência do usuário removida para evitar logouts indesejados durante checkout

    // Verificação de existência do usuário removida para evitar logouts indesejados durante checkout

    // Listener de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Buscar profile completo do banco (NÃO apenas JWT)
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id, session.access_token);
        }, 0);
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    // Verificação inicial da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id, session.access_token);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para recarregar o perfil do usuário (útil após edições)
  const refreshUserProfile = async (): Promise<void> => {
    if (session?.user?.id && session?.access_token) {
      console.log('🔄 [useAuth] Recarregando perfil do usuário...', { userId: session.user.id });
      await fetchUserProfile(session.user.id, session.access_token);
      console.log('✅ [useAuth] Perfil recarregado com sucesso!');
    } else {
      console.warn('⚠️ [useAuth] Não foi possível recarregar perfil - sessão inválida');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    isLoading,
    isLoggedIn,
    isSuperAdmin,
    isAdmin, // Added for backward compatibility
    logout,
    hasRole,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
