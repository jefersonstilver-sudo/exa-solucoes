import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, FileText } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Log successful payment
    console.log('✅ Payment successful, session:', sessionId);
  }, [sessionId]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 border border-border">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-green-100 dark:bg-green-900/20 rounded-full p-6"
              >
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </motion.div>
            </div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pagamento Aprovado!
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Seu pagamento foi processado com sucesso.
              </p>
              <p className="text-sm text-muted-foreground">
                Você receberá um email de confirmação em breve.
              </p>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8"
            >
              <h3 className="font-semibold text-foreground mb-2">Próximos Passos:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></span>
                  <span>Seu pedido está sendo processado e você pode acompanhá-lo na página de pedidos</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></span>
                  <span>Em breve você poderá fazer upload dos seus vídeos nas campanhas criadas</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"></span>
                  <span>Você receberá notificações sobre o status da sua campanha</span>
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={() => navigate('/anunciante/pedidos')}
                size="lg"
                className="flex-1"
              >
                <FileText className="mr-2 h-5 w-5" />
                Ver Meus Pedidos
              </Button>
              <Button
                onClick={() => navigate('/anunciante/campaigns')}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Gerenciar Campanhas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Session ID (for debugging) */}
            {sessionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  ID da sessão: {sessionId.substring(0, 20)}...
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
