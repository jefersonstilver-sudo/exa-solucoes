
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PixPaymentLayout from '@/components/payment/PixPaymentLayout';
import { usePixPayment } from '@/hooks/payment/usePixPayment';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PixPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido');

  const {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  } = usePixPayment(pedidoId);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Erro no Pagamento PIX</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PixPaymentLayout 
        paymentData={paymentData}
        onRefreshStatus={refreshPaymentStatus}
      />
    </Layout>
  );
};

export default PixPaymentPage;
