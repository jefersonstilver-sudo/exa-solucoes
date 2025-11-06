import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useEmailConfirmation } from '@/hooks/useEmailConfirmation';

const EmailEnviado: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { resendConfirmationEmail, isResending } = useEmailConfirmation();

  const handleResendEmail = async () => {
    if (email) {
      await resendConfirmationEmail(email);
    }
  };

  return (
    <Layout>
      <SEO 
        title="Confirme seu E-mail - EXA" 
        description="Verifique sua caixa de entrada para confirmar seu cadastro na EXA"
        noindex={true}
      />
      
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-[#3B1E1E]/10 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 sm:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <div className="relative inline-block">
                <Mail className="h-24 w-24 text-exa-red mx-auto" />
                <CheckCircle2 className="h-10 w-10 text-green-500 absolute -bottom-2 -right-2 bg-white rounded-full" />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Confirme seu E-mail
              </h1>
              
              <div className="space-y-4 text-gray-600">
                <p className="text-lg">
                  Enviamos um link de confirmação para:
                </p>
                
                <p className="text-xl font-semibold text-exa-red bg-red-50 py-3 px-4 rounded-lg">
                  {email}
                </p>
                
                <div className="pt-4 space-y-3">
                  <p>
                    Clique no link enviado para ativar sua conta e começar a usar a plataforma EXA.
                  </p>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left">
                    <p className="text-sm text-blue-900">
                      <strong>Dica:</strong> Verifique também sua pasta de spam ou lixo eletrônico caso não encontre o e-mail na caixa de entrada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                <p className="text-sm text-gray-500">
                  Não recebeu o e-mail?
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={isResending || !email}
                    className="border-exa-red text-exa-red hover:bg-red-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Reenviar E-mail
                      </>
                    )}
                  </Button>
                  
                  <Link to="/login">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-exa-red to-exa-highlight-red hover:from-exa-highlight-red hover:to-exa-red text-white">
                      Ir para Login
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default EmailEnviado;
