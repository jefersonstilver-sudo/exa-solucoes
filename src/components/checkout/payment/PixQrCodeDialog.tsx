import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, X, AlertCircle } from 'lucide-react';
import { QRCodeDisplay } from '@/components/checkout/payment/QRCodeDisplay';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { clearAllCarts } from '@/utils/cartUtils';
import { useRealtimePaymentStatus } from '@/hooks/payment/useRealtimePaymentStatus';
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
  context?: 'store' | 'orders'; // Adicionar contexto para distinguir comportamento
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
  context = 'store' // Default para comportamento original da loja
}: PixQrCodeDialogProps) => {
  const navigate = useNavigate();

  // Sistema unificado para dados PIX
  const finalQrCodeBase64 = pix_base64 || qrCodeBase64;
  const finalQrCodeText = pix_url || qrCodeText;
  const isTestMode = finalQrCodeText?.includes('teste') || finalQrCodeBase64?.includes('test');

  // Integração com monitoramento de pagamento em tempo real
  const {
    isListening
  } = useRealtimePaymentStatus({
    userId,
    pedidoId,
    onPaymentApproved: () => {
      console.log("🎉 [PixQrCodeDialog] Pagamento aprovado automaticamente!");
      toast.success("🎉 Pagamento aprovado!", {
        description: "Seu pedido foi confirmado automaticamente!",
        duration: 3000
      });

      // Fechar popup após breve delay para mostrar o sucesso
      setTimeout(() => {
        if (context === 'store') {
          redirectToOrders();
        } else {
          onClose(); // No contexto de pedidos, apenas fechar o modal
        }
      }, 2000);
    }
  });
  console.log("🖼️ [PixQrCodeDialog] SISTEMA UNIFICADO - Dados recebidos:", {
    isOpen,
    hasQrCodeBase64: !!finalQrCodeBase64,
    hasQrCodeText: !!finalQrCodeText,
    hasPaymentLink: !!paymentLink,
    isTestMode,
    userId,
    pedidoId,
    isListening,
    qrTextPreview: finalQrCodeText?.substring(0, 50) + '...'
  });
  const handleCopyQrCode = () => {
    if (finalQrCodeText) {
      navigator.clipboard.writeText(finalQrCodeText).then(() => {
        console.log("📋 [PixQrCodeDialog] Código PIX copiado");
        toast.success("Código PIX copiado!");
        logCheckoutEvent(CheckoutEvent.USER_ACTION, LogLevel.INFO, "Código PIX copiado pelo usuário", {
          isTestMode,
          timestamp: new Date().toISOString()
        });
      }).catch(error => {
        console.error("❌ [PixQrCodeDialog] Erro ao copiar:", error);
        toast.error("Erro ao copiar código PIX");
      });
    } else {
      toast.error("Código PIX não disponível");
    }
  };
  const redirectToOrders = () => {
    console.log("🔄 [PixQrCodeDialog] SISTEMA UNIFICADO - Redirecionando para pedidos");
    logCheckoutEvent(CheckoutEvent.NAVIGATION_EVENT, LogLevel.INFO, "Redirecionamento para pedidos após PIX", {
      isTestMode,
      timestamp: new Date().toISOString()
    });

    // Limpar todos os carrinhos
    clearAllCarts();
    toast.success("Redirecionando para seus pedidos...");
    navigate('/anunciante/pedidos');
  };
  const handleClose = () => {
    console.log("❌ [PixQrCodeDialog] Botão fechar clicado");
    if (context === 'store') {
      redirectToOrders();
    } else {
      onClose(); // No contexto de pedidos, apenas fechar o modal
    }
  };
  const handlePaymentConfirmed = () => {
    console.log("✅ [PixQrCodeDialog] Pagamento confirmado pelo usuário");
    logCheckoutEvent(CheckoutEvent.PAYMENT_EVENT, LogLevel.SUCCESS, "Usuário confirmou pagamento PIX", {
      isTestMode,
      timestamp: new Date().toISOString()
    });
    if (context === 'store') {
      redirectToOrders();
    } else {
      onClose(); // No contexto de pedidos, apenas fechar o modal
    }
  };

  // Se não há dados do QR Code, mostrar erro com opções
  if (!finalQrCodeBase64 && !finalQrCodeText) {
    console.error("❌ [PixQrCodeDialog] Dados PIX não disponíveis");
    return <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] border-0 bg-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-2xl font-bold text-red-600 flex items-center justify-center gap-3">
              <AlertCircle className="h-8 w-8" />
              Erro ao Gerar PIX
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-6">
            <p className="text-gray-600 text-lg">
              Não foi possível gerar o QR Code PIX no momento.
            </p>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <p className="text-blue-700 font-medium">
                Seu pedido foi criado com sucesso! Você pode acompanhar o status na área de pedidos.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button onClick={() => window.location.reload()} variant="outline" className="h-12 rounded-2xl border-2 hover:bg-gray-50 font-semibold">
                Tentar Novamente
              </Button>
              <Button onClick={handleClose} className="h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl font-semibold">
                Ver Meus Pedidos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 rounded-3xl shadow-2xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] max-h-[90vh] overflow-y-auto">
        {/* Header moderno e clean */}
        <DialogHeader className="relative text-center pb-8">
          <Button variant="ghost" size="icon" onClick={handleClose} className="absolute -right-3 -top-3 h-10 w-10 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
          
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg viewBox="0 0 512 512" className="h-10 w-10 text-white" fill="currentColor">
              <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z" />
            </svg>
          </div>
          
          <DialogTitle className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento PIX
          </DialogTitle>
          
          
          
          {/* Indicadores de status limpos */}
          {isTestMode && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4">
              <div className="flex items-center justify-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Modo de Teste</span>
              </div>
            </div>}

          {isListening}
        </DialogHeader>
        
        <div className="space-y-8 pb-6">
          {/* QR Code Display - destaque principal */}
          {finalQrCodeBase64 && <div className="flex justify-center">
              <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-xl">
                <QRCodeDisplay qrCodeBase64={finalQrCodeBase64} />
              </div>
            </div>}

          {/* Código PIX para copiar - design moderno */}
          {finalQrCodeText && <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Código PIX:</p>
                <div className="text-xs text-gray-600 break-all font-mono bg-white p-4 rounded-xl border border-gray-200 max-h-20 overflow-y-auto">
                  {finalQrCodeText}
                </div>
              </div>
              
              <Button onClick={handleCopyQrCode} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-lg shadow-lg transition-all duration-200 hover:shadow-xl">
                <Copy className="h-5 w-5 mr-3" />
                Copiar Código PIX
              </Button>
            </div>}

          {/* Botão principal - design premium */}
          <div className="pt-4">
            <Button onClick={handlePaymentConfirmed} className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 hover:shadow-3xl transform hover:scale-[1.02]">
              <CheckCircle className="h-7 w-7 mr-3" />
              {isListening ? "Confirmar Pagamento" : "Já Paguei"}
            </Button>
            
            
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default PixQrCodeDialog;