
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/types/userTypes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Buscando perfil para usuário:', userId);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userData && !error) {
        const profile: UserProfile = {
          id: userData.id,
          email: userData.email,
          role: userData.role as UserRole,
          data_criacao: userData.data_criacao
        };
        
        console.log('✅ UserProfile carregado:', {
          email: profile.email,
          role: profile.role,
          isSuperAdmin: profile.email === 'jefersonstilver@gmail.com' && profile.role === 'super_admin'
        });
        
        setUserProfile(profile);
        return profile;
      } else {
        console.error('❌ Erro ao buscar perfil:', error);
      }
    } catch (err) {
      console.error('💥 Erro inesperado ao buscar perfil:', err);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Verificar sessão existente primeiro
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user && mounted) {
          console.log('🔍 Sessão inicial encontrada para:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Carregar perfil imediatamente
          await fetchUserProfile(initialSession.user.id);
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
        
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Carregar perfil imediatamente quando há nova sessão
          await fetchUserProfile(session.user.id);
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
    console.log('🚪 Fazendo logout...');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setUserProfile(null);
      localStorage.clear();
      console.log('✅ Logout realizado com sucesso');
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
