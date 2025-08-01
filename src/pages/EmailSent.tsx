
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md md:max-w-lg lg:max-w-2xl"
        >
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 pt-8 px-6 md:px-8 lg:px-10">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-2xl inline-flex mx-auto mb-6 shadow-sm"
              >
                <Mail className="h-16 w-16 text-blue-600" />
              </motion.div>
              <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Email enviado!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Verifique sua caixa de entrada para continuar
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 md:px-8 lg:px-10 pb-8 space-y-8">
              <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
                {/* Left Column - Email Info */}
                <div className="space-y-6">
                  <div className="text-center lg:text-left">
                    <p className="text-gray-700 mb-4 text-lg">
                      Enviamos um email de confirmação para:
                    </p>
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                      <p className="font-semibold text-gray-900 break-words text-sm md:text-base">
                        {email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="bg-amber-100 rounded-full p-2 mr-4 mt-1">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-900 mb-3">
                          Próximos passos:
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center bg-white/50 rounded-lg p-3">
                            <span className="bg-amber-100 text-amber-800 text-sm font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3">1</span>
                            <span className="text-amber-800 font-medium">Abra seu email</span>
                          </div>
                          <div className="flex items-center bg-white/50 rounded-lg p-3">
                            <span className="bg-amber-100 text-amber-800 text-sm font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3">2</span>
                            <span className="text-amber-800 font-medium">Procure por um email da Indexa</span>
                          </div>
                          <div className="flex items-center bg-white/50 rounded-lg p-3">
                            <span className="bg-amber-100 text-amber-800 text-sm font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3">3</span>
                            <span className="text-amber-800 font-medium">Clique no botão "Confirmar Email"</span>
                          </div>
                          <div className="flex items-center bg-white/50 rounded-lg p-3">
                            <span className="bg-amber-100 text-amber-800 text-sm font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3">4</span>
                            <span className="text-amber-800 font-medium">Faça login e comece a anunciar!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center lg:text-left">
                      Ações disponíveis
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="text-center lg:text-left">
                        <p className="text-gray-600 mb-4">
                          Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
                        </p>
                        
                        <Button
                          variant="outline"
                          onClick={handleResendEmail}
                          disabled={isResending || emailSent}
                          className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 w-full py-3 font-semibold transition-all duration-200 rounded-xl"
                        >
                          {isResending ? (
                            <>
                              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                              Reenviando...
                            </>
                          ) : emailSent ? (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Email enviado!
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-5 w-5 mr-2" />
                              Reenviar email
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <Button
                          variant="ghost"
                          onClick={() => navigate('/login')}
                          className="text-gray-600 hover:text-indigo-600 w-full py-3 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Voltar para login
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {lastError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6"
                >
                  <div className="flex items-start">
                    <div className="bg-red-100 rounded-full p-2 mr-4">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-red-900 mb-2">Erro no reenvio:</p>
                      <p className="text-red-800">{lastError}</p>
                    </div>
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
