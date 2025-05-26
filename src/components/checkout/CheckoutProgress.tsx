
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar, Tag, CreditCard, Upload, ShoppingCart } from 'lucide-react';

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  const steps = [
    { 
      name: 'Plano', 
      icon: Calendar,
      description: 'Período de veiculação',
      motivationalText: 'Escolha seu período ideal!'
    },
    { 
      name: 'Cupom', 
      icon: Tag,
      description: 'Código de desconto',
      motivationalText: 'Economize ainda mais!'
    },
    { 
      name: 'Resumo', 
      icon: ShoppingCart,
      description: 'Revisão do pedido',
      motivationalText: 'Quase lá!'
    },
    { 
      name: 'Pagamento', 
      icon: CreditCard,
      description: 'Finalizar compra',
      motivationalText: 'Último passo!'
    },
    { 
      name: 'Upload', 
      icon: Upload,
      description: 'Enviar material',
      motivationalText: 'Sua campanha começa aqui!'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Progresso do Seu Pedido
        </h3>
        <p className="text-sm text-gray-600">
          {steps[currentStep]?.motivationalText || 'Continue para finalizar!'}
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          const isUpcoming = currentStep < index;
          
          return (
            <div 
              key={step.name} 
              className="flex flex-col items-center relative flex-1"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                  <motion.div 
                    className="h-full bg-gray-200 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: '100%' }}
                  />
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
                  relative z-10 flex items-center justify-center w-12 h-12 rounded-full shadow-lg
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
                whileHover={{ scale: 1.05 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <StepIcon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                )}
              </motion.div>
              
              {/* Step Info */}
              <motion.div 
                className="text-center mt-3 max-w-[80px]"
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
                  {step.name}
                </span>
                <span className="text-xs text-gray-500 leading-tight">
                  {step.description}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
        
        {/* Progress Text */}
        <motion.div 
          className="text-center mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-xs text-gray-500">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-xs font-medium text-[#3C1361]">
            {Math.round((currentStep / (steps.length - 1)) * 100)}% concluído
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutProgress;
