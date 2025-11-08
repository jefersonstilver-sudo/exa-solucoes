
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
      console.log('🔐 [LOGIN] Tentando autenticar:', email);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (signInError) {
        console.error('❌ [LOGIN] Erro de autenticação:', signInError);
        throw signInError;
      }

      if (!data.user) {
        throw new Error('Usuário não encontrado');
      }

      // FASE 1: VERIFICAÇÃO DE EMAIL OBRIGATÓRIA
      if (!data.user.email_confirmed_at) {
        console.warn('⚠️ [LOGIN] Email não confirmado:', data.user.email);
        
        // Fazer logout imediatamente
        await supabase.auth.signOut();
        
        setError('Email não confirmado. Verifique sua caixa de entrada.');
        toast.error('Email não confirmado', {
          description: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada e spam.',
          duration: 8000
        });
        
        setIsLoading(false);
        return;
      }

      console.log('✅ [LOGIN] Autenticado com sucesso:', {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at
      });

      // Buscar role do usuário no banco
      let userRole = null;
      
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();
        
        userRole = roleData?.role || null;
        console.log('✅ Role obtido do banco user_roles:', userRole);
      } catch (roleError) {
        console.warn('⚠️ Erro ao buscar role de user_roles, tentando users table:', roleError);
        
        // Fallback: tentar buscar da tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        userRole = userData?.role || null;
        console.log('✅ Role obtido da tabela users:', userRole);
      }

      // Determinar caminho de redirecionamento
      const targetPath = getRedirectPath(userRole, redirectPath);
      console.log('🎯 [LOGIN] Redirecionando para:', targetPath);

      // Toast de sucesso
      toast.success('Login realizado com sucesso!', {
        description: `Bem-vindo(a) de volta, ${data.user.email}`
      });

      // FASE 1: REDIRECIONAMENTO SEGURO COM FALLBACK
      // Aguardar um pouco para garantir que o estado seja atualizado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Tentar usar navigate primeiro
      try {
        navigate(targetPath, { replace: true });
        
        // Se depois de 1 segundo ainda estiver na página de login, forçar com window.location
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            console.log('⚠️ [LOGIN] Navigate falhou, usando window.location.href');
            window.location.href = targetPath;
          }
        }, 1000);
      } catch (navError) {
        console.error('❌ [LOGIN] Erro no navigate, usando window.location:', navError);
        window.location.href = targetPath;
      }
      
    } catch (error: any) {
      console.error('❌ [LOGIN] Erro geral:', error);
      
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
