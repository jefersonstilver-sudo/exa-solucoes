
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Confirmacao() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-confirmed'>('loading');
  const [message, setMessage] = useState('Confirmando seu email...');

  useEffect(() => {
    const confirmUser = async () => {
      try {
        console.log('🔍 [CONFIRMACAO] Iniciando confirmação de email...');
        console.log('🔍 [CONFIRMACAO] URL atual:', window.location.href);
        console.log('🔍 [CONFIRMACAO] Hash:', window.location.hash);
        console.log('🔍 [CONFIRMACAO] Search:', window.location.search);
        
        // Get the hash fragment from the URL
        const hash = window.location.hash;
        
        // Se não há hash, verificar se é recuperação de senha
        if (!hash) {
          const queryParams = new URLSearchParams(window.location.search);
          const type = queryParams.get('type');
          const error = queryParams.get('error');
          const errorDescription = queryParams.get('error_description');
          
          console.log('🔍 [CONFIRMACAO] Query params:', { type, error, errorDescription });
          
          if (error) {
            console.error('❌ [CONFIRMACAO] Erro na URL:', error, errorDescription);
            throw new Error(errorDescription || 'Erro na confirmação');
          }
          
          if (type === 'recovery') {
            setStatus('success');
            setMessage('Link de redefinição de senha válido.');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          throw new Error('Nenhum token de confirmação encontrado na URL');
        }

        // Parse the hash to get the tokens
        const query = new URLSearchParams(hash.replace('#', ''));
        const access_token = query.get('access_token');
        const refresh_token = query.get('refresh_token');
        const type = query.get('type');
        const error = query.get('error');
        const errorDescription = query.get('error_description');
        
        console.log('🔍 [CONFIRMACAO] Tokens extraídos:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          type,
          error,
          errorDescription
        });
        
        // Verificar se há erro no hash
        if (error) {
          console.error('❌ [CONFIRMACAO] Erro no hash:', error, errorDescription);
          
          if (error === 'email_confirm_expired') {
            throw new Error('Link de confirmação expirado. Solicite um novo email de confirmação.');
          } else if (error === 'email_confirm_invalid') {
            throw new Error('Link de confirmação inválido ou já utilizado.');
          } else {
            throw new Error(errorDescription || 'Erro na confirmação do email');
          }
        }
        
        if (!access_token || !refresh_token) {
          throw new Error('Tokens de autenticação não encontrados na URL');
        }

        // Verificar sessão atual antes de definir nova
        const { data: currentSession } = await supabase.auth.getSession();
        console.log('🔍 [CONFIRMACAO] Sessão atual:', {
          hasSession: !!currentSession.session,
          userEmail: currentSession.session?.user?.email,
          emailConfirmed: currentSession.session?.user?.email_confirmed_at
        });

        // Set the session with the tokens
        console.log('🔐 [CONFIRMACAO] Configurando nova sessão...');
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
        console.log('🔍 [CONFIRMACAO] Email confirmado em:', emailConfirmedAt);
        
        if (!emailConfirmedAt) {
          console.warn('⚠️ [CONFIRMACAO] Email ainda não confirmado após setSession');
        }
        
        // Success!
        console.log('✅ [CONFIRMACAO] Email confirmado com sucesso!');
        console.log('✅ [CONFIRMACAO] Usuário:', sessionData.session?.user?.email);
        
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
                <p className="text-sm text-gray-500 mt-2">
                  Aguarde enquanto processamos sua confirmação...
                </p>
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
                <p className="text-sm text-gray-500 mt-2">
                  Redirecionando para a loja...
                </p>
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
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Voltar para Início
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
