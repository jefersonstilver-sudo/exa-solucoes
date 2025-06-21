
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { sendPixPaymentWebhook, getUserInfo, PixWebhookData, PixWebhookResponse } from '@/utils/paymentWebhooks';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useOrderManager } from '@/hooks/useOrderManager';
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
  const { createPendingOrder, isCreating } = useOrderManager();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<PixWebhookResponse | null>(null);
  
  const handlePayWithPix = async () => {
    try {
      setIsLoading(true);
      
      console.log("🎯 [PixPaymentButton] FLUXO PIX COMPLETO INICIADO");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Iniciando fluxo PIX completo com criação de pedido",
        { totalPrice, timestamp: new Date().toISOString() }
      );
      
      if (!user) {
        console.error("❌ Usuário não autenticado");
        toast.error("Usuário não autenticado");
        return;
      }

      // Buscar dados do usuário
      console.log("👤 Buscando dados do usuário:", user.id);
      const userInfo = await getUserInfo(user.id);
      
      if (!userInfo) {
        console.error("❌ Erro ao buscar dados do usuário");
        toast.error("Erro ao buscar dados do usuário");
        return;
      }

      // Buscar itens do carrinho
      const cartItemsStr = localStorage.getItem('indexa_unified_cart');
      console.log("🛒 Dados brutos do carrinho:", cartItemsStr);
      
      let cartItems = [];
      try {
        cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : [];
      } catch (parseError) {
        console.error("❌ Erro ao fazer parse do carrinho:", parseError);
        toast.error("Erro ao ler dados do carrinho");
        return;
      }
      
      if (!cartItems || cartItems.length === 0) {
        console.error("❌ Carrinho vazio");
        toast.error("Carrinho vazio");
        return;
      }

      const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');
      const discountedTotal = totalPrice * 0.95; // 5% desconto PIX

      console.log("💰 Valores calculados:", {
        originalPrice: totalPrice,
        discountedTotal,
        selectedPlan
      });

      // PASSO 1: CRIAR PEDIDO PENDENTE
      console.log("🏗️ PASSO 1: Criando pedido pendente...");
      toast.info("Criando seu pedido...", { duration: 2000 });
      
      const orderResult = await createPendingOrder({
        clientId: user.id,
        cartItems,
        selectedPlan,
        totalPrice: discountedTotal,
        couponId: null // TODO: Implementar cupom se necessário
      });

      if (!orderResult.success) {
        throw new Error(`Erro ao criar pedido: ${orderResult.error}`);
      }

      console.log("✅ PASSO 1 COMPLETO: Pedido criado:", {
        pedidoId: orderResult.pedidoId,
        transactionId: orderResult.transactionId
      });

      // PASSO 2: PREPARAR DADOS PARA WEBHOOK N8N
      const formattedPredios = cartItems.map((item: any, index: number) => ({
        id: item.panel?.id || `panel_${index}`,
        nome: item.panel?.buildings?.nome || item.panel?.nome || `Painel ${index + 1}`,
        painel_ids: [item.panel?.id] // IDs específicos dos painéis
      }));

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(now.getMonth() + selectedPlan);

      const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };

      // DADOS COMPLETOS PARA N8N
      const webhookData: PixWebhookData = {
        cliente_id: user.id,
        pedido_id: orderResult.pedidoId!, // 🔥 NOVO: ID do pedido criado
        transaction_id: orderResult.transactionId!, // 🔥 NOVO: ID único para rastreamento
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

      console.log("📡 PASSO 2: Enviando para N8N webhook:", JSON.stringify(webhookData, null, 2));

      // PASSO 3: GERAR PIX VIA N8N
      console.log("💳 PASSO 3: Gerando QR Code PIX...");
      toast.info("Gerando QR Code PIX...", { duration: 2000 });
      
      const response = await sendPixPaymentWebhook(webhookData);
      
      console.log("✅ PASSO 3 COMPLETO: Resposta do N8N:", response);
      
      if (response.success && (response.qrCodeBase64 || response.pix_base64)) {
        // Armazenar dados PIX e abrir popup
        setPixData(response);
        setQrCodeDialogOpen(true);
        
        console.log("🎉 FLUXO PIX COMPLETO: QR Code gerado com sucesso!");
        toast.success("QR Code PIX gerado com sucesso!");
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_EVENT,
          LogLevel.SUCCESS,
          "Fluxo PIX completo executado com sucesso",
          { 
            pedidoId: orderResult.pedidoId,
            transactionId: orderResult.transactionId,
            hasQrCode: !!(response.qrCodeBase64 || response.pix_base64),
            hasUrl: !!(response.qrCodeText || response.pix_url)
          }
        );
      } else {
        throw new Error(response.error || "Erro ao gerar QR Code PIX");
      }
      
    } catch (error: any) {
      console.error("❌ [PixPaymentButton] ERRO NO FLUXO PIX:", error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro no fluxo PIX completo",
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
        disabled={isDisabled || isLoading || externalIsLoading || isCreating}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        {isLoading || externalIsLoading || isCreating ? (
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>
              {isCreating ? "Criando pedido..." : "Gerando QR Code PIX..."}
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

      {/* Popup do QR Code PIX */}
      {pixData && (
        <PixQrCodeDialog
          isOpen={qrCodeDialogOpen}
          onClose={() => {
            console.log("🔄 [PixPaymentButton] Fechando popup PIX e continuando fluxo");
            setQrCodeDialogOpen(false);
            onClick(); // Continuar fluxo original
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
