
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Tag, CreditCard, Check } from 'lucide-react';

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  const steps = [
    { icon: <ShoppingCart className="h-5 w-5" />, label: "Revisão" },
    { icon: <Package className="h-5 w-5" />, label: "Plano" },
    { icon: <Tag className="h-5 w-5" />, label: "Cupom" },
    { icon: <CreditCard className="h-5 w-5" />, label: "Pagamento" }
  ];

  // Animation variants
  const progressVariants = {
    initial: (i: number) => ({
      width: i === 0 ? '0%' : i === 1 ? '33%' : i === 2 ? '66%' : '100%'
    }),
    animate: (i: number) => ({
      width: i === 0 ? '0%' : i === 1 ? '33%' : i === 2 ? '66%' : '100%',
      transition: { duration: 0.5, ease: "easeInOut" }
    })
  };

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="relative h-1 w-full bg-gray-200 mb-4 rounded-full overflow-hidden">
        <motion.div 
          className="absolute h-full bg-gradient-to-r from-indexa-purple to-indexa-mint"
          initial="initial"
          animate="animate"
          custom={currentStep}
          variants={progressVariants}
        />
      </div>
      
      <div className="flex justify-between items-center w-full relative">
        <div className="absolute top-1/2 h-0.5 w-full bg-gray-200 -z-10"></div>
        
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <motion.div 
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300
                ${i === currentStep 
                  ? 'bg-indexa-purple text-white shadow-md shadow-indexa-purple/20' 
                  : i < currentStep 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              {i < currentStep ? <Check className="h-5 w-5" /> : step.icon}
            </motion.div>
            <motion.span 
              className={`text-xs mt-1.5 font-medium ${
                i === currentStep ? 'text-indexa-purple' : i < currentStep ? 'text-green-500' : 'text-gray-500'
              }`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
            >
              {step.label}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutProgress;
