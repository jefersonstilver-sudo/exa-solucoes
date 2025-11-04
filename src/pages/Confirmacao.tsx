
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, AlertCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useEmailConfirmation } from '@/hooks/useEmailConfirmation';

export default function Confirmacao() {
  console.log('🚀 [CONFIRMACAO] Componente Confirmacao renderizado!');
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-confirmed' | 'expired'>('loading');
  const [message, setMessage] = useState('Confirmando seu email...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { resendConfirmationEmail, isResending } = useEmailConfirmation();

  useEffect(() => {
    const confirmUser = async () => {
      try {
        console.log('🔍 [CONFIRMACAO] Iniciando confirmação de email...');
        console.log('🔍 [CONFIRMACAO] URL completa:', window.location.href);
        
        // Parse da URL atual com validação robusta
        const url = new URL(window.location.href);
        
        // Debug: Log completo da URL
        const debugData = {
          href: url.href,
          origin: url.origin,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          hostname: url.hostname,
          host: url.host,
          isValidRoute: url.pathname === '/confirmacao'
        };
        setDebugInfo(debugData);
        console.log('🔍 [CONFIRMACAO] Debug URL:', debugData);
        
        // CORREÇÃO: Verificar se estamos na rota correta
        if (url.pathname !== '/confirmacao') {
          console.error('❌ [CONFIRMACAO] Rota incorreta:', url.pathname);
          setStatus('error');
          setMessage(`Página não encontrada. Rota atual: ${url.pathname}. Esperado: /confirmacao`);
          return;
        }
        
        // Verificar se há erro nos parâmetros da URL
        const error = url.searchParams.get('error') || url.hash.match(/error=([^&]+)/)?.[1];
        const errorDescription = url.searchParams.get('error_description') || 
                                url.hash.match(/error_description=([^&]+)/)?.[1];
        
        if (error) {
          console.error('❌ [CONFIRMACAO] Erro na URL:', error, errorDescription);
          
          const decodedError = decodeURIComponent(errorDescription || '');
          
          // DETECÇÃO MELHORADA de tokens expirados
          if (error === 'access_denied' || 
              decodedError.includes('expired') || 
              decodedError.includes('invalid') ||
              decodedError.includes('otp_expired') ||
              error === 'invalid_request') {
            setStatus('expired');
            setMessage('Link de confirmação expirado ou inválido. Enviamos um novo email automaticamente.');
            
            // AUTO-REENVIO quando detectamos token expirado
            const emailFromUrl = url.searchParams.get('email') || url.hash.match(/email=([^&]+)/)?.[1];
            if (emailFromUrl) {
              const decodedEmail = decodeURIComponent(emailFromUrl);
              setUserEmail(decodedEmail);
              console.log('🔄 [CONFIRMACAO] Iniciando auto-reenvio para:', decodedEmail);
              // Aguardar um pouco antes do auto-reenvio
              setTimeout(() => {
                resendConfirmationEmail(decodedEmail);
              }, 1500);
            }
          } else {
            setStatus('error');
            setMessage(decodedError || 'Erro na confirmação do email');
          }
          return;
        }

        // Extrair tokens do hash
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('🔍 [CONFIRMACAO] Tokens encontrados:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          type,
          hashLength: hash.length
        });
        
        if (!access_token || !refresh_token) {
          console.error('❌ [CONFIRMACAO] Tokens não encontrados');
          setStatus('expired');
          setMessage('Link de confirmação inválido ou expirado. Verifique se copiou o link completo do email.');
          return;
        }

        // Configurar sessão com os tokens
        console.log('🔐 [CONFIRMACAO] Configurando sessão...');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error('❌ [CONFIRMACAO] Erro ao configurar sessão:', sessionError);
          
          // Tratamento específico para diferentes tipos de erro
          if (sessionError.message?.includes('invalid') || 
              sessionError.message?.includes('expired') ||
              sessionError.message?.includes('otp_expired') ||
              sessionError.code === 'invalid_grant') {
            setStatus('expired');
            setMessage('Link de confirmação expirado. Enviando novo email automaticamente...');
            
            // AUTO-REENVIO quando sessão falha por token expirado
            if (userEmail) {
              console.log('🔄 [CONFIRMACAO] Auto-reenvio por erro de sessão para:', userEmail);
              setTimeout(() => {
                resendConfirmationEmail(userEmail);
              }, 1000);
            }
          } else {
            setStatus('error');
            setMessage(`Erro na autenticação: ${sessionError.message}`);
          }
          return;
        }
        
        // Verificar se o email foi confirmado
        const emailConfirmedAt = sessionData.session?.user?.email_confirmed_at;
        const email = sessionData.session?.user?.email;
        setUserEmail(email || null);
        
        console.log('🔍 [CONFIRMACAO] Status da confirmação:', {
          emailConfirmedAt,
          email,
          userId: sessionData.session?.user?.id
        });
        
        if (!emailConfirmedAt) {
          setStatus('error');
          setMessage('Erro na confirmação. O email não foi confirmado. Tente novamente ou solicite um novo email.');
          return;
        }
        
        // Sucesso!
        console.log('✅ [CONFIRMACAO] Email confirmado com sucesso!');
        setStatus('success');
        
        // Tratamento baseado no tipo de link
        if (type === 'signup') {
          setMessage('Email confirmado com sucesso! Bem-vindo(a) à EXA!');
          toast.success('Email confirmado! Sua conta está ativa.');
          setTimeout(() => navigate('/loja'), 2000);
        } else if (type === 'recovery') {
          // Link de recovery para usuário já confirmado - redirecionar para login
          setMessage('Email verificado! Redirecionando para o login...');
          toast.success('Verificação concluída! Você pode fazer login normalmente.');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          setMessage('Email confirmado com sucesso!');
          setTimeout(() => navigate('/login'), 3000);
        }
        
      } catch (error: any) {
        console.error('❌ [CONFIRMACAO] Falha na confirmação:', error);
        setStatus('error');
        
        let errorMessage = 'Falha ao confirmar o email';
        
        if (error.message?.includes('expired') || error.message?.includes('expirado')) {
          setStatus('expired');
          errorMessage = 'Link de confirmação expirado. Solicite um novo email de confirmação.';
        } else if (error.message?.includes('invalid') || error.message?.includes('inválido')) {
          errorMessage = 'Link de confirmação inválido. Verifique se copiou o link completo.';
        } else if (error.message?.includes('already') || error.message?.includes('já')) {
          setStatus('already-confirmed');
          errorMessage = 'Este email já foi confirmado anteriormente. Você pode fazer login normalmente.';
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        setMessage(errorMessage);
        toast.error('Erro na confirmação.');
      }
    };

    confirmUser();
  }, [navigate, location]);

  const handleResendEmail = async () => {
    if (!userEmail) {
      toast.error('Email não encontrado');
      return;
    }
    
    await resendConfirmationEmail(userEmail);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700" />
            <CardHeader className="space-y-1 text-center pt-8">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Confirmação de Email
              </CardTitle>
            <CardDescription>
              {status === 'loading' ? 'Processando confirmação...' : 
               status === 'success' ? 'Confirmação realizada!' : 
               status === 'already-confirmed' ? 'Email já confirmado' :
               status === 'expired' ? 'Link expirado' :
               'Erro na confirmação'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            {status === 'loading' && (
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-lg text-gray-700">{message}</p>
                
                {/* Debug info para desenvolvimento */}
                {debugInfo && process.env.NODE_ENV === 'development' && (
                  <details className="mt-4 p-2 bg-gray-100 rounded text-xs text-left">
                    <summary>Debug Info</summary>
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </details>
                )}
              </motion.div>
            )}
            
            {status === 'success' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="bg-green-100 p-4 rounded-full inline-flex mb-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <p className="text-lg text-gray-700 font-medium">{message}</p>
                <div className="flex flex-col gap-3 mt-6">
                  <Button
                    onClick={() => navigate('/loja')}
                    className="bg-[#9C1E1E] hover:bg-[#180A0A]"
                  >
                    Ir para a Loja
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold py-6 text-lg w-full"
                  >
                    Fazer Login
                  </Button>
                </div>
              </motion.div>
            )}

            {status === 'expired' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="bg-amber-100 p-4 rounded-full inline-flex mb-4">
                  <AlertCircle className="h-16 w-16 text-amber-600" />
                </div>
                <p className="text-lg text-gray-700 font-medium">Link Expirado</p>
                <p className="text-sm text-amber-600 mt-2 max-w-sm">
                  {message}
                </p>
                <div className="flex flex-col gap-2 mt-6">
                  {userEmail && (
                    <Button
                      onClick={handleResendEmail}
                      disabled={isResending}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg shadow-lg w-full flex items-center justify-center gap-2"
                    >
                      {isResending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {isResending ? 'Enviando...' : 'Reenviar Email'}
                    </Button>
                  )}
                    <Button
                      variant="outline"
                      onClick={() => navigate('/cadastro')}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold py-6 text-lg w-full"
                    >
                    Criar Nova Conta
                  </Button>
                </div>
              </motion.div>
            )}
            
            {status === 'error' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
                <p className="text-lg text-gray-700 font-medium">Ops! Algo deu errado</p>
                <p className="text-sm text-red-600 mt-2 max-w-sm">
                  {message}
                </p>
                <div className="flex flex-col gap-2 mt-6">
                  {userEmail && (
                    <Button
                      onClick={handleResendEmail}
                      disabled={isResending}
                      className="bg-[#9C1E1E] hover:bg-[#180A0A] flex items-center gap-2"
                    >
                      {isResending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {isResending ? 'Enviando...' : 'Reenviar Email'}
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate('/cadastro')}
                    className="bg-[#9C1E1E] hover:bg-[#180A0A]"
                  >
                    Criar Nova Conta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
                  >
                    Voltar para Login
                  </Button>
                </div>
              </motion.div>
            )}

            {status === 'already-confirmed' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="bg-blue-100 p-4 rounded-full inline-flex mb-4">
                  <AlertCircle className="h-16 w-16 text-blue-600" />
                </div>
                <p className="text-lg text-gray-700 font-medium">Email já confirmado!</p>
                <p className="text-sm text-blue-600 mt-2 max-w-sm">
                  {message}
                </p>
                <div className="flex flex-col gap-2 mt-6">
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-[#9C1E1E] hover:bg-[#180A0A]"
                  >
                    Fazer Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/loja')}
                    className="border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
                  >
                    Ir para a Loja
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
