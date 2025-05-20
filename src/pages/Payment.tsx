
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { usePaymentData } from '@/hooks/payment/usePaymentData';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentError from '@/components/payment/PaymentError';
import PaymentContent from '@/components/payment/PaymentContent';

const Payment = () => {
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido');
  const method = searchParams.get('method') || 'credit_card';
  
  const {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  } = usePaymentData(pedidoId);
  
  if (isLoading) {
    return <PaymentLoading />;
  }
  
  if (error) {
    return <PaymentError error={error} />;
  }
  
  return (
    <Layout>
      {paymentData && (
        <PaymentContent 
          paymentData={paymentData}
          orderId={paymentData.orderId}
          refreshPaymentStatus={refreshPaymentStatus}
        />
      )}
    </Layout>
  );
};

export default Payment;
