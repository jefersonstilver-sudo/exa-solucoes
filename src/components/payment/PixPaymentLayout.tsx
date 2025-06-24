
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, RefreshCw, Copy, AlertTriangle } from 'lucide-react';
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

  // Configurar polling automático
  const { isPolling } = usePixPaymentPolling({
    pedidoId: paymentData?.pedidoId || null,
    isActive: paymentData?.status === 'pending',
    onPaymentApproved: () => {
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
    if (paymentData?.status !== 'pending') return;

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
  }, [paymentData?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = () => {
    if (paymentData?.qrCode) {
      navigator.clipboard.writeText(paymentData.qrCode);
      toast.success('Código PIX copiado!');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setQrExpired(false);
    setTimeLeft(600);
    await onRefreshStatus();
    setIsRefreshing(false);
    toast.success('QR Code atualizado!');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Dados de pagamento não encontrados</h2>
          <Button onClick={() => navigate('/checkout')} className="bg-[#3C1361] hover:bg-[#3C1361]/90">
            Voltar ao Checkout
          </Button>
        </div>
      </div>
    );
  }

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
                <span className="ml-2 text-sm font-semibold text-blue-600">Pagamento PIX</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda - QR Code */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Pagamento via PIX
                </h1>
                <p className="text-gray-600 mb-6">
                  Escaneie o QR Code com seu app bancário
                </p>

                <AnimatePresence mode="wait">
                  {paymentData.status === 'approved' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-green-600 mb-2">
                        Pagamento Aprovado!
                      </h2>
                      <p className="text-gray-600">
                        Redirecionando para confirmação...
                      </p>
                    </motion.div>
                  ) : qrExpired ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-orange-800 mb-4">
                        QR Code Expirado
                      </h3>
                      <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {isRefreshing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Gerando novo QR...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Gerar Novo QR Code
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
                      {/* QR Code */}
                      {paymentData.qrCodeBase64 ? (
                        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                          <img
                            src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                            alt="QR Code PIX"
                            className="w-64 h-64 mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="w-64 h-64 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center mx-auto">
                          <div className="text-center text-gray-500">
                            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            <p>Gerando QR Code...</p>
                          </div>
                        </div>
                      )}

                      {/* Timer */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-800 font-semibold">
                            Tempo restante: {formatTime(timeLeft)}
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(timeLeft / 600) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Status de Monitoramento */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-600">
                            {isPolling ? 'Monitorando pagamento...' : 'Aguardando pagamento'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Coluna Direita - Informações */}
            <div className="space-y-6">
              {/* Valor do Pedido */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="text-2xl font-bold text-[#3C1361]">
                      {formatCurrency(paymentData.valorTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Desconto PIX (5%):</span>
                    <span className="text-green-600 font-semibold">
                      -{formatCurrency((paymentData.valorTotal || 0) * 0.05)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Valor Final:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency((paymentData.valorTotal || 0) * 0.95)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Código PIX Copia e Cola */}
              {paymentData.qrCode && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Código PIX</h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {paymentData.qrCode}
                    </p>
                  </div>
                  <Button
                    onClick={copyPixCode}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>
                </div>
              )}

              {/* Botão Já Paguei */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-center">
                <h3 className="text-white font-semibold text-lg mb-4">
                  Pagamento realizado?
                </h3>
                <Button
                  onClick={onRefreshStatus}
                  className="w-full bg-white text-green-600 hover:bg-gray-50 font-bold text-lg py-3"
                  size="lg"
                >
                  ✓ Já Paguei - Verificar Status
                </Button>
                <p className="text-green-100 text-sm mt-3">
                  O pagamento será confirmado automaticamente
                </p>
              </div>

              {/* Instruções */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Como pagar</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <p>Abra o app do seu banco ou carteira digital</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">2</span>
                    </div>
                    <p>Escaneie o QR Code ou cole o código PIX</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">3</span>
                    </div>
                    <p>Confirme os dados e finalize o pagamento</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-xs">✓</span>
                    </div>
                    <p className="text-green-600 font-semibold">Aprovação automática em segundos!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentLayout;
