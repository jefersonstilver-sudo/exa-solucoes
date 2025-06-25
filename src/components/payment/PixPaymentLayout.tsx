
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, RefreshCw, Copy, AlertTriangle, ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { usePixPaymentPolling } from '@/hooks/payment/usePixPaymentPolling';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import OrderSummaryComplete from './OrderSummaryComplete';

interface PixPaymentLayoutProps {
  paymentData: PixPaymentData | null;
  onRefreshStatus: () => Promise<void>;
}

const PixPaymentLayout = ({ paymentData, onRefreshStatus }: PixPaymentLayoutProps) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos
  const [qrExpired, setQrExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);

  // Polling otimizado
  const { isPolling, checkCount } = usePixPaymentPolling({
    pedidoId: paymentData?.pedidoId || null,
    isActive: !paymentApproved && paymentData?.status === 'pending',
    onPaymentApproved: () => {
      setPaymentApproved(true);
      toast.success('🎉 Pagamento aprovado!');
      setTimeout(() => {
        navigate(`/pedido-confirmado?id=${paymentData?.pedidoId}`);
      }, 2000);
    }
  });

  // Timer countdown otimizado
  useEffect(() => {
    if (paymentData?.status !== 'pending' || paymentApproved) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setQrExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData?.status, paymentApproved]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = () => {
    if (paymentData?.qrCode) {
      navigator.clipboard.writeText(paymentData.qrCode);
      toast.success('✅ Código PIX copiado!');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setQrExpired(false);
    setTimeLeft(600);
    await onRefreshStatus();
    setIsRefreshing(false);
    toast.success('🔄 QR Code atualizado!');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dados não encontrados</h2>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados do pagamento PIX.</p>
          <Button 
            onClick={() => navigate('/checkout')} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Checkout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simples */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-gray-800 flex items-center">
              <QrCode className="h-6 w-6 mr-2 text-blue-600" />
              Pagamento PIX
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Layout em grid otimizado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Coluna QR Code */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <AnimatePresence mode="wait">
                  {paymentApproved || paymentData.status === 'approved' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8"
                    >
                      <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-green-600 mb-2">
                        🎉 Pagamento Aprovado!
                      </h2>
                      <p className="text-gray-600">
                        Redirecionando...
                      </p>
                    </motion.div>
                  ) : qrExpired ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-8"
                    >
                      <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-orange-800 mb-4">
                        ⏰ QR Code Expirado
                      </h3>
                      <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {isRefreshing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Gerar Novo QR
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* QR Code otimizado */}
                      {paymentData.qrCodeBase64 ? (
                        <div className="bg-white p-4 rounded-lg border-2 border-blue-200 inline-block">
                          <img
                            src={paymentData.qrCodeBase64.startsWith('data:') 
                              ? paymentData.qrCodeBase64 
                              : `data:image/png;base64,${paymentData.qrCodeBase64}`
                            }
                            alt="QR Code PIX"
                            className="w-64 h-64 rounded-lg"
                            onError={(e) => {
                              console.error('Erro QR Code:', e);
                              toast.error('Erro no QR Code');
                              handleRefresh();
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-64 h-64 bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center mx-auto">
                          <div className="text-center text-gray-500">
                            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            <p>Gerando QR Code...</p>
                          </div>
                        </div>
                      )}

                      {/* Timer simples */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <span className="text-2xl font-bold text-blue-800">
                            {formatTime(timeLeft)}
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(timeLeft / 600) * 100}%` }}
                          />
                        </div>
                        <p className="text-center text-blue-700 text-sm mt-2">
                          Tempo restante
                        </p>
                      </div>

                      {/* Status polling */}
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                          <span className="text-green-700 text-sm font-medium">
                            {isPolling ? `🟢 Verificando pagamento... (${checkCount})` : '⚪ Aguardando'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Coluna Resumo e Ações */}
            <div className="space-y-6">
              {/* Resumo do Pedido */}
              {paymentData.pedidoData && (
                <OrderSummaryComplete pedidoData={paymentData.pedidoData} />
              )}

              {/* Código Copia e Cola */}
              {paymentData.qrCode && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    📱 Código PIX
                  </h3>
                  <div className="bg-gray-50 rounded p-3 mb-4 border">
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {paymentData.qrCode}
                    </p>
                  </div>
                  <Button
                    onClick={copyPixCode}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>
                </div>
              )}

              {/* Botão Já Paguei */}
              <div className="bg-green-500 rounded-xl shadow-lg p-6 text-center text-white">
                <h3 className="text-lg font-bold mb-2">
                  ✅ Já realizou o pagamento?
                </h3>
                <p className="mb-4 text-green-100">
                  Clique para verificar o status
                </p>
                <Button
                  onClick={async () => {
                    toast.loading('Verificando...', { id: 'check' });
                    await onRefreshStatus();
                    toast.dismiss('check');
                    toast.success('Status verificado!');
                  }}
                  className="bg-white text-green-600 hover:bg-green-50 font-bold"
                >
                  🎉 JÁ PAGUEI - VERIFICAR!
                </Button>
                <p className="text-green-100 text-xs mt-2">
                  💡 Confirmação automática em poucos segundos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentLayout;
