
import React from 'react';
import Layout from '@/components/layout/Layout';

const PaymentLoading = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );
};

export default PaymentLoading;
