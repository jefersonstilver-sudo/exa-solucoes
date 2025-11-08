import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { ClientOnly } from '@/components/ui/client-only';
import { LoginForm } from '@/components/auth/LoginForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { ResetSuccessMessage } from '@/components/auth/ResetSuccessMessage';
import { LoginFooter } from '@/components/auth/LoginFooter';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, userProfile, isLoading } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/loja';
  
  // CRITICAL FIX: Redirect authenticated users away from login page
  React.useEffect(() => {
    if (isLoading) return; // Wait for auth to load
    
    if (isLoggedIn && userProfile) {
      // ⚠️ VERIFICAR EMAIL CONFIRMADO
      if (!userProfile.email_verified_at) {
        console.warn('⚠️ [LOGIN_PAGE] Email não confirmado, redirecionando...');
        navigate(`/email-not-confirmed?email=${encodeURIComponent(userProfile.email)}`);
        return;
      }
      
      console.log('🔐 [LOGIN_PAGE] Usuário já autenticado, redirecionando...', {
        email: userProfile.email,
        role: userProfile.role
      });
      
      // Determine redirect based on role
      let targetPath = redirectPath;
      
      if (userProfile.role === 'super_admin') {
        targetPath = '/super_admin';
      } else if (['admin', 'admin_marketing', 'admin_financeiro'].includes(userProfile.role)) {
        targetPath = '/admin';
      } else if (userProfile.role === 'client') {
        targetPath = redirectPath === '/loja' ? '/loja' : redirectPath;
      }
      
      console.log('🎯 [LOGIN_PAGE] Redirecionando para:', targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [isLoggedIn, userProfile, isLoading, navigate, redirectPath]);
  
  return (
    <Layout>
      <ClientOnly>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center min-h-[80vh] px-4"
        >
          <Card className="w-full max-w-md shadow-lg border-[#9C1E1E]/10">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <CardTitle className="text-2xl font-bold text-[#9C1E1E] flex items-center justify-center gap-2">
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
              {resetSent ? (
                <ResetSuccessMessage 
                  email={email} 
                  onBackToLogin={() => {
                    setIsResetMode(false);
                    setResetSent(false);
                  }} 
                />
              ) : isResetMode ? (
                <PasswordResetForm 
                  email={email}
                  setEmail={setEmail}
                  setIsResetMode={setIsResetMode}
                  setResetSent={setResetSent}
                />
              ) : (
                <LoginForm 
                  redirectPath={redirectPath}
                  setIsResetMode={setIsResetMode}
                />
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <LoginFooter redirectPath={redirectPath} />
            </CardFooter>
          </Card>
        </motion.div>
      </ClientOnly>
    </Layout>
  );
}
