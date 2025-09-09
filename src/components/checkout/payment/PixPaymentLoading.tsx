
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import EnhancedLoadingSpinner from '@/components/loading/EnhancedLoadingSpinner';

const PixPaymentLoading = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pt-24 py-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6"
        >
          <EnhancedLoadingSpinner 
            size="xl" 
            variant="primary"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Preparando seu pagamento PIX
            </h2>
            <p className="text-muted-foreground">
              Aguarde enquanto geramos o QR Code...
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PixPaymentLoading;
