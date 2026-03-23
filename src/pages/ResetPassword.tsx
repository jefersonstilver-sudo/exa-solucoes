import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // IMPORTANT: Register onAuthStateChange BEFORE getSession to catch PASSWORD_RECOVERY
  useEffect(() => {
    let sessionFound = false;

    // 1. Register listener FIRST — catches PASSWORD_RECOVERY from the hash fragment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [RESET] Auth event:', event);
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('✅ PASSWORD_RECOVERY event received');
        sessionFound = true;
        setHasValidSession(true);
        setIsCheckingSession(false);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ SIGNED_IN event (may be recovery)');
        sessionFound = true;
        setHasValidSession(true);
        setIsCheckingSession(false);
      }
    });

    // 2. Then check existing session (in case the event already fired)
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !sessionFound) {
          console.log('✅ Sessão válida encontrada via getSession');
          sessionFound = true;
          setHasValidSession(true);
          setIsCheckingSession(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    };

    checkSession();

    // 3. Extended timeout (10s) to allow for slow networks / cold starts
    const timeout = setTimeout(() => {
      if (!sessionFound) {
        console.log('⏰ [RESET] Timeout reached without session');
        setIsCheckingSession(false);
        setHasValidSession(prev => prev === null ? false : prev);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Password strength validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error('A senha não atende aos requisitos mínimos de segurança');
      return;
    }

    if (!passwordsMatch) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      // Verificar sessão novamente antes de tentar atualizar
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão inválida ou expirada. Por favor, solicite um novo link de redefinição.');
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // Tratamento específico para erro de sessão
        if (error.message.includes('session') || error.message.includes('token')) {
          throw new Error('Link de redefinição expirado ou inválido. Solicite um novo link.');
        }
        throw error;
      }

      toast.success('Senha redefinida com sucesso!');
      
      // Fazer logout para forçar novo login com a nova senha
      await supabase.auth.signOut();
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/login');
    toast.info('Use a opção "Esqueci minha senha" para receber um novo link');
  };

  // Mostrar loading enquanto verifica sessão
  if (isCheckingSession) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Verificando link de redefinição...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Mostrar erro se não houver sessão válida
  if (hasValidSession === false) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Link Expirado ou Inválido
                  </h1>
                  <p className="text-gray-600 mb-6">
                    O link de redefinição de senha expirou ou já foi utilizado.
                  </p>
                </div>

                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Por motivos de segurança, os links de redefinição expiram após 1 hora.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleRequestNewLink}
                  className="w-full"
                  size="lg"
                >
                  Solicitar Novo Link
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-background via-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border">
            <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary" />
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Nova Senha
                </h1>
                <p className="text-muted-foreground">
                  Escolha uma senha forte e segura para sua conta
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite sua senha novamente"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Requisitos da senha:
                  </p>
                  <RequirementItem 
                    met={passwordRequirements.minLength} 
                    text="Mínimo de 8 caracteres" 
                  />
                  <RequirementItem 
                    met={passwordRequirements.hasUpper} 
                    text="Uma letra maiúscula" 
                  />
                  <RequirementItem 
                    met={passwordRequirements.hasLower} 
                    text="Uma letra minúscula" 
                  />
                  <RequirementItem 
                    met={passwordRequirements.hasNumber} 
                    text="Um número" 
                  />
                  <RequirementItem 
                    met={passwordRequirements.hasSpecial} 
                    text="Um caractere especial (!@#$%...)" 
                  />
                  {confirmPassword && (
                    <RequirementItem 
                      met={passwordsMatch} 
                      text="As senhas coincidem" 
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  className="w-full font-semibold py-6 text-lg shadow-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    'Redefinir Senha'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2">
    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
      met ? 'bg-green-500' : 'bg-muted-foreground/30'
    }`}>
      {met && <CheckCircle2 className="w-3 h-3 text-white" />}
    </div>
    <span className={`text-sm ${met ? 'text-green-700 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
      {text}
    </span>
  </div>
);

export default ResetPassword;
