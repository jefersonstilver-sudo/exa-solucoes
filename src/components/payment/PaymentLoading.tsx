
import React from 'react';
import Layout from '@/components/layout/Layout';
import EnhancedLoadingSpinner from '@/components/loading/EnhancedLoadingSpinner';

const PaymentLoading = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[50vh]">
        <EnhancedLoadingSpinner 
          size="xl" 
          showText={true} 
          text="Processando pagamento..."
          variant="primary"
        />
      </div>
    </Layout>
  );
};

export default PaymentLoading;
