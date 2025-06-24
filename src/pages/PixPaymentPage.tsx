
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Carregando dados do pagamento PIX...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Erro no Pagamento PIX</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
