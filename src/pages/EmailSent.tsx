
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function EmailSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email') || '';
  
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email não informado para reenvio.');
      return;
    }

    setIsResending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('unified-email-service', {
        body: { action: 'resend', email }
      });

      if (error) {
        throw new Error(error.message || 'Erro desconhecido na função');
      }

      if (data?.success) {
        toast.success('Email de confirmação reenviado! Verifique sua caixa de entrada.');
      } else {
        throw new Error(data?.message || data?.error || 'Resposta inválida da função');
      }
      
    } catch (error: any) {
      let errorMessage = 'Erro ao reenviar email. Tente novamente em alguns momentos.';
      
      if (error.message?.includes('RESEND_API_KEY')) {
        errorMessage = 'Serviço de email não configurado. Contate o suporte.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-exa-red via-exa-highlight-red to-exa-dark" />
            <CardContent className="p-8 space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                <div className="rounded-full bg-gradient-to-br from-red-50 to-red-100 p-6">
                  <Mail className="h-12 w-12 text-exa-red" />
                </div>
              </motion.div>
              
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-exa-red to-exa-highlight-red bg-clip-text text-transparent">
                  Email Enviado!
                </h1>
                <p className="text-gray-600">
                  Enviamos um link de confirmação para:
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {email}
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-exa-red/20 rounded-lg p-4 space-y-2">
                <p className="text-sm text-exa-red font-medium">
                  📧 Verifique sua caixa de entrada
                </p>
                <p className="text-xs text-exa-dark">
                  Não esqueça de checar também a pasta de spam. O email vem de <strong>noreply@examidia.com.br</strong>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Não recebeu o email?
                </p>
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  variant="outline"
                  className="w-full border-exa-red text-exa-red hover:bg-red-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    'Reenviar email de confirmação'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-exa-red hover:text-exa-highlight-red hover:underline w-full"
                >
                  Voltar para o login
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
