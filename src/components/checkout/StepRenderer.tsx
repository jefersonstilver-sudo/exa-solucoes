
import React from 'react';
import { motion } from 'framer-motion';
import { STEPS } from '@/hooks/useCheckout';
import ReviewStep from '@/components/checkout/ReviewStep';
import PlanSelector from '@/components/checkout/PlanSelector';
import CouponStep from '@/components/checkout/CouponStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import UploadStep from '@/components/checkout/UploadStep';
import TrustIndicators from '@/components/checkout/TrustIndicators';
import { Panel } from '@/types/panel';
import { Plan, PlanKey } from '@/types/checkout';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface StepRendererProps {
  step: number;
  cartItems: CartItem[];
  unavailablePanels: string[];
  selectedPlan: PlanKey;
  setSelectedPlan: (plan: PlanKey) => void;
  PLANS: Record<number, Plan>;
  couponCode: string;
  setCouponCode: (code: string) => void;
  validateCoupon: () => void;
  isValidatingCoupon: boolean;
  couponMessage: string;
  couponValid: boolean;
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
  totalPrice: number;
  paymentMethod?: string;
  setPaymentMethod?: (method: string) => void;
}

const StepRenderer: React.FC<StepRendererProps> = ({
  step,
  cartItems,
  unavailablePanels,
  selectedPlan,
  setSelectedPlan,
  PLANS,
  couponCode,
  setCouponCode,
  validateCoupon,
  isValidatingCoupon,
  couponMessage,
  couponValid,
  acceptTerms,
  setAcceptTerms,
  totalPrice,
  paymentMethod,
  setPaymentMethod
}) => {
  // Variantes de animação para transições de página
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };
  
  switch (step) {
    case STEPS.PLAN:
      return (
        <motion.div
          key="plan"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.4 }}
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-semibold flex items-center">
                <span className="mr-2 text-2xl">⏱️</span>
                Escolha seu plano
              </h2>
              <p className="text-sm text-muted-foreground">
                Selecione o período de veiculação da sua campanha
              </p>
            </motion.div>
            <PlanSelector 
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              plans={PLANS}
              panelCount={cartItems.length}
            />
          </div>
          <TrustIndicators />
        </motion.div>
      );
      
    case STEPS.REVIEW:
      return (
        <motion.div
          key="review"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.4 }}
        >
          <ReviewStep />
          <TrustIndicators />
        </motion.div>
      );
      
    case STEPS.COUPON:
      return (
        <motion.div
          key="coupon"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.4 }}
        >
          <CouponStep
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            validateCoupon={validateCoupon}
            isValidatingCoupon={isValidatingCoupon}
            couponMessage={couponMessage}
            couponValid={couponValid}
          />
          <TrustIndicators />
        </motion.div>
      );
      
    case STEPS.PAYMENT:
      return (
        <motion.div
          key="payment"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.4 }}
        >
          <PaymentStep 
            acceptTerms={acceptTerms} 
            setAcceptTerms={setAcceptTerms}
            totalPrice={totalPrice}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
          <TrustIndicators />
        </motion.div>
      );
    
    case STEPS.UPLOAD:
      return (
        <motion.div
          key="upload"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.4 }}
        >
          <UploadStep
            cartItems={cartItems}
            selectedPlan={selectedPlan}
          />
          <TrustIndicators />
        </motion.div>
      );
      
    default:
      return null;
  }
};

export default StepRenderer;
