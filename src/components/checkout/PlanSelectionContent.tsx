
import React from 'react';
import { motion } from 'framer-motion';
import PlanSelector from '@/components/checkout/PlanSelector';
import PlanPageHeader from '@/components/checkout/PlanPageHeader';
import PlanPageFooter from '@/components/checkout/PlanPageFooter';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import { ClientOnly } from '@/components/ui/client-only';
import { Plan, PlanKey } from '@/types/checkout';

interface PlanSelectionContentProps {
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  plans: Record<number, Plan>;
  panelCount: number;
  onProceed: () => void;
  onGoToCoupon?: () => void;
  totalPrice: number;
}

const PlanSelectionContent: React.FC<PlanSelectionContentProps> = ({
  selectedPlan,
  onSelectPlan,
  plans,
  panelCount,
  onProceed,
  onGoToCoupon,
  totalPrice
}) => {
  // Só mostra o timeline se há itens no carrinho
  const showTimeline = panelCount > 0;

  return (
    <ClientOnly>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl"
      >
        <PlanPageHeader />
        
        {/* Timeline - aparece após ter itens no carrinho */}
        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 bg-white rounded-xl shadow-sm border p-6"
          >
            <CheckoutProgress currentStep={0} />
          </motion.div>
        )}
        
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
          <PlanSelector
            selectedPlan={selectedPlan}
            onSelectPlan={onSelectPlan}
            plans={plans}
            panelCount={panelCount}
            onProceed={onProceed}
            onGoToCoupon={onGoToCoupon}
            totalPrice={totalPrice}
          />
        </div>
        
        <PlanPageFooter />
      </motion.div>
    </ClientOnly>
  );
};

export default PlanSelectionContent;
