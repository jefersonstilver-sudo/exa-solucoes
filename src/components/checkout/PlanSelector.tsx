
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface Plan {
  months: number;
  pricePerMonth: number;
  discount: number;
  extras: string[];
}

interface PlanSelectorProps {
  selectedPlan: 1 | 3 | 6 | 12;
  onSelectPlan: (plan: 1 | 3 | 6 | 12) => void;
  plans: {
    [key: number]: Plan;
  };
  panelCount: number;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  selectedPlan, 
  onSelectPlan, 
  plans,
  panelCount
}) => {
  const planKeys = Object.keys(plans).map(key => parseInt(key)) as Array<1 | 3 | 6 | 12>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {planKeys.map((planKey) => {
        const plan = plans[planKey];
        const isSelected = selectedPlan === planKey;
        
        return (
          <motion.div 
            key={planKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: planKey * 0.05 }}
          >
            <div 
              className={`
                border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                ${isSelected 
                  ? 'border-indexa-purple bg-indexa-purple/5' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => onSelectPlan(planKey)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">
                  {planKey === 1 ? 'Mensal' : 
                   planKey === 3 ? 'Trimestral' : 
                   planKey === 6 ? 'Semestral' : 
                   'Anual'}
                </h3>
                {isSelected && (
                  <CheckCircle className="h-5 w-5 text-indexa-purple" />
                )}
              </div>
              
              <div className="mb-3">
                <span className="text-2xl font-bold text-indexa-purple">
                  R$ {plan.pricePerMonth}
                </span>
                <span className="text-sm text-gray-500">/mês</span>
                
                {plan.discount > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    {plan.discount}% OFF
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-500 mb-3">
                <p>
                  Total por painel: R$ {(plan.pricePerMonth * planKey).toLocaleString('pt-BR')} 
                  {panelCount > 1 ? ` (${panelCount} painéis)` : ''}
                </p>
              </div>
              
              <ul className="space-y-2 mt-4">
                {plan.extras.map((extra, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                  >
                    <div className="flex-shrink-0 text-sm">✅</div>
                    <span className="ml-2 text-sm">{extra}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlanSelector;
