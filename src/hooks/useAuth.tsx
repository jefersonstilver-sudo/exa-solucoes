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

  // Derivar isLoggedIn do session em vez de user
  const isLoggedIn = !!session?.access_token;

  // Derivar isSuperAdmin
  const isSuperAdmin = userProfile?.role === 'super_admin' && userProfile?.email === 'jefersonstilver@gmail.com';

  // Derivar isAdmin (backward compatibility)
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  // Função otimizada para extrair role do JWT
  const extractRoleFromJWT = (accessToken: string): UserRole | null => {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const role = payload.user_role;
      // Validate that the role is a valid UserRole
      if (role && ['client', 'admin', 'admin_marketing', 'super_admin', 'painel'].includes(role)) {
        return role as UserRole;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Função simplificada para verificar role
  const hasRole = (role: string): boolean => {
    if (!session?.access_token) return false;
    const userRole = extractRoleFromJWT(session.access_token);
    return userRole === role;
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
    // Listener de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Criar userProfile mínimo quando necessário
      if (session?.user) {
        const role = session.access_token ? extractRoleFromJWT(session.access_token) : null;
        setUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          role: role || 'client'
        });
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
        const role = session.access_token ? extractRoleFromJWT(session.access_token) : null;
        setUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          role: role || 'client'
        });
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
