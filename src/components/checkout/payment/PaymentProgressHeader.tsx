
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PaymentProgressHeaderProps {
  currentStep: number;
}

const PaymentProgressHeader = ({ currentStep }: PaymentProgressHeaderProps) => {
  const steps = [
    { id: 1, title: 'Carrinho', description: 'Itens selecionados' },
    { id: 2, title: 'Pagamento', description: 'Forma de pagamento' },
    { id: 3, title: 'Confirmação', description: 'Pedido finalizado' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${currentStep >= step.id
                    ? 'bg-[#1E1B4B] text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </motion.div>
              
              {/* Step info */}
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className={`h-0.5 ${
                  currentStep > step.id ? 'bg-[#1E1B4B]' : 'bg-gray-200'
                }`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentProgressHeader;
