
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
      mobileShort: 'Plano',
      icon: Calendar,
      description: 'Período',
      motivationalText: 'Escolha seu período ideal!'
    },
    { 
      name: 'Cupom', 
      shortName: 'Cupom',
      mobileShort: 'Cupom',
      icon: Tag,
      description: 'Desconto',
      motivationalText: 'Economize ainda mais!'
    },
    { 
      name: 'Resumo', 
      shortName: 'Resumo',
      mobileShort: 'Resumo',
      icon: ShoppingCart,
      description: 'Revisão',
      motivationalText: 'Quase lá!'
    },
    { 
      name: 'Pagamento', 
      shortName: 'Pag.',
      mobileShort: 'Pag.',
      icon: CreditCard,
      description: 'Finalizar',
      motivationalText: 'Último passo!'
    },
    { 
      name: 'Upload', 
      shortName: 'Upload',
      mobileShort: 'Upload',
      icon: Upload,
      description: 'Material',
      motivationalText: 'Sua campanha começa aqui!'
    }
  ];

  return (
    <div className="w-full">
      {/* Progress Header - Ultra compacto */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2 md:mb-4"
      >
        <h3 className="text-xs md:text-lg font-semibold text-gray-900 mb-1">
          Progresso do Seu Pedido
        </h3>
        <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
          {steps[currentStep]?.motivationalText || 'Continue para finalizar!'}
        </p>
      </motion.div>

      {/* Desktop/Tablet View - A partir de 640px */}
      <div className="hidden sm:flex justify-between items-center mb-3 md:mb-4">
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
                <div className="absolute top-4 md:top-5 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
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
                  relative z-10 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-[#3C1361] to-[#00FFAB] text-white' 
                    : isCurrent 
                      ? 'bg-[#3C1361] text-white ring-3 ring-[#00FFAB]/30' 
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
                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                ) : (
                  <StepIcon className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </motion.div>
              
              {/* Step Info */}
              <motion.div 
                className="text-center mt-1 md:mt-2 max-w-[50px] md:max-w-[70px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <span 
                  className={`
                    text-xs font-medium block leading-tight
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

      {/* Mobile View - Ultra compacto */}
      <div className="flex sm:hidden justify-center items-center mb-2 px-1">
        <div className="flex items-center space-x-1 max-w-full overflow-hidden">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > index;
            const isCurrent = currentStep === index;
            const isVisible = Math.abs(index - currentStep) <= 1;
            
            if (!isVisible) return null;
            
            return (
              <div 
                key={step.name} 
                className="flex items-center"
              >
                {/* Connection Line para mobile */}
                {index > 0 && isVisible && (
                  <div className="w-3 h-0.5 mx-1">
                    <div className="h-full bg-gray-200 rounded-full" />
                    <motion.div 
                      className="absolute h-0.5 bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
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
                    flex items-center justify-center w-5 h-5 rounded-full shadow-md
                    ${isCompleted 
                      ? 'bg-gradient-to-r from-[#3C1361] to-[#00FFAB] text-white' 
                      : isCurrent 
                        ? 'bg-[#3C1361] text-white ring-1 ring-[#00FFAB]/30' 
                        : 'bg-white text-gray-400 border border-gray-200'
                    }
                  `}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.2 : 1 }}
                >
                  {isCompleted ? (
                    <Check className="w-2.5 h-2.5" />
                  ) : (
                    <StepIcon className="w-2.5 h-2.5" />
                  )}
                </motion.div>
                
                {/* Step Name - Apenas para o atual */}
                {isCurrent && (
                  <motion.span 
                    className="text-xs font-bold text-[#3C1361] ml-1 whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {step.mobileShort}
                  </motion.span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-1 md:h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
        
        {/* Progress Text */}
        <motion.div 
          className="text-center mt-1 md:mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-xs text-gray-500">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="mx-2 text-gray-300 hidden md:inline">•</span>
          <span className="text-xs font-medium text-[#3C1361] hidden md:inline">
            {Math.round((currentStep / (steps.length - 1)) * 100)}% concluído
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutProgress;
