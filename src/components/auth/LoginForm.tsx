
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Key, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

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
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("Por favor, confirme seu email antes de continuar. Verifique sua caixa de entrada.");
        } else {
          throw error;
        }
        return;
      }
      
      if (data.user) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta!"
        });
        
        // Redirect to the intended page
        navigate(redirectPath);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Special case for timing issues with new accounts
      if (error.message.includes("Invalid login credentials")) {
        setError("Email ou senha incorretos. Verifique suas credenciais e tente novamente.");
      } else {
        setError(error.message || "Erro ao fazer login. Verifique suas credenciais.");
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start"
        >
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </motion.div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center text-gray-700">
            <Mail className="h-4 w-4 mr-2 text-indexa-purple" /> Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-indexa-purple/20 focus:border-indexa-purple"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password" className="flex items-center text-gray-700">
              <Key className="h-4 w-4 mr-2 text-indexa-purple" /> Senha
            </Label>
            <button 
              type="button" 
              onClick={() => setIsResetMode(true)} 
              className="text-sm text-indexa-purple hover:text-indexa-purple-dark hover:underline transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-indexa-purple/20 focus:border-indexa-purple"
          />
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            type="submit" 
            className="w-full bg-indexa-purple hover:bg-indexa-purple-dark transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Entrando...
              </>
            ) : (
              <>
                Entrar <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </>
  );
};
