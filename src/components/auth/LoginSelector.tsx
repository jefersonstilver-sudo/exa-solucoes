
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogIn, Eye, EyeOff, User, ShieldCheck } from 'lucide-react';

type LoginMode = 'client' | 'admin';

interface LoginSelectorProps {
  onLoginSuccess?: () => void;
}

const LoginSelector: React.FC<LoginSelectorProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<LoginMode>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Função para alternar entre os modos
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

  return (
    <div className="absolute right-0 top-[60px] w-[350px] bg-gradient-to-br from-[#2a0d5c] via-[#3e1c85] to-[#4f28a1] rounded-xl shadow-xl overflow-hidden z-50">
      <div className="p-5 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Acesso ao Sistema
          </h2>
          
          <div className="flex items-center">
            <div 
              className={`h-7 w-14 rounded-full p-1 cursor-pointer transition-colors ${
                mode === 'admin' ? 'bg-amber-500' : 'bg-indexa-mint'
              }`}
              onClick={toggleMode}
            >
              <motion.div 
                className="h-5 w-5 rounded-full bg-white"
                animate={{ x: mode === 'admin' ? 0 : 28 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
            
            <span className="text-sm ml-2 flex items-center">
              {mode === 'admin' ? (
                <>
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Administrador
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-1" />
                  Anunciante
                </>
              )}
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-400"
                placeholder="exemplo@email.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">Senha</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900/50 border-gray-700 text-white pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                Entrando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="mr-2 h-5 w-5" />
                Entrar
              </div>
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-300">
          © 2025 Indexa Mídia - Todos os direitos reservados
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;
