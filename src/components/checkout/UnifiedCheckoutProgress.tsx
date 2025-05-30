
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar, Tag, CreditCard, Upload, ShoppingCart } from 'lucide-react';

interface UnifiedCheckoutProgressProps {
  currentStep: number;
}

const UnifiedCheckoutProgress: React.FC<UnifiedCheckoutProgressProps> = ({ currentStep }) => {
  const steps = [
    { 
      name: 'Plano', 
      shortName: 'Plano',
      icon: Calendar,
      description: 'Período',
      motivationalText: 'Escolha seu período ideal!'
    },
    { 
      name: 'Cupom', 
      shortName: 'Cupom',
      icon: Tag,
      description: 'Desconto',
      motivationalText: 'Economize ainda mais!'
    },
    { 
      name: 'Resumo', 
      shortName: 'Resumo',
      icon: ShoppingCart,
      description: 'Revisão',
      motivationalText: 'Quase lá!'
    },
    { 
      name: 'Pagamento', 
      shortName: 'Pag.',
      icon: CreditCard,
      description: 'Finalizar',
      motivationalText: 'Último passo!'
    },
    { 
      name: 'Upload', 
      shortName: 'Upload',
      icon: Upload,
      description: 'Material',
      motivationalText: 'Sua campanha começa aqui!'
    }
  ];

  return (
    <div className="w-full">
      {/* Progress Header - Responsivo */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 md:mb-6"
      >
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
          Progresso do Seu Pedido
        </h3>
        <p className="text-xs md:text-sm text-gray-600">
          {steps[currentStep]?.motivationalText || 'Continue para finalizar!'}
        </p>
      </motion.div>

      {/* Desktop/Tablet View */}
      <div className="hidden sm:flex justify-between items-center mb-4 md:mb-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          
          return (
            <div 
              key={step.name} 
              className="flex flex-col items-center relative flex-1"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 md:top-6 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                  <div className="h-full bg-gray-200 rounded-full" />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  />
                </div>
              )}
              
              {/* Step Circle */}
              <motion.div 
                className={`
                  relative z-10 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-[#3C1361] to-[#00FFAB] text-white' 
                    : isCurrent 
                      ? 'bg-[#3C1361] text-white ring-4 ring-[#00FFAB]/30' 
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }
                `}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  opacity: 1
                }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1
                }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <StepIcon className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </motion.div>
              
              {/* Step Info */}
              <motion.div 
                className="text-center mt-2 md:mt-3 max-w-[70px] md:max-w-[80px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <span 
                  className={`
                    text-xs font-medium block mb-1
                    ${isCurrent 
                      ? 'text-[#3C1361] font-bold' 
                      : isCompleted 
                        ? 'text-gray-700' 
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.shortName}
                </span>
                <span className="text-xs text-gray-500 leading-tight hidden md:block">
                  {step.description}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Mobile View - Horizontal Compact */}
      <div className="flex sm:hidden justify-between items-center mb-4 px-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          
          return (
            <div 
              key={step.name} 
              className="flex flex-col items-center relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-4 left-6 w-8 h-0.5 z-0">
                  <div className="h-full bg-gray-200 rounded-full" />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              )}
              
              {/* Step Circle */}
              <motion.div 
                className={`
                  relative z-10 flex items-center justify-center w-8 h-8 rounded-full shadow-md
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-[#3C1361] to-[#00FFAB] text-white' 
                    : isCurrent 
                      ? 'bg-[#3C1361] text-white ring-2 ring-[#00FFAB]/30' 
                      : 'bg-white text-gray-400 border border-gray-200'
                  }
                `}
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <StepIcon className="w-3 h-3" />
                )}
              </motion.div>
              
              {/* Step Name - Only show current step name */}
              {isCurrent && (
                <motion.span 
                  className="text-xs font-medium text-[#3C1361] mt-1 whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {step.shortName}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
        
        {/* Progress Text */}
        <motion.div 
          className="text-center mt-2 md:mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-xs text-gray-500">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="mx-2 text-gray-300 hidden sm:inline">•</span>
          <span className="text-xs font-medium text-[#3C1361] hidden sm:inline">
            {Math.round((currentStep / (steps.length - 1)) * 100)}% concluído
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutProgress;
