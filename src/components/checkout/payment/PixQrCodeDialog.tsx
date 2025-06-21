
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, X, Smartphone, AlertCircle } from 'lucide-react';
import { QRCodeDisplay } from '@/components/checkout/payment/QRCodeDisplay';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { clearAllCarts } from '@/utils/cartUtils';

interface PixQrCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentLink?: string;
  pix_url?: string;
  pix_base64?: string;
}

const PixQrCodeDialog = ({
  isOpen,
  onClose,
  qrCodeBase64,
  qrCodeText,
  paymentLink,
  pix_url,
  pix_base64
}: PixQrCodeDialogProps) => {
  const navigate = useNavigate();
  
  // Sistema unificado para dados PIX
  const finalQrCodeBase64 = pix_base64 || qrCodeBase64;
  const finalQrCodeText = pix_url || qrCodeText;
  const isTestMode = finalQrCodeText?.includes('teste') || finalQrCodeBase64?.includes('test');

  console.log("🖼️ [PixQrCodeDialog] SISTEMA UNIFICADO - Dados recebidos:", {
    isOpen,
    hasQrCodeBase64: !!finalQrCodeBase64,
    hasQrCodeText: !!finalQrCodeText,
    hasPaymentLink: !!paymentLink,
    isTestMode,
    qrTextPreview: finalQrCodeText?.substring(0, 50) + '...'
  });

  const handleCopyQrCode = () => {
    if (finalQrCodeText) {
      navigator.clipboard.writeText(finalQrCodeText)
        .then(() => {
          console.log("📋 [PixQrCodeDialog] Código PIX copiado");
          toast.success("Código PIX copiado!");
          logCheckoutEvent(
            CheckoutEvent.USER_ACTION,
            LogLevel.INFO,
            "Código PIX copiado pelo usuário",
            { isTestMode, timestamp: new Date().toISOString() }
          );
        })
        .catch((error) => {
          console.error("❌ [PixQrCodeDialog] Erro ao copiar:", error);
          toast.error("Erro ao copiar código PIX");
        });
    } else {
      toast.error("Código PIX não disponível");
    }
  };

  const redirectToOrders = () => {
    console.log("🔄 [PixQrCodeDialog] SISTEMA UNIFICADO - Redirecionando para pedidos");
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      "Redirecionamento para pedidos após PIX",
      { isTestMode, timestamp: new Date().toISOString() }
    );

    // Limpar todos os carrinhos
    clearAllCarts();
    
    toast.success("Redirecionando para seus pedidos...");
    navigate('/anunciante/pedidos');
  };

  const handleClose = () => {
    console.log("❌ [PixQrCodeDialog] Botão fechar clicado");
    redirectToOrders();
  };

  const handlePaymentConfirmed = () => {
    console.log("✅ [PixQrCodeDialog] Pagamento confirmado pelo usuário");
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_EVENT,
      LogLevel.SUCCESS,
      "Usuário confirmou pagamento PIX",
      { isTestMode, timestamp: new Date().toISOString() }
    );
    
    redirectToOrders();
  };

  // Se não há dados do QR Code, mostrar erro com opções
  if (!finalQrCodeBase64 && !finalQrCodeText) {
    console.error("❌ [PixQrCodeDialog] Dados PIX não disponíveis");
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600 flex items-center justify-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao Gerar PIX</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <p className="text-gray-600">
              Não foi possível gerar o QR Code PIX no momento.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                Seu pedido foi criado com sucesso! Você pode acompanhar o status na área de pedidos.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                Tentar Novamente
              </Button>
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                Ver Meus Pedidos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white via-green-50 to-blue-50 border-2 border-green-200 shadow-2xl">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-3 mb-4 pt-2">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 512 512" className="h-8 w-8 text-white" fill="currentColor">
                <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
              </svg>
            </div>
            <div>
              <div className="text-gray-900">QR Code PIX</div>
              <div className="text-sm font-normal text-green-600">
                {isTestMode ? "Modo de Teste" : "Pagamento gerado com sucesso!"}
              </div>
            </div>
          </DialogTitle>
          
          {/* Indicador de modo de teste */}
          {isTestMode && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Modo de Teste - QR Code para demonstração
                </span>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code Display */}
          {finalQrCodeBase64 && (
            <div className="w-full flex justify-center">
              <div className="bg-white p-6 rounded-3xl border-2 border-green-200 shadow-xl">
                <QRCodeDisplay qrCodeBase64={finalQrCodeBase64} />
              </div>
            </div>
          )}
          
          {/* Instruções */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-2xl border border-blue-200 w-full">
            <div className="flex items-center space-x-3 mb-3">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Como pagar:</h3>
            </div>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escaneie o QR Code acima</li>
              <li>Confirme o pagamento</li>
              <li>Clique em "Já Paguei" abaixo</li>
            </ol>
          </div>

          {/* Código PIX para copiar */}
          {finalQrCodeText && (
            <div className="w-full space-y-3">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-2xl border border-blue-200">
                <p className="text-xs text-gray-600 mb-2">Ou copie o código PIX:</p>
                <div className="text-xs text-gray-700 break-all font-mono bg-white p-3 rounded-xl border border-gray-200 shadow-sm max-h-20 overflow-y-auto">
                  {finalQrCodeText}
                </div>
              </div>
              <Button 
                onClick={handleCopyQrCode}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
                size="lg"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copiar Código PIX
              </Button>
            </div>
          )}

          {/* Botão "Já Paguei" */}
          <div className="w-full pt-4 border-t border-green-200">
            <Button
              onClick={handlePaymentConfirmed}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-xl font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl transform hover:scale-105"
              size="lg"
            >
              <CheckCircle className="h-7 w-7 mr-3" />
              Já Paguei
            </Button>
            <p className="text-xs text-gray-600 text-center mt-3 font-medium">
              ✅ Clique aqui após realizar o pagamento
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixQrCodeDialog;
