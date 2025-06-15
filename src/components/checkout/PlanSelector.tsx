
import React from 'react';
import { motion } from 'framer-motion';
import PlanCard from './PlanCard';
import { Plan, PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface PlanSelectorProps {
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  plans: Record<number, Plan>;
  panelCount: number;
  cartItems: CartItem[];
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  selectedPlan, 
  onSelectPlan, 
  plans, 
  panelCount,
  cartItems 
}) => {
  const planKeys = Object.keys(plans).map(Number) as PlanKey[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Escolha seu Plano
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Selecione o período de veiculação da sua campanha
        </p>
      </motion.div>

      {/* Plans Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { 
              staggerChildren: 0.1 
            }
          }
        }}
        initial="hidden"
        animate="visible"
      >
        {planKeys.map((planKey) => (
          <PlanCard
            key={planKey}
            plan={plans[planKey]}
            planKey={planKey}
            isSelected={selectedPlan === planKey}
            onSelect={() => onSelectPlan(planKey)}
            cartItems={cartItems}
          />
        ))}
      </motion.div>

      {/* Help text when cart is empty */}
      {cartItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 mb-2">
              Você precisa adicionar prédios ao carrinho primeiro
            </p>
            <p className="text-sm text-gray-500">
              Vá para a loja de prédios e selecione os locais para sua campanha
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PlanSelector;
