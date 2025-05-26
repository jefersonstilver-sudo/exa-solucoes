
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const useLoginForm = (redirectPath: string = '/paineis-digitais/loja') => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 LoginForm: Tentando fazer login para email:', email);
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error('🔐 LoginForm: Erro de autenticação:', authError);
        throw authError;
      }

      if (data.user) {
        console.log('🔐 LoginForm: Login bem-sucedido, redirecionando para:', redirectPath);
        
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.SUCCESS,
          'Login realizado com sucesso via formulário',
          { 
            userId: data.user.id, 
            email: data.user.email,
            redirectPath,
            timestamp: new Date().toISOString() 
          }
        );

        toast.success('Login realizado com sucesso!');
        
        // FIXED: Use the redirectPath passed from props
        navigate(redirectPath);
      }
    } catch (error: any) {
      console.error('🔐 LoginForm: Erro no login:', error);
      
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT,
        LogLevel.ERROR,
        `Erro no login: ${error.message}`,
        { 
          email,
          error: error.message,
          redirectPath,
          timestamp: new Date().toISOString() 
        }
      );

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
