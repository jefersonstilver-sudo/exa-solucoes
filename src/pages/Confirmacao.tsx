
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Confirmacao() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando seu email...');

  useEffect(() => {
    const confirmUser = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash;
        
        // If there's no hash, we check if this is a password recovery flow
        if (!hash) {
          // Check for query parameters (type=recovery)
          const queryParams = new URLSearchParams(window.location.search);
          if (queryParams.get('type') === 'recovery') {
            setStatus('success');
            setMessage('Redefinição de senha solicitada com sucesso.');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          // No hash and not a recovery flow means error
          throw new Error('Nenhum token de confirmação encontrado na URL');
        }

        // Parse the hash to get the tokens
        const query = new URLSearchParams(hash.replace('#', ''));
        const access_token = query.get('access_token');
        const refresh_token = query.get('refresh_token');
        
        if (!access_token || !refresh_token) {
          throw new Error('Tokens de autenticação não encontrados na URL');
        }

        // Set the session with the tokens
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          throw error;
        }
        
        // Success!
        setStatus('success');
        setMessage('Email confirmado com sucesso!');
        toast.success('Email confirmado com sucesso!');
        
        // Redirect after a short delay
        setTimeout(() => navigate('/login'), 3000);
      } catch (error: any) {
        console.error('Email confirmation failed:', error);
        setStatus('error');
        setMessage(error.message || 'Falha ao confirmar o email');
        toast.error('Erro ao confirmar email. Por favor, tente novamente.');
      }
    };

    confirmUser();
  }, [navigate]);

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
              Estamos processando sua confirmação
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
                  Você será redirecionado para a página de login em alguns segundos...
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="mt-6 bg-indexa-purple hover:bg-indexa-purple-dark"
                >
                  Ir para o Login
                </Button>
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
                <p className="text-sm text-red-600 mt-2">
                  {message}
                </p>
                <div className="flex flex-col gap-2 mt-6">
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-indexa-purple hover:bg-indexa-purple-dark"
                  >
                    Voltar para Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
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
