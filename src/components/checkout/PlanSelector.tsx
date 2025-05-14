
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Plan, PlanKey } from '@/types/checkout';

interface PlanSelectorProps {
  selectedPlan: PlanKey;
  onSelectPlan: (plan: PlanKey) => void;
  plans: Record<number, Plan>;
  panelCount: number;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  selectedPlan, 
  onSelectPlan, 
  plans,
  panelCount
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
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 text-lg font-medium text-gray-700">
        <Clock className="h-5 w-5 text-gray-500" />
        <span>Período de contratação</span>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
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
                  overflow-hidden transition-all cursor-pointer h-full flex flex-col
                  ${isSelected 
                    ? 'border-2 border-[#00FFAB] bg-[#1E1B4B]/5 shadow-md' 
                    : 'border border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
                onClick={() => onSelectPlan(planKey)}
              >
                <CardContent className="p-4 flex flex-col justify-center items-center h-full">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      {planKey === 1 ? '1 mês' : 
                       planKey === 3 ? '3 meses' : 
                       planKey === 6 ? '6 meses' : 
                       '12 meses'}
                    </h3>
                    
                    {plan.discount > 0 && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        ({plan.discount}% off)
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default PlanSelector;
