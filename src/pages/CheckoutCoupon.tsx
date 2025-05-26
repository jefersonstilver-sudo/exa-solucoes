
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import CouponStep from '@/components/checkout/CouponStep';
import { useCheckout } from '@/hooks/useCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const CheckoutCoupon = () => {
  const {
    couponCode,
    setCouponCode,
    couponDiscount,
    couponMessage,
    couponValid,
    isValidatingCoupon,
    validateCoupon,
    handleNextStep,
    handlePrevStep,
    calculateTotalPrice
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
            <CheckoutProgress currentStep={1} />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6 sm:p-8"
          >
            <CouponStep
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              validateCoupon={validateCoupon}
              isValidatingCoupon={isValidatingCoupon}
              couponMessage={couponMessage}
              couponValid={couponValid}
            />
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
              className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90"
            >
              <span>Continuar</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutCoupon;
