
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';

const PixPaymentLoading = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 py-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="h-12 w-12 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Preparando seu pagamento PIX
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto geramos o QR Code...
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PixPaymentLoading;
