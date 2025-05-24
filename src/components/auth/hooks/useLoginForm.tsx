
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLoginForm = (redirectPath: string) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('🔐 INÍCIO DO LOGIN - Email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Erro de login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Sua conta ainda não foi confirmada. Verifique seu email.');
        } else if (error.message.includes('Too many requests')) {
          setError('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
        } else {
          setError(`Erro de autenticação: ${error.message}`);
        }
        return;
      }
      
      if (data.session && data.user) {
        console.log('✅ Login bem-sucedido para:', data.user.email);
        
        // Verificar role IMEDIATAMENTE após login
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const userRole = userData?.role;
        const isSuperAdmin = data.user.email === 'jefersonstilver@gmail.com' && userRole === 'super_admin';
        
        console.log('📊 Dados do usuário após login:', {
          email: data.user.email,
          role: userRole,
          isSuperAdmin
        });

        if (isSuperAdmin) {
          console.log('🚀 SUPER ADMIN CONFIRMADO - Redirecionamento para /super_admin');
          toast.success('Login de Super Administrador realizado com sucesso!', {
            duration: 3000
          });
          
          // REDIRECIONAMENTO IMEDIATO para super admin
          navigate('/super_admin', { replace: true });
          return;
        } else {
          // Para usuários regulares
          console.log('👤 Usuário regular detectado');
          toast.success('Login realizado com sucesso!');
          
          if (userRole === 'admin' || userRole === 'client') {
            console.log('🏢 Redirecionando usuário regular para: /anunciante');
            navigate('/anunciante', { replace: true });
          } else {
            const searchParams = new URLSearchParams(location.search);
            const redirectTo = searchParams.get('redirect') || redirectPath;
            console.log('🔄 Redirecionando para path solicitado:', redirectTo);
            navigate(redirectTo, { replace: true });
          }
        }
        
      } else {
        setError('Falha na autenticação. Dados de sessão inválidos.');
      }
    } catch (err: any) {
      console.error('💥 Erro inesperado durante login:', err);
      setError('Ocorreu um erro inesperado. Tente novamente em alguns instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickLogin = () => {
    setEmail('jefersonstilver@gmail.com');
    setPassword('573039');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    setQuickLogin
  };
};
