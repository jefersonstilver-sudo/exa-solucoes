
import React from 'react';
import { motion } from 'framer-motion';
import { Plan, PlanKey } from '@/types/checkout';
import PlanCard from './PlanCard';
import PlanHeader from './PlanHeader';
import PlanProceedButton from './PlanProceedButton';
import { Button } from '@/components/ui/button';
import { Settings, Zap } from 'lucide-react';

interface PlanSelectorProps {
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  plans: Record<number, Plan>;
  panelCount: number;
  onProceed?: () => void;
  onCorrection?: () => void;
  onSkipStages?: () => void;
  totalPrice?: number;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  selectedPlan, 
  onSelectPlan, 
  plans,
  panelCount,
  onProceed,
  onCorrection,
  onSkipStages,
  totalPrice
}) => {
  const planKeys = Object.keys(plans).map(key => parseInt(key)) as Array<PlanKey>;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Get color class based on plan
  const getPlanColorClass = (planKey: PlanKey) => {
    const colorMap = {
      'gray': 'border-gray-300 hover:border-gray-400',
      'green': 'border-green-500 hover:border-green-600',
      'purple': 'border-purple-500 hover:border-purple-600',
      'blue': 'border-blue-500 hover:border-blue-600'
    };
    
    const color = plans[planKey].color || 'gray';
    return colorMap[color] || colorMap.gray;
  };
  
  // Get background color class for selected plan
  const getSelectedBgClass = (planKey: PlanKey) => {
    const colorMap = {
      'gray': 'bg-gray-50',
      'green': 'bg-green-50',
      'purple': 'bg-purple-50',
      'blue': 'bg-blue-50'
    };
    
    const color = plans[planKey].color || 'gray';
    return colorMap[color] || colorMap.gray;
  };
  
  return (
    <div className="space-y-6">
      <PlanHeader />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {planKeys.map((planKey) => {
          const plan = plans[planKey];
          const isSelected = selectedPlan === planKey;
          const borderColorClass = getPlanColorClass(planKey);
          const selectedBgClass = getSelectedBgClass(planKey);
          
          return (
            <PlanCard
              key={planKey}
              plan={plan}
              planKey={planKey}
              isSelected={isSelected}
              onSelect={() => onSelectPlan(planKey)}
              borderColorClass={borderColorClass}
              selectedBgClass={selectedBgClass}
            />
          );
        })}
      </motion.div>
      
      {/* Novos botões de navegação */}
      <div className="space-y-3">
        {/* Botão Correção */}
        {onCorrection && (
          <Button
            onClick={onCorrection}
            disabled={!selectedPlan}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <span className="flex items-center justify-center">
              Correção - Ir para Cupom
              <Settings className="h-4 w-4 ml-2" />
            </span>
          </Button>
        )}

        {/* Botão Pular Etapas */}
        {onSkipStages && (
          <Button
            onClick={onSkipStages}
            disabled={!selectedPlan}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <span className="flex items-center justify-center">
              Pular Etapas - Ir para Resumo
              <Zap className="h-4 w-4 ml-2" />
            </span>
          </Button>
        )}

        {/* Botão Prosseguir Original */}
        {onProceed && (
          <PlanProceedButton 
            onProceed={onProceed}
            disabled={!selectedPlan}
            selectedPlan={selectedPlan}
            planData={selectedPlan ? plans[selectedPlan] : null}
            totalPrice={totalPrice}
          />
        )}
      </div>
    </div>
  );
};

export default PlanSelector;
