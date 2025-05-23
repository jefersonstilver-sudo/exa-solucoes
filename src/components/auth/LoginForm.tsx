
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LogIn, AlertTriangle } from 'lucide-react';

interface LoginFormProps {
  redirectPath: string;
  setIsResetMode: (value: boolean) => void;
}

export const LoginForm = ({ redirectPath, setIsResetMode }: LoginFormProps) => {
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
          const userRole = data.session.user.user_metadata?.role;
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
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('Tentando fazer login com:', email);
      
      // Primeiro, tente limpar qualquer sessão existente
      await supabase.auth.signOut();
      console.log('Sessão anterior limpa');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro de login detalhado:', error);
        
        // Tratamento específico de erros
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
        
        // Verificar role do usuário e redirecionar adequadamente
        const userRole = data.user.user_metadata?.role;
        console.log('User role from metadata:', userRole);
        
        // Wait a bit to ensure session is properly established
        setTimeout(() => {
          if (userRole === 'admin' || userRole === 'super_admin') {
            console.log('Redirecionando admin para:/admin');
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Button
              variant="link"
              type="button"
              className="text-xs text-indexa-purple p-0 h-auto font-normal"
              onClick={() => setIsResetMode(true)}
              disabled={isLoading}
            >
              Esqueceu a senha?
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-indexa-purple hover:bg-indexa-purple-dark transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entrando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn size={18} /> Entrar
            </span>
          )}
        </Button>
      </form>
      
      {/* Quick login button for admin with new password */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          className="w-full text-xs"
          onClick={() => {
            setEmail('jefersonstilver@gmail.com');
            setPassword('admin123456'); // Nova senha padrão
          }}
        >
          Login Rápido (Master Admin) - Nova Senha
        </Button>
      </div>
    </motion.div>
  );
};
