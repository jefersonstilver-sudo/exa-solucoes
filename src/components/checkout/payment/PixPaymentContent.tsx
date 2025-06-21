
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, CheckCircle, RefreshCw, Shield, Clock } from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { toast } from 'sonner';
import PixCountdownTimer from './PixCountdownTimer';
import PaymentStatusBadge from './PaymentStatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useOrderSecurity } from '@/hooks/useOrderSecurity';

interface PixPaymentContentProps {
  paymentData: {
    qrCodeBase64?: string;
    qrCode?: string;
    paymentId?: string;
    status?: string;
    createdAt?: string;
    pedidoId?: string;
    valorTotal?: number;
  };
  onBack: () => void;
  onRefreshStatus: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  pedidoId?: string | null;
}

const PixPaymentContent = ({
  paymentData,
  onBack,
  onRefreshStatus,
  isLoading,
  error,
  pedidoId
}: PixPaymentContentProps) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { isAuthorized, isLoading: securityLoading } = useOrderSecurity(pedidoId);

  // Auto-refresh status every 10 seconds
  useEffect(() => {
    if (paymentData.status === 'pending' && isAuthorized) {
      const interval = setInterval(async () => {
        await handleRefreshStatus();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [paymentData.status, isAuthorized]);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRegenerateQRCode = async () => {
    if (!pedidoId) return;
    
    setIsRegenerating(true);
    try {
      console.log("🔄 [PixPaymentContent] Regenerando QR Code para pedido:", pedidoId);
      
      const { data, error } = await supabase.functions.invoke('process-pix-payment', {
        body: { pedidoId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success("QR Code regenerado com sucesso!");
      await onRefreshStatus();
      
    } catch (error: any) {
      console.error("❌ [PixPaymentContent] Erro ao regenerar QR Code:", error);
      toast.error(`Erro ao regenerar QR Code: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyPixCode = () => {
    if (paymentData.qrCode) {
      navigator.clipboard.writeText(paymentData.qrCode)
        .then(() => toast.success("Código PIX copiado!"))
        .catch(() => toast.error("Erro ao copiar código PIX"));
    }
  };

  const handlePaymentConfirmed = () => {
    toast.success("Redirecionando para seus pedidos...");
    navigate('/anunciante/pedidos');
  };

  // Verificação de segurança
  if (securityLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificando Permissões</h2>
          <p className="text-gray-600">Validando acesso ao pedido...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
            <p className="text-gray-600 mb-6">
              Você não tem permissão para acessar este pedido ou ele pode ter expirado.
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Pedidos são cancelados automaticamente após 24 horas sem pagamento.
              </span>
            </p>
            <div className="space-y-4">
              <Button onClick={() => navigate('/paineis-digitais/loja')} className="w-full">
                Fazer Novo Pedido
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro no Pagamento</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 sm:pt-24">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Pagamento PIX
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Escaneie o QR Code ou copie o código PIX para finalizar o pagamento
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8"
        >
          <div className="space-y-4 sm:space-y-6">
            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 rounded-lg p-3">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Pagamento Seguro e Verificado</span>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <PaymentStatusBadge status={paymentData.status || 'pending'} />
            </div>

            {/* Timer */}
            {paymentData.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Tempo para pagamento:</span>
                </div>
                <PixCountdownTimer
                  initialSeconds={600} // 10 minutes
                  onExpire={() => {
                    toast.error("QR Code expirado. Clique em regenerar para criar um novo.");
                  }}
                  isActive={paymentData.status === 'pending'}
                  paymentStatus={paymentData.status || 'pending'}
                  createdAt={paymentData.createdAt}
                />
              </div>
            )}

            {/* QR Code */}
            <div className="flex justify-center">
              <QRCodeDisplay 
                qrCodeBase64={paymentData.qrCodeBase64} 
                onRegenerate={handleRegenerateQRCode}
              />
            </div>

            {/* PIX Code */}
            {paymentData.qrCode && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código PIX (Copia e Cola):
                  </label>
                  <div className="bg-white border rounded-lg p-3">
                    <code className="text-xs break-all text-gray-800">
                      {paymentData.qrCode}
                    </code>
                  </div>
                </div>
                
                <Button
                  onClick={handleCopyPixCode}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copiar Código PIX
                </Button>
              </div>
            )}

            {/* Payment Value */}
            {paymentData.valorTotal && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Valor a pagar:</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  R$ {(paymentData.valorTotal * 0.95).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="line-through">R$ {paymentData.valorTotal.toFixed(2)}</span>
                  {' '} (5% de desconto PIX)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                variant="outline"
                className="w-full"
              >
                {isRefreshing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verificando pagamento...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar Status do Pagamento
                  </>
                )}
              </Button>

              <Button
                onClick={handleRegenerateQRCode}
                disabled={isRegenerating}
                variant="outline"
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
              >
                {isRegenerating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Regenerando QR Code...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar QR Code
                  </>
                )}
              </Button>

              <Button
                onClick={handlePaymentConfirmed}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Já Realizei o Pagamento
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Como pagar:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Abra o app do seu banco</li>
                <li>2. Acesse a área PIX</li>
                <li>3. Escaneie o QR Code ou cole o código</li>
                <li>4. Confirme o pagamento</li>
                <li>5. Aguarde a confirmação automática</li>
              </ol>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 border-l-4 border-green-500 p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 mb-1">Pagamento Seguro</p>
                  <p className="text-gray-600">
                    Seu pedido é cancelado automaticamente após 24 horas sem pagamento. 
                    Todos os pagamentos são processados de forma segura pelo MercadoPago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 sm:mt-6 flex justify-center"
        >
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Checkout</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PixPaymentContent;
