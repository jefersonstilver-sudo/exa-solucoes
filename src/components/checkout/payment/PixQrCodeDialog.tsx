import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, X, AlertCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { clearAllCarts } from '@/utils/cartUtils';
import { useRealtimePaymentStatus } from '@/hooks/payment/useRealtimePaymentStatus';
import { motion } from 'framer-motion';

interface PixQrCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentLink?: string;
  pix_url?: string;
  pix_base64?: string;
  userId?: string;
  pedidoId?: string;
  // Props para PIX parcelado/assinatura
  isSubscription?: boolean;
  valorMensal?: number;
  valorTotal?: number;
  totalMeses?: number;
  infoMessage?: string;
}

const PixQrCodeDialog = ({
  isOpen,
  onClose,
  qrCodeBase64,
  qrCodeText,
  paymentLink,
  pix_url,
  pix_base64,
  userId,
  pedidoId,
  isSubscription,
  valorMensal,
  valorTotal,
  totalMeses,
  infoMessage
}: PixQrCodeDialogProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  // Sistema unificado para dados PIX
  const finalQrCodeBase64 = pix_base64 || qrCodeBase64;
  const finalQrCodeText = pix_url || qrCodeText;

  // Integração com monitoramento de pagamento em tempo real
  const { isListening } = useRealtimePaymentStatus({
    userId,
    pedidoId,
    onPaymentApproved: () => {
      toast.success("🎉 Pagamento aprovado!", {
        description: "Redirecionando para seus pedidos...",
        duration: 3000
      });

      setTimeout(() => {
        clearAllCarts();
        navigate('/anunciante/pedidos');
      }, 2000);
    }
  });

  const handleCopyQrCode = async () => {
    if (finalQrCodeText) {
      try {
        await navigator.clipboard.writeText(finalQrCodeText);
        setCopied(true);
        toast.success("Código PIX copiado!");
        logCheckoutEvent(CheckoutEvent.USER_ACTION, LogLevel.INFO, "Código PIX copiado", {
          timestamp: new Date().toISOString()
        });
        setTimeout(() => setCopied(false), 3000);
      } catch (error) {
        toast.error("Erro ao copiar código PIX");
      }
    }
  };

  const handlePaymentConfirmed = () => {
    logCheckoutEvent(CheckoutEvent.PAYMENT_EVENT, LogLevel.SUCCESS, "Usuário confirmou pagamento PIX", {
      timestamp: new Date().toISOString()
    });
    clearAllCarts();
    toast.success("Redirecionando para seus pedidos...");
    navigate('/anunciante/pedidos');
  };

  // Processar imagem QR Code
  const getQrCodeSrc = () => {
    if (!finalQrCodeBase64) return null;
    if (finalQrCodeBase64.startsWith('data:')) return finalQrCodeBase64;
    return `data:image/png;base64,${finalQrCodeBase64}`;
  };

  // Estado de erro - sem dados PIX
  if (!finalQrCodeBase64 && !finalQrCodeText) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Erro ao gerar PIX</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Seu pedido foi criado. Acompanhe na área de pedidos.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/anunciante/pedidos')}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-medium"
              >
                Ver Meus Pedidos
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none gap-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-white/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/30"
        >
          {/* Header minimalista */}
          <div className="relative px-6 pt-6 pb-4">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isSubscription ? 'Primeira Parcela PIX' : 'Pague com PIX'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isSubscription 
                  ? `Pague R$ ${valorMensal?.toFixed(2)} agora • ${totalMeses}x mensais`
                  : 'Escaneie o QR Code ou copie o código'
                }
              </p>
            </div>
          </div>

          {/* QR Code - destaque central */}
          {getQrCodeSrc() && (
            <div className="px-6 pb-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mx-auto w-fit">
                <img 
                  src={getQrCodeSrc()!} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>
          )}

          {/* Código PIX + Botão copiar */}
          {finalQrCodeText && (
            <div className="px-6 pb-4">
              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Código PIX</p>
                <div className="bg-white rounded-xl p-3 border border-gray-200 mb-3 max-h-16 overflow-y-auto">
                  <p className="text-xs text-gray-600 font-mono break-all leading-relaxed">
                    {finalQrCodeText}
                  </p>
                </div>
                <Button
                  onClick={handleCopyQrCode}
                  variant="outline"
                  className={`w-full h-11 rounded-xl font-medium transition-all duration-200 ${
                    copied 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Info Message para PIX parcelado */}
          {isSubscription && infoMessage && (
            <div className="px-6 pb-4">
              <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
                <p className="text-xs text-blue-700 text-center">
                  ℹ️ {infoMessage}
                </p>
              </div>
            </div>
          )}

          {/* Botão confirmar pagamento */}
          <div className="px-6 pb-6">
            <Button
              onClick={handlePaymentConfirmed}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Já realizei o pagamento
            </Button>
            
            {isListening && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Aguardando confirmação automática...
              </p>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default PixQrCodeDialog;
