
import React from 'react';
import { motion } from 'framer-motion';

const PlanPageFooter: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="mt-8 text-center text-gray-600 text-sm"
    >
      <p>
        Todos os planos incluem: Gerenciamento de campanhas, Relatórios de desempenho, Suporte dedicado
      </p>
      <p className="mt-2">
        Dúvidas? Entre em contato com nossa equipe: (xx) xxxx-xxxx
      </p>
    </motion.div>
  );
};

export default PlanPageFooter;
