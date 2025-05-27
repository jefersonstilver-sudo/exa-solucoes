
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type LoginMode = 'client' | 'admin';

interface UseLoginLogicProps {
  onLoginSuccess?: () => void;
}

export const useLoginLogic = ({ onLoginSuccess }: UseLoginLogicProps = {}) => {
  const [mode, setMode] = useState<LoginMode>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'client' ? 'admin' : 'client');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔐 LoginSelector: Iniciando processo de login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        console.error('🔐 LoginSelector: Erro na autenticação:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('🔐 LoginSelector: Login bem-sucedido!');
        
        // Verificar o papel do usuário através do JWT
        const userRole = data.user.user_metadata?.role;
        console.log('🔐 LoginSelector: Role do usuário:', userRole);
        
        // Verificação básica de permissão sem bloquear o login
        if (mode === 'admin' && userRole !== 'admin' && userRole !== 'super_admin') {
          console.log('🔐 LoginSelector: Usuário sem permissão administrativa, mas não bloquear login');
          toast.info('Você foi logado com sucesso. Use o menu do usuário para acessar suas funcionalidades.');
        }
        
        if (mode === 'client' && (userRole === 'admin' || userRole === 'super_admin')) {
          console.log('🔐 LoginSelector: Admin logando como cliente');
          toast.info('Login realizado! Você tem acesso administrativo disponível no menu do usuário.');
        }
        
        toast.success('Login realizado com sucesso!');
        
        // CORREÇÃO CRÍTICA: Não navegar automaticamente
        // Apenas fechar o dropdown e deixar o usuário na página atual
        console.log('🔐 LoginSelector: Fechando dropdown e mantendo usuário na página atual');
        
        // Limpar formulário
        setEmail('');
        setPassword('');
        
        // Callback para fechar o dropdown
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // Não fazer navegação automática - deixar o UserMenu aparecer
        console.log('🔐 LoginSelector: Login concluído sem navegação');
      }
    } catch (error: any) {
      console.error('🔐 LoginSelector: Erro no processo de login:', error);
      
      let errorMessage = 'Erro ao realizar login';
      
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message === 'Email not confirmed') {
        errorMessage = 'Por favor, confirme seu email antes de fazer login';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    email,
    password,
    loading,
    showPassword,
    toggleMode,
    setEmail,
    setPassword,
    setShowPassword,
    handleLogin
  };
};
