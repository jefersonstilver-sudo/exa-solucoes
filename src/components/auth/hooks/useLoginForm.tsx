
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const useLoginForm = (redirectPath: string = '/') => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { userProfile, isLoading: authLoading } = useAuth();

  // Função para determinar rota baseada no papel do usuário
  const getRedirectPath = (userRole: string | undefined, fallbackPath: string): string => {
    console.log('🎯 Determinando redirecionamento para role:', userRole);
    
    switch (userRole) {
      case 'super_admin':
        return '/super_admin';
      case 'admin':
        return '/admin';
      case 'admin_marketing':
        return '/admin';
      case 'client':
        return fallbackPath === '/paineis-digitais/loja' ? '/loja' : fallbackPath;
      default:
        // Se não conseguir determinar o papel, usar fallback corrigido
        return fallbackPath === '/paineis-digitais/loja' ? '/loja' : fallbackPath;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 LoginForm: Tentando fazer login...');
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error('🔐 LoginForm: Erro de autenticação:', authError);
        throw authError;
      }

      if (data.user) {
        console.log('🔐 LoginForm: Login bem-sucedido, aguardando perfil do usuário...');
        
        toast.success('Login realizado com sucesso!');
        
        // Aguardar um momento para o hook useAuth processar as informações
        setTimeout(() => {
          console.log('🔍 Verificando perfil para redirecionamento...');
          
          // Verificar múltiplas vezes até obter o perfil ou timeout
          let attempts = 0;
          const maxAttempts = 10;
          
          const checkProfileAndRedirect = () => {
            attempts++;
            console.log(`🔄 Tentativa ${attempts}/${maxAttempts} - Perfil:`, userProfile);
            
            if (userProfile?.role || attempts >= maxAttempts) {
              const targetPath = getRedirectPath(userProfile?.role, redirectPath);
              console.log('🎯 Redirecionando para:', targetPath);
              
              navigate(targetPath, { replace: true });
            } else if (attempts < maxAttempts) {
              // Tentar novamente em 200ms
              setTimeout(checkProfileAndRedirect, 200);
            } else {
              // Fallback após timeout
              console.warn('⚠️ Timeout aguardando perfil, usando fallback');
              const fallbackPath = redirectPath === '/paineis-digitais/loja' ? '/loja' : redirectPath;
              navigate(fallbackPath, { replace: true });
            }
          };
          
          checkProfileAndRedirect();
        }, 100);
      }
    } catch (error: any) {
      console.error('🔐 LoginForm: Erro no login:', error);

      let errorMessage = 'Erro ao fazer login';
      
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message === 'Email not confirmed') {
        errorMessage = 'Por favor, confirme seu email antes de fazer login';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit
  };
};
