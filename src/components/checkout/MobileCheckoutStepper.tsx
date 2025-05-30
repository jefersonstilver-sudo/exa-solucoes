
import React from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, FileText, Upload, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileCheckoutStepperProps {
  currentStep: number;
  steps?: { title: string; icon: React.ComponentType<{ className?: string }> }[];
}

const defaultSteps = [
  { title: 'Cupom', icon: Gift },
  { title: 'Resumo', icon: FileText },
  { title: 'Pagamento', icon: CreditCard },
  { title: 'Upload', icon: Upload }
];

const MobileCheckoutStepper = ({ currentStep, steps = defaultSteps }: MobileCheckoutStepperProps) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-sm mx-auto relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors relative",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-[#7c3aed] border-[#7c3aed] text-white", 
                  isUpcoming && "bg-gray-100 border-gray-300 text-gray-400"
                )}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                
                {/* Current step indicator */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#7c3aed]"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              {/* Step Label */}
              <span className={cn(
                "text-xs mt-1 font-medium transition-colors",
                isCompleted && "text-green-600",
                isCurrent && "text-[#7c3aed]",
                isUpcoming && "text-gray-400"
              )}>
                {step.title}
              </span>
            </div>
          );
        })}
        
        {/* Connector Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
        <motion.div
          className="bg-[#7c3aed] h-1 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

export default MobileCheckoutStepper;
