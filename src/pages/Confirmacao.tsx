
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
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-confirmed' | 'expired'>('loading');
  const [message, setMessage] = useState('Confirmando seu email...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { resendConfirmationEmail, isResending } = useEmailConfirmation();

  useEffect(() => {
    const confirmUser = async () => {
      try {
        console.log('🔍 [CONFIRMACAO] Iniciando confirmação de email...');
        console.log('🔍 [CONFIRMACAO] URL completa:', window.location.href);
        
        // Parse da URL atual
        const url = new URL(window.location.href);
        
        // Verificar se há erro nos parâmetros da URL
        const error = url.searchParams.get('error') || url.hash.match(/error=([^&]+)/)?.[1];
        const errorDescription = url.searchParams.get('error_description') || 
                                url.hash.match(/error_description=([^&]+)/)?.[1];
        
        if (error) {
          console.error('❌ [CONFIRMACAO] Erro na URL:', error, errorDescription);
          
          const decodedError = decodeURIComponent(errorDescription || '');
          
          if (error === 'access_denied' || decodedError.includes('expired') || decodedError.includes('invalid')) {
            setStatus('expired');
            setMessage('Link de confirmação expirado ou inválido. Você pode solicitar um novo email de confirmação.');
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
          type
        });
        
        if (!access_token || !refresh_token) {
          setStatus('expired');
          setMessage('Link de confirmação inválido ou expirado.');
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
          throw sessionError;
        }
        
        // Verificar se o email foi confirmado
        const emailConfirmedAt = sessionData.session?.user?.email_confirmed_at;
        const email = sessionData.session?.user?.email;
        setUserEmail(email || null);
        
        console.log('🔍 [CONFIRMACAO] Status da confirmação:', {
          emailConfirmedAt,
          email
        });
        
        if (!emailConfirmedAt) {
          setStatus('error');
          setMessage('Erro na confirmação. Tente novamente ou solicite um novo email.');
          return;
        }
        
        // Sucesso!
        console.log('✅ [CONFIRMACAO] Email confirmado com sucesso!');
        setStatus('success');
        
        if (type === 'signup') {
          setMessage('Email confirmado com sucesso! Bem-vindo(a) à Indexa!');
          toast.success('Email confirmado! Sua conta está ativa.');
          
          // Redirecionar para a loja após confirmação
          setTimeout(() => navigate('/loja'), 2000);
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[80vh] px-4"
      >
        <Card className="w-full max-w-md shadow-lg border-indexa-purple/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-indexa-purple">
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
                <Loader2 className="h-16 w-16 text-indexa-purple animate-spin mx-auto mb-4" />
                <p className="text-lg text-gray-700">{message}</p>
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
                    className="bg-indexa-purple hover:bg-indexa-purple-dark"
                  >
                    Ir para a Loja
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
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
                      className="bg-indexa-purple hover:bg-indexa-purple-dark flex items-center gap-2"
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
                    className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
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
                      className="bg-indexa-purple hover:bg-indexa-purple-dark flex items-center gap-2"
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
                    className="bg-indexa-purple hover:bg-indexa-purple-dark"
                  >
                    Criar Nova Conta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
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
                    className="bg-indexa-purple hover:bg-indexa-purple-dark"
                  >
                    Fazer Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/loja')}
                    className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
                  >
                    Ir para a Loja
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}
