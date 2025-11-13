import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';

const PaymentCanceled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido_id');

  const handleTryAgain = () => {
    if (pedidoId) {
      navigate(`/payment?pedido=${pedidoId}`);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-destructive/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 border border-border">
            {/* Cancel Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-orange-100 dark:bg-orange-900/20 rounded-full p-6"
              >
                <XCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
              </motion.div>
            </div>

            {/* Cancel Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pagamento Cancelado
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                O processo de pagamento foi cancelado.
              </p>
              <p className="text-sm text-muted-foreground">
                Nenhuma cobrança foi realizada.
              </p>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-muted/50 border border-border rounded-lg p-6 mb-8"
            >
              <h3 className="font-semibold text-foreground mb-2">O que aconteceu?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você cancelou o processo de pagamento ou fechou a janela antes de concluir. 
                Seu pedido ainda está disponível caso queira tentar novamente.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 mr-2 flex-shrink-0"></span>
                  <span>Seu carrinho foi preservado</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 mr-2 flex-shrink-0"></span>
                  <span>Você pode tentar novamente quando quiser</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 mr-2 flex-shrink-0"></span>
                  <span>Nenhuma cobrança foi realizada</span>
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
                onClick={handleTryAgain}
                size="lg"
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Tentar Novamente
              </Button>
              <Button
                onClick={() => navigate('/checkout')}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Voltar ao Carrinho
              </Button>
            </motion.div>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Precisa de ajuda? Entre em contato com nosso suporte.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentCanceled;
