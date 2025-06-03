
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmailSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email') || '';

  const handleResendEmail = () => {
    // TODO: Implementar reenvio de email
    console.log('Reenviando email para:', email);
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
              <p className="font-semibold text-indexa-purple bg-indexa-purple/5 px-4 py-2 rounded-lg">
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

            <div className="text-center text-sm text-gray-600">
              <p className="mb-4">
                Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
              </p>
              
              <Button
                variant="outline"
                onClick={handleResendEmail}
                className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reenviar email
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
