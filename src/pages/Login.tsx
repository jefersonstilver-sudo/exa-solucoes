
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LogIn, ArrowRight, Mail, Key, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';
import { ClientOnly } from '@/components/ui/client-only';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  // Get the redirect path from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/paineis-digitais/loja';
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // User is already logged in, redirect
        navigate(redirectPath);
      }
    };
    
    checkSession();
  }, [navigate, redirectPath]);
  
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Digite seu email para redefinir a senha");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/confirmacao?type=recovery`
      });
      
      if (error) throw error;
      
      setResetSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha."
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "Erro ao enviar email de redefinição de senha.");
      toast({
        variant: "destructive",
        title: "Erro na redefinição de senha",
        description: error.message || "Não foi possível enviar o email de redefinição."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <ClientOnly>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center min-h-[80vh] px-4"
        >
          <Card className="w-full max-w-md shadow-lg border-indexa-purple/10">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <CardTitle className="text-2xl font-bold text-indexa-purple flex items-center justify-center gap-2">
                  <LogIn size={24} /> {isResetMode ? 'Redefinir senha' : 'Acesse sua conta'}
                </CardTitle>
                <CardDescription>
                  {isResetMode 
                    ? 'Digite seu email para receber instruções de redefinição'
                    : 'Entre com seu email e senha para continuar'}
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
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
              
              {resetSent ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-50 border border-green-200 rounded-md p-4 text-center"
                >
                  <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-green-800 mb-1">Email enviado!</h3>
                  <p className="text-sm text-green-700 mb-4">
                    Enviamos instruções para redefinir sua senha para {email}.
                    Verifique sua caixa de entrada e spam.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsResetMode(false);
                      setResetSent(false);
                    }}
                    className="mt-2"
                  >
                    Voltar ao login
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={isResetMode ? handlePasswordReset : handleLogin} className="space-y-4">
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
                  
                  {!isResetMode && (
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
                  )}
                  
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
                          {isResetMode ? 'Enviando...' : 'Entrando...'}
                        </>
                      ) : (
                        <>
                          {isResetMode ? (
                            <>
                              Enviar instruções <Mail className="ml-2 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Entrar <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </motion.div>
                  
                  {isResetMode && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsResetMode(false)}
                    >
                      Voltar ao login
                    </Button>
                  )}
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Não tem uma conta?</span>{' '}
                <Link 
                  to={`/cadastro${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="font-medium text-indexa-purple hover:text-indexa-purple-dark hover:underline transition-colors"
                >
                  Crie uma agora
                </Link>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                <p>Ao entrar, você concorda com os nossos <a href="#" className="underline hover:text-indexa-purple transition-colors">termos de uso</a> e <a href="#" className="underline hover:text-indexa-purple transition-colors">política de privacidade</a>.</p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </ClientOnly>
    </Layout>
  );
}
