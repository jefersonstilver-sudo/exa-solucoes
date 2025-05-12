
import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Check, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface PlanSelectorProps {
  selectedPlan: 1 | 3 | 6 | 12;
  onSelectPlan: (plan: 1 | 3 | 6 | 12) => void;
  plans: Record<number, {
    months: number;
    pricePerMonth: number;
    discount: number;
    extras: string[];
  }>;
  panelCount: number;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  selectedPlan,
  onSelectPlan,
  plans,
  panelCount
}) => {
  const planOptions: Array<1 | 3 | 6 | 12> = [1, 3, 6, 12];
  
  const calculateTotalPlanValue = (months: number, pricePerMonth: number) => {
    return months * pricePerMonth * panelCount;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {planOptions.map((months) => {
        const plan = plans[months];
        const isSelected = selectedPlan === months;
        const totalValue = calculateTotalPlanValue(plan.months, plan.pricePerMonth);
        
        return (
          <motion.div
            key={months}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-indexa-mint bg-indexa-mint/10 shadow-md'
                : 'border-gray-200 hover:border-indexa-purple/30 hover:bg-gray-50'
            }`}
            onClick={() => onSelectPlan(months)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">
                {months} {months === 1 ? 'mês' : 'meses'}
              </h3>
              {months === 12 && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Melhor
                </span>
              )}
              {isSelected && (
                <div className="h-5 w-5 rounded-full bg-indexa-mint flex items-center justify-center">
                  <Check className="h-3 w-3 text-gray-800" />
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-indexa-purple">
                  {formatCurrency(plan.pricePerMonth)}
                  <span className="text-sm font-normal text-muted-foreground"> /mês</span>
                </div>
                {plan.discount > 0 && (
                  <div className="flex items-center mt-1 text-xs text-green-600">
                    <Tag className="h-3 w-3 mr-1" />
                    <span>Economia de {plan.discount}%</span>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">Total: {formatCurrency(totalValue)}</p>
                <p className="text-xs">Para {panelCount} {panelCount === 1 ? 'painel' : 'painéis'}</p>
              </div>
              
              {plan.extras.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Inclui:</p>
                  <ul className="space-y-1">
                    {plan.extras.map((extra, index) => (
                      <li key={index} className="text-xs flex items-start">
                        <Check className="h-3 w-3 mr-1 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{extra}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlanSelector;
