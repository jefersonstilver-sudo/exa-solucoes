
import React from 'react';
import { motion } from 'framer-motion';

const PlanPageHeader: React.FC = () => {
  return (
    <div className="mb-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Escolha seu plano ideal de veiculação
        </h1>
        <p className="text-center text-gray-600 mt-3 text-lg max-w-3xl mx-auto">
          Ganhe vídeos, economize por mês e destaque sua campanha nos melhores locais!
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-4 flex justify-center"
      >
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-700 text-sm flex items-start gap-2 max-w-xl">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <div>
            <span className="font-medium">Importante:</span> Seu plano determina o período de veiculação e benefícios extras como vídeos inclusos mensalmente para sua campanha. 
            <span className="block mt-1">Escolha um plano antes de prosseguir para o pagamento.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanPageHeader;
