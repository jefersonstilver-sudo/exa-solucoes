
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const PlanButtonLoading = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-10 flex justify-center"
    >
      <Button 
        size="lg" 
        className="px-8 py-6"
        disabled={true}
      >
        <span className="mr-2">Verificando autenticação</span>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      </Button>
    </motion.div>
  );
};

export default PlanButtonLoading;
