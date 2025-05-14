
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PLANS } from '@/constants/checkoutConstants';

interface PeriodSelectorProps {
  selectedPeriod: number;
  onSelectPeriod: (days: number) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
  selectedPeriod, 
  onSelectPeriod 
}) => {
  const planOptions = [
    { days: 30, months: 1, label: '1 mês', discount: 0 },
    { days: 90, months: 3, label: '3 meses', discount: 5 },
    { days: 180, months: 6, label: '6 meses', discount: 15 },
    { days: 360, months: 12, label: '12 meses', discount: 35 }
  ];
  
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Clock className="h-4 w-4 text-gray-500" />
        <span>Período de contratação</span>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {planOptions.map((option) => {
          const isSelected = selectedPeriod === option.days;
          
          return (
            <motion.div 
              key={option.days}
              variants={itemVariants}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={`
                  overflow-hidden transition-all cursor-pointer h-full flex flex-col
                  ${isSelected 
                    ? 'border-2 border-[#00FFAB] bg-[#1E1B4B]/5 shadow-sm' 
                    : 'border border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
                onClick={() => onSelectPeriod(option.days)}
              >
                <CardContent className="p-2 flex flex-col justify-center items-center h-full">
                  <div className="text-center">
                    <h3 className="text-sm font-medium">
                      {option.label}
                    </h3>
                    
                    {option.discount > 0 && (
                      <p className="text-xs font-medium text-green-600 mt-0.5">
                        ({option.discount}% off)
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

export default PeriodSelector;
