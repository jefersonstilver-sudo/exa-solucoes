import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  // Redirect authenticated users away from login page
  React.useEffect(() => {
    if (isLoading) return; // Wait for auth to load
    
    if (isLoggedIn && userProfile) {
      console.log('🔐 [LOGIN_PAGE] Usuário já autenticado, redirecionando...', {
        email: userProfile.email,
        role: userProfile.role
      });
      
      // Determine redirect based on role
      let targetPath = redirectPath;
      
      if (userProfile.role === 'super_admin') {
        targetPath = redirectPath.startsWith('/super_admin') ? redirectPath : '/super_admin';
      } else if (['admin', 'admin_marketing', 'admin_financeiro'].includes(userProfile.role)) {
        targetPath = redirectPath.startsWith('/admin') ? redirectPath : '/admin';
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
          className="login-novo flex items-center justify-center min-h-[calc(100vh-68px)] px-4 py-12 sm:py-16"
        >
          <Card className="w-full max-w-md rounded-3xl border-0 shadow-[0_30px_70px_-40px_rgba(11,11,13,.45)] p-2 sm:p-4">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <CardTitle className="text-[30px] font-extrabold tracking-tight text-[#0B0B0D] flex items-center justify-center gap-2">
                  {isResetMode ? 'Redefinir senha' : 'Acesse sua conta'}
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
