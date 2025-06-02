
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';

const PlanLoadingIndicator = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <div className="h-8 w-8 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seleção de plano...</p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PlanLoadingIndicator;
