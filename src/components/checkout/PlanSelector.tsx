
import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Check, Star, Gift, Zap, Award, Clock } from 'lucide-react';
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
  
  // Get appropriate icon for each extra benefit
  const getBenefitIcon = (benefit: string) => {
    if (benefit.includes('vídeo por mês')) return <Gift className="h-3 w-3 mr-1 text-rose-500" />;
    if (benefit.includes('institucional')) return <Award className="h-3 w-3 mr-1 text-amber-500" />;
    if (benefit.includes('ininterrupta')) return <Clock className="h-3 w-3 mr-1 text-green-500" />;
    return <Check className="h-3 w-3 mr-1 text-green-500" />;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {planOptions.map((months) => {
        const plan = plans[months];
        const isSelected = selectedPlan === months;
        const totalValue = calculateTotalPlanValue(plan.months, plan.pricePerMonth);
        
        return (
          <motion.div
            key={months}
            variants={cardVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            animate={isSelected ? { y: -5 } : { y: 0 }}
            className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-indexa-mint bg-gradient-to-br from-indexa-mint/10 to-indexa-purple/5 shadow-md'
                : 'border-gray-200 hover:border-indexa-purple/30 hover:bg-gray-50'
            }`}
            onClick={() => onSelectPlan(months)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold flex items-center">
                {months === 1 ? (
                  <Zap className="h-4 w-4 mr-1 text-blue-500" />
                ) : (
                  <Tag className="h-4 w-4 mr-1 text-indexa-purple" />
                )}
                {months} {months === 1 ? 'mês' : 'meses'}
              </h3>
              {months === 12 && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Recomendado
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
                  <motion.div 
                    className="flex items-center mt-1 text-xs text-green-600"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    <span>Economia de {plan.discount}%</span>
                  </motion.div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-700">Total: {formatCurrency(totalValue)}</p>
                <p className="text-xs">Para {panelCount} {panelCount === 1 ? 'painel' : 'painéis'}</p>
              </div>
              
              {plan.extras.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Inclui:</p>
                  <ul className="space-y-1.5">
                    {plan.extras.map((extra, index) => (
                      <motion.li 
                        key={index} 
                        className="text-xs flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (index * 0.1) }}
                      >
                        {getBenefitIcon(extra)}
                        <span>{extra}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {isSelected && (
              <motion.div 
                className="mt-3 w-full h-1 bg-gradient-to-r from-indexa-purple to-indexa-mint rounded-full"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default PlanSelector;
