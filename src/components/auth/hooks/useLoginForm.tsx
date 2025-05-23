
import { useState, useEffect } from 'react';
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
  
  // Check auth status on component load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao verificar sessão:', error);
        } else if (data.session) {
          console.log('Sessão encontrada:', data.session.user.email);
          
          // Check if user is admin and redirect accordingly
          const userRole = await getUserRole(data.session.user.id);
          if (userRole === 'admin' || userRole === 'super_admin') {
            navigate('/admin');
          } else {
            navigate('/client/comprar');
          }
        }
      } catch (err) {
        console.error('Erro inesperado:', err);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Helper function to get user role with fallback
  const getUserRole = async (userId: string): Promise<string | null> => {
    try {
      // First try to get from session metadata
      const { data: sessionData } = await supabase.auth.getSession();
      const metadataRole = sessionData.session?.user?.user_metadata?.role;
      
      if (metadataRole) {
        console.log('Role encontrado nos metadados:', metadataRole);
        return metadataRole;
      }
      
      // Fallback: query users table
      console.log('Role não encontrado nos metadados, consultando tabela users...');
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error || !userData) {
        console.error('Erro ao buscar role na tabela users:', error);
        return null;
      }
      
      console.log('Role encontrado na tabela users:', userData.role);
      return userData.role;
    } catch (err) {
      console.error('Erro ao determinar role do usuário:', err);
      return null;
    }
  };

  // Function to recreate master admin user
  const recreateMasterAdmin = async () => {
    try {
      console.log('Recriando usuário master admin...');
      
      const { data: recreateResult, error: recreateError } = await supabase.functions.invoke('recreate-master-admin');
      
      if (recreateError) {
        console.error('Erro ao recriar master admin:', recreateError);
        throw recreateError;
      }
      
      console.log('Master admin recriado com sucesso:', recreateResult);
      return recreateResult;
    } catch (err) {
      console.error('Erro na recriação do master admin:', err);
      throw err;
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('Tentando fazer login com:', email);
      
      // Clear any existing session first
      await supabase.auth.signOut();
      console.log('Sessão anterior limpa');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro de login detalhado:', error);
        
        // For master admin with invalid credentials, try to recreate the user
        if (email === 'jefersonstilver@gmail.com' && error.message.includes('Invalid login credentials')) {
          console.log('Detectado erro de credenciais para master admin, tentando recriar usuário...');
          
          try {
            await recreateMasterAdmin();
            toast.success('Usuário master admin recriado! Tentando login novamente...');
            
            // Wait a moment for the user to be fully created
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try login again after recreation
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (!retryError && retryData.session) {
              console.log('Login bem-sucedido após recriação do usuário');
              toast.success('Login realizado com sucesso após recriação do usuário!');
              navigate('/admin');
              return;
            } else {
              console.error('Login ainda falhou após recriação:', retryError);
              setError('Falha no login mesmo após recriação do usuário. Contate o suporte.');
            }
          } catch (recreateErr) {
            console.error('Erro na recriação automática:', recreateErr);
            setError('Erro ao recriar usuário master admin. Contate o suporte.');
          }
          return;
        }
        
        // Standard error handling
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
        console.log('Login bem-sucedido:', data.user.email);
        toast.success('Login realizado com sucesso!');
        
        // Verificar role do usuário com fallback robusto
        const userRole = await getUserRole(data.user.id);
        console.log('Role determinado:', userRole);
        
        // Wait a bit to ensure session is properly established
        setTimeout(() => {
          if (userRole === 'admin' || userRole === 'super_admin') {
            console.log('Redirecionando admin para: /admin');
            navigate('/admin');
          } else {
            // Get redirect path from URL if present
            const searchParams = new URLSearchParams(location.search);
            const redirectTo = searchParams.get('redirect') || redirectPath;
            console.log('Redirecionando usuário para:', redirectTo);
            navigate(redirectTo);
          }
        }, 500);
      } else {
        setError('Falha na autenticação. Dados de sessão inválidos.');
      }
    } catch (err: any) {
      console.error('Erro inesperado durante login:', err);
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
