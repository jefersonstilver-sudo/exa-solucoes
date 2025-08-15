
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { sendPixPaymentWebhook, getUserInfo, PixWebhookData, PixWebhookResponse } from '@/utils/paymentWebhooks';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useUnifiedCheckout } from '@/hooks/useUnifiedCheckout';
import { findCartItems } from '@/utils/cartUtils';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';

interface PixPaymentButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
  totalPrice: number;
}

const PixPaymentButton = ({ 
  onClick, 
  isDisabled, 
  isLoading: externalIsLoading,
  totalPrice 
}: PixPaymentButtonProps) => {
  const { user } = useUserSession();
  const {
    initializeUnifiedCheckout,
    isProcessing,
    currentTransactionId,
    sessionPrice
  } = useUnifiedCheckout();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<PixWebhookResponse | null>(null);
  const [currentPedidoId, setCurrentPedidoId] = useState<string | null>(null);
  
  const handlePayWithPix = async () => {
    try {
      setIsLoading(true);
      
      console.log("🎯 [PixPaymentButton] SISTEMA UNIFICADO - Iniciando fluxo PIX");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Iniciando fluxo PIX com useUnifiedCheckout",
        { totalPrice, timestamp: new Date().toISOString() }
      );
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // PASSO 1: Buscar carrinho
      console.log("🛒 [PixPaymentButton] Buscando carrinho");
      const cartResult = findCartItems();
      
      if (!cartResult.success || cartResult.cartItems.length === 0) {
        console.error("❌ [PixPaymentButton] Carrinho vazio");
        throw new Error("Carrinho vazio. Adicione painéis antes de prosseguir.");
      }

      const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');

      // PASSO 2: Inicializar checkout unificado (cria tentativa + pedido com source_tentativa_id)
      console.log("🚀 [PixPaymentButton] Inicializando checkout unificado");
      toast.info("Processando pedido...", { duration: 2000 });
      
      const checkoutResult = await initializeUnifiedCheckout();

      if (!checkoutResult.success || !checkoutResult.pedidoId) {
        throw new Error("Erro no checkout unificado ou pedido não criado");
      }

      // Armazenar o pedidoId retornado
      setCurrentPedidoId(checkoutResult.pedidoId);

      console.log("✅ [PixPaymentButton] Checkout inicializado:", {
        transactionId: checkoutResult.transactionId,
        pedidoId: checkoutResult.pedidoId,
        sessionPrice: checkoutResult.price
      });

      // PASSO 3: Buscar dados do usuário
      console.log("👤 [PixPaymentButton] Buscando dados do usuário");
      const userInfo = await getUserInfo(user.id);
      
      if (!userInfo) {
        throw new Error("Erro ao buscar dados do usuário");
      }

      // PASSO 4: Preparar dados para webhook N8N
      const discountedTotal = (checkoutResult.price || totalPrice) * 0.95; // 5% desconto PIX
      
      const formattedPredios = cartResult.cartItems.map((item: any, index: number) => ({
        id: item.panel?.id || item.id || `panel_${index}`,
        nome: item.panel?.buildings?.nome || `Painel ${index + 1}`,
        painel_ids: [item.panel?.id || item.id]
      }));

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(now.getMonth() + selectedPlan);

      const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };

      // USAR O PEDIDO_ID CORRETO retornado pelo checkout unificado
      const pedidoId = checkoutResult.pedidoId;
      
      const webhookData: PixWebhookData = {
        cliente_id: user.id,
        pedido_id: pedidoId,
        transaction_id: checkoutResult.transactionId!,
        email: userInfo.email,
        nome: userInfo.nome,
        plano_escolhido: `${selectedPlan} ${selectedPlan === 1 ? 'mês' : 'meses'}`,
        periodo_meses: selectedPlan,
        predios_selecionados: formattedPredios,
        valor_total: discountedTotal.toFixed(2),
        periodo_exibicao: {
          inicio: formatDate(now),
          fim: formatDate(endDate)
        }
      };

      // PASSO 5: Gerar PIX via N8N
      console.log("💳 [PixPaymentButton] Gerando QR Code PIX via N8N");
      toast.info("Gerando QR Code PIX...", { duration: 2000 });
      
      const response = await sendPixPaymentWebhook(webhookData);
      
      console.log("📡 [PixPaymentButton] Resposta do N8N:", response);
      
      if (response.success && (response.qrCodeBase64 || response.pix_base64)) {
        // QR Code gerado com sucesso
        setPixData(response);
        setQrCodeDialogOpen(true);
        
        console.log("🎉 [PixPaymentButton] QR Code gerado com sucesso!");
        toast.success("QR Code PIX gerado com sucesso!");
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_EVENT,
          LogLevel.SUCCESS,
          "Fluxo PIX unificado executado com sucesso - source_tentativa_id preenchido",
          { 
            transactionId: checkoutResult.transactionId,
            pedidoId: checkoutResult.pedidoId,
            hasQrCode: !!(response.qrCodeBase64 || response.pix_base64),
            cartSource: cartResult.usedKey,
            sourceTentativaLinked: true
          }
        );
      } else {
        // Fallback com dados de teste se N8N falhar
        console.warn("⚠️ [PixPaymentButton] N8N não retornou QR Code, usando fallback");
        
        const fallbackData: PixWebhookResponse = {
          success: true,
          qrCodeBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          qrCodeText: "00020126830014BR.GOV.BCB.PIX2561qrcode-pix.mercadopago.com/instore/o/v2/teste",
          message: "QR Code de teste gerado"
        };
        
        setPixData(fallbackData);
        setQrCodeDialogOpen(true);
        
        toast.warning("QR Code de teste gerado (N8N indisponível)");
      }
      
    } catch (error: any) {
      console.error("❌ [PixPaymentButton] Erro no fluxo PIX:", error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro no fluxo PIX unificado",
        { error: error.message, stack: error.stack }
      );
      
      toast.error(`Erro ao processar pagamento PIX: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button
        onClick={handlePayWithPix}
        disabled={isDisabled || isLoading || externalIsLoading || isProcessing}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        {isLoading || externalIsLoading || isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>
              {isProcessing ? "Processando checkout..." : "Gerando QR Code PIX..."}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>💳 Pagar com PIX</span>
            <span className="bg-emerald-600 px-2 py-1 rounded text-sm">
              R$ {(totalPrice * 0.95).toFixed(2)}
            </span>
            <span className="text-emerald-200 text-sm">(5% desconto)</span>
          </div>
        )}
      </Button>

      {/* Popup do QR Code PIX com fallback */}
      {pixData && (
        <PixQrCodeDialog
          isOpen={qrCodeDialogOpen}
          onClose={() => {
            console.log("🔄 [PixPaymentButton] Fechando popup PIX");
            setQrCodeDialogOpen(false);
            onClick();
          }}
          qrCodeBase64={pixData.qrCodeBase64}
          qrCodeText={pixData.qrCodeText}
          paymentLink={pixData.paymentLink}
          pix_url={pixData.pix_url}
          pix_base64={pixData.pix_base64}
        />
      )}
    </>
  );
};

export default PixPaymentButton;
