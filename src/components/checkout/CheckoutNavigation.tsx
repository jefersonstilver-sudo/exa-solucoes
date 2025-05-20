
import React from 'react';
import { motion } from 'framer-motion';
import BackButton from '@/components/checkout/navigation/BackButton';
import NextButton from '@/components/checkout/navigation/NextButton';

interface CheckoutNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isBackToStore: boolean;
  isNextEnabled: boolean;
  isCreatingPayment: boolean;
  isPaymentStep: boolean;
  totalPrice?: number;
  isNavigating?: boolean;
  paymentMethod?: string;
  orderId?: string;
}

const CheckoutNavigation: React.FC<CheckoutNavigationProps> = ({
  onBack,
  onNext,
  isBackToStore,
  isNextEnabled,
  isCreatingPayment,
  isPaymentStep,
  totalPrice = 0,
  isNavigating = false,
  paymentMethod,
  orderId
}) => {
  // Combined value to determine if the button should be disabled
  const isDisabled = !isNextEnabled || isCreatingPayment || isNavigating;
  const isLoading = isCreatingPayment || isNavigating;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="mt-12 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
    >
      <BackButton 
        onClick={onBack} 
        isBackToStore={isBackToStore} 
        isDisabled={isDisabled} 
      />

      <NextButton 
        onClick={onNext}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isPaymentStep={isPaymentStep}
        totalPrice={totalPrice}
        paymentMethod={paymentMethod}
        orderId={orderId}
      />
    </motion.div>
  );
};

export default CheckoutNavigation;
