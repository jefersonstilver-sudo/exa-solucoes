
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface PixPaymentErrorProps {
  error: string;
  onBack: () => void;
  onRetry?: () => void;
}

const PixPaymentError = ({ error, onBack, onRetry }: PixPaymentErrorProps) => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 py-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro no Pagamento
            </h2>
            
            <p className="text-gray-600 mb-6">
              {error || 'Ocorreu um erro ao processar seu pagamento. Tente novamente.'}
            </p>
            
            <div className="space-y-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
              
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Checkout
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PixPaymentError;
