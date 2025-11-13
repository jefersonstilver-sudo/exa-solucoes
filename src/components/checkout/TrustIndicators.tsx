
import React from 'react';
import { motion } from 'framer-motion';

const TrustIndicators: React.FC = () => {
  return (
    <motion.div 
      className="mt-8 p-4 border border-[#1E1B4B]/10 rounded-2xl bg-opacity-50 bg-indigo-50 flex items-center justify-center space-x-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span role="img" aria-label="secure" className="text-lg">🔒</span>
        <span className="font-medium">Compra 100% Segura com Stripe</span>
      </div>
      <div className="h-4 border-r border-gray-300 hidden sm:block"></div>
      <div className="text-sm text-gray-600 hidden sm:block">
        <span>Mais de 1.200 anunciantes atendidos</span>
      </div>
    </motion.div>
  );
};

export default TrustIndicators;
