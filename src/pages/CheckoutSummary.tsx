
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import ReviewStep from '@/components/checkout/ReviewStep';
import { useCheckout } from '@/hooks/useCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const CheckoutSummary = () => {
  const {
    handleNextStep,
    handlePrevStep,
    calculateTotalPrice,
    couponValid,
    couponDiscount,
    isNavigating
  } = useCheckout();

  const totalPrice = calculateTotalPrice();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Timeline Progress */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6 mb-8"
          >
            <CheckoutProgress currentStep={2} />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6 sm:p-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl font-semibold flex items-center">
                  <span className="mr-2 text-2xl">📋</span>
                  Revisão do Pedido
                </h2>
                <p className="text-sm text-muted-foreground">
                  Confirme os detalhes da sua campanha antes de prosseguir
                </p>
              </motion.div>
              <ReviewStep />
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-between items-center mt-8"
          >
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Total: R$ {totalPrice.toFixed(2)}
              </p>
              {couponValid && couponDiscount > 0 && (
                <p className="text-sm text-green-600">
                  Desconto aplicado: {couponDiscount}%
                </p>
              )}
            </div>

            <Button
              onClick={() => handleNextStep()}
              disabled={isNavigating}
              className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90"
            >
              <span>Ir para Pagamento</span>
              {isNavigating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSummary;
