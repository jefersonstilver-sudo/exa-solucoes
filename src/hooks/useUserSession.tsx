
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export const useUserSession = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Função para obter o usuário atual
    const getUserData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Erro ao obter usuário:', error);
          setUser(null);
        } else if (data?.user) {
          // Se tivermos um usuário, configure-o
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Obter dados do usuário imediatamente
    getUserData();

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user = session.user;
          setUser({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url
          });
          toast.success('Login realizado com sucesso!');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Limpar listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Limpar localStorage (carrinhos, preferências, etc)
      localStorage.removeItem('indexa_cart');
      localStorage.removeItem('indexa_preferences');
      
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    logout
  };
};
