
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Clock, RefreshCw, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function EmailSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email') || '';
  
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email não informado para reenvio.');
      return;
    }

    setIsResending(true);
    setLastError(null);
    
    try {
      console.log('🔄 [EMAIL-SENT] Iniciando reenvio para:', email);
      
      const { data, error } = await supabase.functions.invoke('unified-email-service', {
        body: { action: 'resend', email }
      });

      console.log('📧 [EMAIL-SENT] Resposta da função:', { data, error });

      if (error) {
        console.error('❌ [EMAIL-SENT] Erro da função:', error);
        throw new Error(error.message || 'Erro desconhecido na função');
      }

      if (data?.success) {
        console.log('✅ [EMAIL-SENT] Email reenviado com sucesso');
        setEmailSent(true);
        toast.success('Email de confirmação reenviado! Verifique sua caixa de entrada.');
        
        setTimeout(() => setEmailSent(false), 5000);
      } else {
        throw new Error(data?.message || data?.error || 'Resposta inválida da função');
      }
      
    } catch (error: any) {
      console.error('💥 [EMAIL-SENT] Erro completo:', error);
      
      let errorMessage = 'Erro ao reenviar email. Tente novamente em alguns momentos.';
      
      if (error.message?.includes('RESEND_API_KEY')) {
        errorMessage = 'Serviço de email não configurado. Contate o suporte.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLastError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[80vh] px-4"
      >
        <Card className="w-full max-w-md shadow-lg border-indexa-purple/10">
          <CardHeader className="space-y-1 text-center">
            <div className="bg-blue-100 p-4 rounded-full inline-flex mx-auto mb-4">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-indexa-purple">
              Email enviado!
            </CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Enviamos um email de confirmação para:
              </p>
              <p className="font-semibold text-indexa-purple bg-indexa-purple/5 px-4 py-2 rounded-lg break-all">
                {email}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Próximos passos:
                  </p>
                  <ol className="text-sm text-yellow-800 mt-2 space-y-1 list-decimal list-inside">
                    <li>Abra seu email</li>
                    <li>Procure por um email da Indexa</li>
                    <li>Clique no botão "Confirmar Email"</li>
                    <li>Faça login e comece a anunciar!</li>
                  </ol>
                </div>
              </div>
            </div>

            {lastError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Erro no reenvio:</p>
                    <p className="text-sm text-red-800 mt-1">{lastError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              <p className="mb-4">
                Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
              </p>
              
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isResending || emailSent}
                className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                ) : emailSent ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Email enviado!
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar email
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-indexa-purple"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}
