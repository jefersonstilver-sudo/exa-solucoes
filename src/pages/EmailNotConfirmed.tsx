import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';

export default function EmailNotConfirmed() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email não encontrado');
      return;
    }

    try {
      setResending(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      toast.success('Email de confirmação reenviado!', {
        description: `Verifique sua caixa de entrada em ${email}`
      });
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast.error('Erro ao enviar email', {
        description: error.message
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="border-2 border-orange-200 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center"
              >
                <Mail className="h-10 w-10 text-orange-600" />
              </motion.div>
              
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  📧 Email Não Confirmado
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Confirme seu email para acessar o sistema
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Mensagem Principal */}
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 mb-1">
                      Acesso Bloqueado
                    </h3>
                    <p className="text-sm text-orange-800 leading-relaxed">
                      Você precisa confirmar seu endereço de email antes de acessar o sistema. 
                      Verifique sua caixa de entrada e clique no link de confirmação.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email do Usuário */}
              {email && (
                <div className="text-center py-3 px-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Email cadastrado:
                  </p>
                  <p className="font-mono text-base font-semibold text-foreground">
                    {email}
                  </p>
                </div>
              )}

              {/* Instruções */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">
                  📝 O que fazer:
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground pl-5 list-decimal">
                  <li>Verifique sua caixa de entrada do email {email && <span className="font-medium text-foreground">{email}</span>}</li>
                  <li>Procure por um email de confirmação (verifique também spam/lixeira)</li>
                  <li>Clique no link de confirmação no email</li>
                  <li>Volte aqui e faça login normalmente</li>
                </ol>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleResendEmail}
                  disabled={resending || !email}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Reenviar Email de Confirmação
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar para Login
                </Button>
              </div>

              {/* Dica Adicional */}
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Dica:</strong> Se não receber o email em alguns minutos, 
                  verifique sua pasta de spam ou lixo eletrônico.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
