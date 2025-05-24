
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
      console.log('🔐 INDEXA LOGIN - Iniciando para:', email);
      
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
        console.log('✅ INDEXA LOGIN: Login bem-sucedido para:', data.user.email);
        
        // INDEXA: Extrair role EXCLUSIVAMENTE do JWT
        let userRole = null;
        try {
          const payload = JSON.parse(atob(data.session.access_token.split('.')[1]));
          userRole = payload.user_role;
          console.log('🔍 INDEXA LOGIN: JWT completo decodificado:', {
            user_role: userRole,
            email: payload.email,
            sub: payload.sub,
            iat: new Date(payload.iat * 1000).toLocaleString(),
            exp: new Date(payload.exp * 1000).toLocaleString(),
            tokenValido: payload.exp > (Date.now() / 1000)
          });
        } catch (jwtError) {
          console.error('❌ Erro ao extrair role do JWT:', jwtError);
        }

        // REDIRECIONAMENTO INTELIGENTE BASEADO EM ROLE
        if (userRole === 'super_admin') {
          console.log('🚀 INDEXA LOGIN: SUPER ADMIN CONFIRMADO via JWT - Redirecionamento para /super_admin');
          toast.success('Login de Super Administrador realizado com sucesso!', {
            duration: 3000
          });
          
          navigate('/super_admin', { replace: true });
        } else if (userRole === 'admin') {
          console.log('👤 INDEXA LOGIN: Admin detectado - Redirecionamento para /admin');
          toast.success('Login de Administrador realizado com sucesso!');
          navigate('/admin', { replace: true });
        } else if (userRole === 'client') {
          console.log('👤 INDEXA LOGIN: Cliente detectado - Redirecionamento para /paineis-digitais/loja');
          toast.success('Login realizado com sucesso!');
          navigate('/paineis-digitais/loja', { replace: true });
        } else {
          // Para casos sem role ou role não reconhecida
          const searchParams = new URLSearchParams(location.search);
          const redirectTo = searchParams.get('redirect') || redirectPath;
          console.log('🔄 INDEXA LOGIN: Redirecionando para path solicitado:', redirectTo);
          toast.success('Login realizado com sucesso!');
          navigate(redirectTo, { replace: true });
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
