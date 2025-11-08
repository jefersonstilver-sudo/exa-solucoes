import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

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

  // Derivar isLoggedIn do session E email confirmado
  const isLoggedIn = !!session?.access_token && !!userProfile?.email_verified_at;

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

  // Setup inicial otimizado
  useEffect(() => {
    // 🚨 SECURITY FIX: SEMPRE buscar role de user_roles (JWT não confiável sem hook)
    const fetchUserProfile = async (userId: string, accessToken?: string) => {
      try {
        // ⚠️ CRÍTICO: SEMPRE buscar do banco user_roles (JWT pode estar desatualizado)
        console.log('🔍 Buscando role do usuário:', userId);
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        let role: UserRole = 'client'; // Fallback seguro
        
        if (roleError) {
          console.error('❌ Erro ao buscar role da tabela user_roles:', roleError);
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
          role = (roleData?.role || 'client') as UserRole;
          console.log('✅ Role obtido da tabela user_roles:', role);
        }
        
        // Buscar dados completos do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, nome, cpf, avatar_url, email_verified_at')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.error('❌ Erro ao buscar dados do usuário:', userError);
          setUserProfile(null);
          return;
        }
        
        const profile: UserProfile = {
          id: userId,
          email: userData.email,
          nome: userData.nome,
          documento: userData.cpf,
          avatar_url: userData.avatar_url,
          role: role,
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

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    isLoading,
    isLoggedIn,
    isSuperAdmin,
    isAdmin, // Added for backward compatibility
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
