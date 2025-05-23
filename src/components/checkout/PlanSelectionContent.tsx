
import React from 'react';
import { motion } from 'framer-motion';
import PlanSelector from '@/components/checkout/PlanSelector';
import PlanPageHeader from '@/components/checkout/PlanPageHeader';
import PlanPageFooter from '@/components/checkout/PlanPageFooter';
import { ClientOnly } from '@/components/ui/client-only';
import { Plan, PlanKey } from '@/types/checkout';

interface PlanSelectionContentProps {
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  plans: Record<number, Plan>;
  panelCount: number;
  onProceed: () => void;
  totalPrice: number;
}

const PlanSelectionContent: React.FC<PlanSelectionContentProps> = ({
  selectedPlan,
  onSelectPlan,
  plans,
  panelCount,
  onProceed,
  totalPrice
}) => {
  return (
    <ClientOnly>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl"
      >
        <PlanPageHeader />
        
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
          <PlanSelector
            selectedPlan={selectedPlan}
            onSelectPlan={onSelectPlan}
            plans={plans}
            panelCount={panelCount}
            onProceed={onProceed}
            totalPrice={totalPrice}
          />
        </div>
        
        <PlanPageFooter />
      </motion.div>
    </ClientOnly>
  );
};

export default PlanSelectionContent;
