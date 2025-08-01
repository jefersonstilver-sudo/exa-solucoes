
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="shadow-lg border border-border">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Email enviado!
                </h1>
                <p className="text-muted-foreground text-sm">
                  Verifique sua caixa de entrada para continuar
                </p>
              </div>

              {email && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Enviado para:</p>
                  <p className="font-medium text-foreground break-words">{email}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Enviamos um link de confirmação para seu email.</p>
                <p>Clique no link para ativar sua conta.</p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || !email}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    'Reenviar email'
                  )}
                </Button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar para login
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
