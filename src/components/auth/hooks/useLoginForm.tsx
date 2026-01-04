
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLoginForm = (redirectPath: string = '/') => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
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

      // 🚨 VERIFICAÇÃO CRÍTICA: EMAIL NÃO CONFIRMADO
      if (!data.user.email_confirmed_at) {
        console.warn('⚠️ [LOGIN] Email não confirmado detectado:', data.user.email);
        
        // Prevenir múltiplas execuções
        if (isRedirecting) {
          console.log('⏸️ [LOGIN] Já está redirecionando, ignorando tentativa duplicada');
          return;
        }
        
        setIsRedirecting(true);
        setIsLoading(true);
        
        console.log('🚪 [LOGIN] Iniciando processo de logout...');
        
        // Fazer logout COMPLETO antes de redirecionar
        const { error: signOutError } = await supabase.auth.signOut();
        
        if (signOutError) {
          console.error('❌ [LOGIN] Erro ao fazer signOut:', signOutError);
        } else {
          console.log('✅ [LOGIN] SignOut concluído com sucesso');
        }
        
        // Limpar estados locais
        setEmail('');
        setPassword('');
        setError('');
        
        // Aguardar para garantir que o logout foi processado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Usar window.location.replace para navegação limpa SEM histórico
        const redirectUrl = `/email-not-confirmed?email=${encodeURIComponent(data.user.email || '')}`;
        console.log('🎯 [LOGIN] Redirecionando para página de confirmação:', redirectUrl);
        console.log('🔒 [LOGIN] Esta página NÃO permitirá volta para /admin ou /login');
        
        window.location.replace(redirectUrl);
        
        // Não continuar a execução
        return;
      }

      console.log('✅ [LOGIN] Autenticado com sucesso:', {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at
      });

      // Verificar se usuário está bloqueado ou tem 2FA ativado
      const { data: userData } = await supabase
        .from('users')
        .select('two_factor_enabled, telefone, role, is_blocked')
        .eq('id', data.user.id)
        .single();

      // 🚨 VERIFICAÇÃO CRÍTICA: USUÁRIO BLOQUEADO
      if (userData?.is_blocked) {
        console.warn('🚫 [LOGIN] Usuário bloqueado detectado:', data.user.email);
        
        // Fazer logout
        await supabase.auth.signOut();
        
        setError('Sua conta foi bloqueada. Entre em contato com o administrador.');
        toast.error('Conta bloqueada', {
          description: 'Sua conta foi bloqueada pelo administrador do sistema.'
        });
        
        setIsLoading(false);
        return;
      }

      // Se 2FA estiver ativado, enviar código e redirecionar
      if (userData?.two_factor_enabled && userData?.telefone) {
        console.log('🔐 [LOGIN] 2FA detectado, enviando código');
        
        try {
          await supabase.functions.invoke('send-user-whatsapp-code', {
            body: { 
              userId: data.user.id, 
              telefone: userData.telefone,
              tipo: '2fa_login' 
            }
          });

          toast.info('Código de verificação enviado para seu WhatsApp');
          navigate(`/verificacao-2fa?userId=${data.user.id}`);
          return;
        } catch (error) {
          console.error('❌ [LOGIN] Erro ao enviar código 2FA:', error);
          toast.error('Erro ao enviar código de verificação');
        }
      }

      // Buscar role prioritário do usuário via RPC (evita bug de duplicatas)
      let userRole = userData?.role || null;
      
      try {
        const { data: highestRole, error: roleError } = await supabase
          .rpc('get_user_highest_role', { p_user_id: data.user.id });
        
        if (roleError) {
          console.warn('⚠️ Erro ao buscar role via RPC:', roleError);
          // Fallback: usar role da tabela users
          userRole = userData?.role || null;
        } else {
          userRole = highestRole || null;
          console.log('✅ Role prioritário obtido via RPC:', userRole);
        }
      } catch (roleError) {
        console.warn('⚠️ Exceção ao buscar role via RPC, usando fallback:', roleError);
        userRole = userData?.role || null;
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
