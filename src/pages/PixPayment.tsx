
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { usePixPayment } from '@/hooks/payment/usePixPayment';
import PixPaymentLoading from '@/components/checkout/payment/PixPaymentLoading';
import PixPaymentError from '@/components/checkout/payment/PixPaymentError';
import PixPaymentContent from '@/components/checkout/payment/PixPaymentContent';

const PixPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const pedidoId = searchParams.get('pedido');
  const { isLoading, error, paymentData, refreshPaymentStatus } = usePixPayment(pedidoId);
  
  // Back to checkout
  const handleBack = () => {
    navigate('/checkout');
  };
  
  // Loading state
  if (isLoading) {
    return <PixPaymentLoading />;
  }
  
  // Error state
  if (error) {
    return <PixPaymentError error={error} onBack={handleBack} />;
  }
  
  return (
    <Layout>
      {paymentData && (
        <PixPaymentContent 
          paymentData={paymentData}
          onBack={handleBack}
          onRefreshStatus={refreshPaymentStatus}
        />
      )}
    </Layout>
  );
};

export default PixPayment;
