
import React from 'react';
import { motion } from 'framer-motion';

const PlanPageHeader = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-8"
    >
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
        Escolha Seu Plano
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Selecione o período de veiculação ideal para sua campanha publicitária
      </p>
    </motion.div>
  );
};

export default PlanPageHeader;
