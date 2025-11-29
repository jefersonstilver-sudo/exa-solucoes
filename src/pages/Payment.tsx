
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { usePaymentData } from '@/hooks/payment/usePaymentData';
import PaymentLoading from '@/components/payment/PaymentLoading';
import PaymentError from '@/components/payment/PaymentError';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';

/**
 * Página simplificada /payment
 * Agora é usada apenas para exibir o STATUS de pagamentos existentes
 * Não oferece mais seleção de método de pagamento
 */
const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pedidoId = searchParams.get('pedido');
  
  const {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  } = usePaymentData(pedidoId);
  
  // Redirecionar se não houver pedido
  useEffect(() => {
    if (!pedidoId) {
      console.log('[Payment] Nenhum pedido especificado, redirecionando...');
      navigate('/paineis-digitais/loja');
    }
  }, [pedidoId, navigate]);
  
  if (isLoading) {
    return <PaymentLoading />;
  }
  
  if (error) {
    return <PaymentError error={error} />;
  }
  
  // Exibir status do pagamento
  const getStatusIcon = () => {
    switch (paymentData?.status) {
      case 'approved':
      case 'confirmado':
        return <CheckCircle2 className="h-12 w-12 text-green-600" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-600" />;
      default:
        return <AlertCircle className="h-12 w-12 text-gray-600" />;
    }
  };
  
  const getStatusText = () => {
    switch (paymentData?.status) {
      case 'approved':
      case 'confirmado':
        return 'Pagamento Confirmado';
      case 'pending':
        return 'Aguardando Pagamento';
      default:
        return 'Status do Pagamento';
    }
  };
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>
            
            {/* Status Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
              {getStatusText()}
            </h1>
            
            {/* Order Info */}
            {paymentData && (
              <div className="space-y-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">ID do Pedido</span>
                    <span className="font-mono text-sm">{paymentData.orderId}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(paymentData.totalAmount)}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => navigate('/anunciante/pedidos')}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Ver Meus Pedidos
                  </button>
                  
                  <button
                    onClick={() => refreshPaymentStatus()}
                    className="py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Atualizar Status
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Payment;
