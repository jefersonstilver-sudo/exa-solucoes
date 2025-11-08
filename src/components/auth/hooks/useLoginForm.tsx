
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLoginForm = (redirectPath: string = '/') => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Função para determinar rota baseada no papel do usuário
  const getRedirectPath = (userRole: string | undefined, fallbackPath: string): string => {
    console.log('🎯 Determinando redirecionamento para role:', userRole);
    
    switch (userRole) {
      case 'super_admin':
        return '/super_admin';
      case 'admin':
      case 'admin_marketing':
      case 'admin_financeiro':
        return '/admin';
      case 'client':
        return fallbackPath === '/paineis-digitais/loja' ? '/loja' : fallbackPath;
      default:
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

      if (data.user && data.session) {
        console.log('🔐 LoginForm: Login bem-sucedido, redirecionando imediatamente...');
        
        toast.success('Login realizado com sucesso!');
        
        // Extrair role diretamente da sessão para redirecionamento imediato
        const userRole = data.session.access_token ? 
          (() => {
            try {
              const payload = JSON.parse(atob(data.session.access_token.split('.')[1]));
              return payload.user_role;
            } catch (error) {
              console.warn('🔐 Não foi possível extrair role do JWT, usando fallback');
              return null;
            }
          })() : null;

        // Redirecionamento IMEDIATO baseado na role
        const targetPath = getRedirectPath(userRole, redirectPath);
        console.log('🎯 Redirecionando IMEDIATAMENTE para:', targetPath);
        
        navigate(targetPath, { replace: true });
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
