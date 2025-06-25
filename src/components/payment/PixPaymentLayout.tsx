
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, RefreshCw, Copy, AlertTriangle, ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { usePixPaymentPolling } from '@/hooks/payment/usePixPaymentPolling';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';

interface PixPaymentLayoutProps {
  paymentData: PixPaymentData | null;
  onRefreshStatus: () => Promise<void>;
}

const PixPaymentLayout = ({ paymentData, onRefreshStatus }: PixPaymentLayoutProps) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos
  const [qrExpired, setQrExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);

  // Configurar polling automático
  const { isPolling } = usePixPaymentPolling({
    pedidoId: paymentData?.pedidoId || null,
    isActive: !paymentApproved && paymentData?.status === 'pending',
    onPaymentApproved: () => {
      setPaymentApproved(true);
      toast.success('🎉 Pagamento aprovado!', {
        description: 'Redirecionando para confirmação...',
        duration: 3000
      });
      setTimeout(() => {
        navigate(`/pedido-confirmado?id=${paymentData?.pedidoId}`);
      }, 2000);
    }
  });

  // Timer countdown
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
      toast.success('✅ Código PIX copiado para área de transferência!');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setQrExpired(false);
    setTimeLeft(600);
    await onRefreshStatus();
    setIsRefreshing(false);
    toast.success('🔄 QR Code atualizado com sucesso!');
  };

  const handleAlreadyPaid = async () => {
    toast.loading('Verificando pagamento...', { id: 'checking-payment' });
    await onRefreshStatus();
    toast.dismiss('checking-payment');
    toast.success('✅ Status verificado!');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dados não encontrados</h2>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados do pagamento PIX.</p>
          <Button 
            onClick={() => navigate('/checkout')} 
            className="bg-[#3C1361] hover:bg-[#3C1361]/90 text-white px-8 py-3 rounded-xl font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Checkout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header Premium com Timeline */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Etapa 1 - Carrinho ✓ */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600 hidden md:block">Carrinho</span>
              </div>
              <div className="w-8 md:w-12 h-0.5 bg-green-500"></div>
              
              {/* Etapa 2 - Plano ✓ */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600 hidden md:block">Plano</span>
              </div>
              <div className="w-8 md:w-12 h-0.5 bg-green-500"></div>
              
              {/* Etapa 3 - PIX Payment (Ativo) */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="ml-2 text-sm font-bold text-blue-600 hidden md:block">Pagamento PIX</span>
              </div>
              <div className="w-8 md:w-12 h-0.5 bg-gray-300"></div>
              
              {/* Etapa 4 - Confirmação */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-sm font-bold">
                  4
                </div>
                <span className="ml-2 text-sm text-gray-400 hidden md:block">Confirmação</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Layout Premium - Grid Responsivo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Coluna Esquerda - QR Code e Controles */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                    <QrCode className="h-8 w-8 mr-3 text-blue-500" />
                    Pagamento via PIX
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Escaneie o QR Code ou use o código copia e cola
                  </p>
                </motion.div>

                <AnimatePresence mode="wait">
                  {paymentApproved || paymentData.status === 'approved' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <CheckCircle className="h-32 w-32 text-green-500 mx-auto mb-6" />
                      <h2 className="text-3xl font-bold text-green-600 mb-4">
                        🎉 Pagamento Aprovado!
                      </h2>
                      <p className="text-gray-600 text-lg">
                        Redirecionando para confirmação...
                      </p>
                    </motion.div>
                  ) : qrExpired ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <AlertTriangle className="h-20 w-20 text-orange-500 mx-auto mb-6" />
                      <h3 className="text-2xl font-semibold text-orange-800 mb-6">
                        ⏰ QR Code Expirado
                      </h3>
                      <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                        size="lg"
                      >
                        {isRefreshing ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                            Gerando novo QR...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-5 w-5 mr-3" />
                            🔄 Gerar Novo QR Code
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* QR Code Premium */}
                      {paymentData.qrCodeBase64 ? (
                        <div className="relative">
                          <div 
                            className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-3xl border-2 border-blue-200 inline-block cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            onClick={() => setShowQRModal(true)}
                          >
                            <img
                              src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                              alt="QR Code PIX"
                              className="w-80 h-80 mx-auto rounded-2xl shadow-lg"
                            />
                          </div>
                          <p className="text-sm text-blue-600 mt-3 font-medium">
                            📱 Clique no QR Code para ampliar
                          </p>
                        </div>
                      ) : (
                        <div className="w-80 h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl border-2 border-gray-300 flex items-center justify-center mx-auto">
                          <div className="text-center text-gray-500">
                            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin" />
                            <p className="text-lg font-medium">Gerando QR Code...</p>
                            <p className="text-sm">Aguarde alguns segundos</p>
                          </div>
                        </div>
                      )}

                      {/* Timer Visual Premium */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                          <Clock className="h-6 w-6 text-blue-600" />
                          <span className="text-3xl font-bold text-blue-800">
                            ⏰ {formatTime(timeLeft)}
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full"
                            initial={{ width: "100%" }}
                            animate={{ width: `${(timeLeft / 600) * 100}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <p className="text-center text-blue-700 text-sm mt-3 font-medium">
                          Tempo restante para pagamento
                        </p>
                      </div>

                      {/* Status Premium */}
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
                        <div className="flex items-center justify-center space-x-3">
                          <motion.div 
                            className={`w-3 h-3 rounded-full ${isPolling ? 'bg-green-400' : 'bg-gray-300'}`}
                            animate={isPolling ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                          <span className="text-green-700 font-medium">
                            {isPolling ? '🟢 Monitorando pagamento em tempo real...' : '⚪ Aguardando pagamento'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Coluna Direita - Informações e Ações Premium */}
            <div className="space-y-6">
              {/* Resumo Premium */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  📋 Resumo do Pedido
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Valor Original:</span>
                    <span className="text-xl font-bold text-gray-800">
                      {formatCurrency(paymentData.valorTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-green-600 font-medium">💰 Desconto PIX (5%):</span>
                    <span className="text-xl font-bold text-green-600">
                      -{formatCurrency((paymentData.valorTotal || 0) * 0.05)}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 font-bold text-lg">💳 Valor Final:</span>
                      <span className="text-3xl font-bold text-green-600">
                        {formatCurrency((paymentData.valorTotal || 0) * 0.95)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Código Copia e Cola Premium */}
              {paymentData.qrCode && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    📱 Código PIX - Copia e Cola
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
                    <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                      {paymentData.qrCode}
                    </p>
                  </div>
                  <Button
                    onClick={copyPixCode}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                    size="lg"
                  >
                    <Copy className="h-5 w-5 mr-3" />
                    📋 Copiar Código PIX
                  </Button>
                </motion.div>
              )}

              {/* Botão "Já Paguei" - DESTAQUE MÁXIMO */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-3xl shadow-2xl p-8 text-center border-2 border-green-300"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <h3 className="text-white font-bold text-2xl mb-4">
                    ✅ Já realizou o pagamento?
                  </h3>
                  <p className="text-green-100 mb-6 text-lg">
                    Clique no botão abaixo para verificar o status
                  </p>
                  <Button
                    onClick={handleAlreadyPaid}
                    className="bg-white text-green-600 hover:bg-green-50 font-bold text-xl py-6 px-12 rounded-2xl shadow-xl transform hover:scale-110 transition-all duration-300 border-2 border-white"
                    size="lg"
                  >
                    🎉 JÁ PAGUEI - VERIFICAR AGORA!
                  </Button>
                </motion.div>
                <p className="text-green-100 text-sm mt-4 font-medium">
                  💡 O pagamento será confirmado automaticamente em alguns segundos
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal QR Code Ampliado Premium */}
      <AnimatePresence>
        {showQRModal && paymentData.qrCodeBase64 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                📱 QR Code PIX - Ampliado
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-2xl border-2 border-blue-200 mb-6">
                <img
                  src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                  alt="QR Code PIX Ampliado"
                  className="w-full max-w-sm mx-auto rounded-xl"
                />
              </div>
              <Button
                onClick={() => setShowQRModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold"
              >
                Fechar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PixPaymentLayout;
