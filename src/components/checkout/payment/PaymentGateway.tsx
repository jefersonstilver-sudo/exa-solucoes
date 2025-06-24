
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import PaymentMethods from './PaymentMethods';
import { formatCurrency } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PaymentGatewayProps {
  orderId: string;
  totalAmount: number;
  preferenceId?: string;
  pixData?: any;
  onRefreshStatus: () => Promise<void>;
  userId?: string;
}

const PaymentGateway = ({ 
  orderId, 
  totalAmount, 
  preferenceId, 
  pixData, 
  onRefreshStatus,
  userId 
}: PaymentGatewayProps) => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>('pix');
  const [isProcessing, setIsProcessing] = useState(false);

  // Force PIX as the only available method
  useEffect(() => {
    console.log("[PaymentGateway] Initializing with PIX as default method");
    setSelectedMethod('pix');
  }, []);

  // Auto-redirect to PIX payment if PIX data exists
  useEffect(() => {
    if (pixData && pixData.qrCodeBase64) {
      console.log("[PaymentGateway] PIX data found, redirecting to PIX payment page");
      navigate(`/pix-payment?pedido=${orderId}`);
    }
  }, [pixData, orderId, navigate]);

  const handlePaymentMethodChange = (method: string) => {
    if (method !== 'pix') {
      toast.info("Apenas pagamento PIX está disponível no momento");
      return;
    }
    setSelectedMethod(method);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header com Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                <span className="ml-2 text-sm text-gray-600">Carrinho</span>
              </div>
              <div className="w-12 h-0.5 bg-green-500"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                <span className="ml-2 text-sm text-gray-600">Plano</span>
              </div>
              <div className="w-12 h-0.5 bg-green-500"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <span className="ml-2 text-sm font-semibold text-blue-600">Pagamento</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-sm font-bold">4</div>
                <span className="ml-2 text-sm text-gray-400">Confirmação</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                💳 Finalizar Pagamento
              </h1>
              <p className="text-gray-600 text-lg">
                Escolha sua forma de pagamento preferida
              </p>
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <p className="text-2xl font-bold text-green-600">
                  Total: {formatCurrency(totalAmount * 0.95)} 
                  <span className="text-sm font-normal text-gray-600 ml-2">(com 5% desconto PIX)</span>
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <PaymentMethods
              selectedMethod={selectedMethod}
              setSelectedMethod={handlePaymentMethodChange}
              totalPrice={totalAmount}
              pedidoId={orderId}
            />

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
              <Button
                onClick={() => navigate('/checkout/resumo')}
                variant="outline"
                className="px-8 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                ← Voltar ao Resumo
              </Button>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <p className="text-green-800 font-medium text-center">
                  ✅ PIX será processado automaticamente ao selecionar
                </p>
              </div>
            </div>

            {/* Security Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Conexão Segura</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Dados Protegidos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Pagamento Instantâneo</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
