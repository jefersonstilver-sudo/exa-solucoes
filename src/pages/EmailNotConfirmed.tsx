import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useEmailConfirmation } from '@/hooks/useEmailConfirmation';

export default function EmailNotConfirmed() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { resendConfirmationEmail, isResending } = useEmailConfirmation();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Mail className="w-8 h-8 text-primary" />
              </motion.div>
              
              <div>
                <CardTitle className="text-2xl font-bold">
                  Confirme seu Email
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Sua conta foi criada com sucesso!
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-primary/20 bg-primary/5">
                <AlertCircle className="h-5 w-5 text-primary" />
                <AlertDescription className="text-sm leading-relaxed ml-2">
                  Para acessar sua conta, você precisa confirmar seu endereço de email primeiro.
                </AlertDescription>
              </Alert>

              {email && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Email cadastrado:</p>
                  <p className="font-semibold text-foreground break-all">{email}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verifique sua caixa de entrada em <strong>{email || 'seu email'}</strong>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique no link de confirmação que enviamos
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Após confirmar, faça login novamente
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => resendConfirmationEmail(email)}
                  disabled={isResending}
                  className="w-full"
                  size="lg"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Reenviar Email de Confirmação
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                  size="lg"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Login
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-2 text-center border-t pt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" />
                <span>Não recebeu? Verifique sua pasta de spam</span>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
