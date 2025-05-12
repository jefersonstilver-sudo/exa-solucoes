
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {planKeys.map((planKey) => {
        const plan = plans[planKey];
        const isSelected = selectedPlan === planKey;
        
        return (
          <motion.div 
            key={planKey}
            variants={itemVariants}
            transition={{ duration: 0.4 }}
          >
            <Card 
              className={`
                overflow-hidden transition-all hover:shadow-md cursor-pointer
                ${isSelected 
                  ? 'border-2 border-[#00FFAB] bg-[#1E1B4B]/5 shadow-md' 
                  : 'border border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => onSelectPlan(planKey)}
            >
              <CardHeader className={`p-4 pb-3 ${isSelected ? 'bg-[#1E1B4B]/5' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {planKey === 1 ? 'Mensal' : 
                     planKey === 3 ? 'Trimestral' : 
                     planKey === 6 ? 'Semestral' : 
                     'Anual'}
                  </h3>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-[#00FFAB]" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="mb-3">
                  <span className="text-2xl font-bold text-[#1E1B4B]">
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
                      <div className="flex-shrink-0 text-lg text-[#00FFAB]">✓</div>
                      <span className="ml-2 text-sm">{extra}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default PlanSelector;
