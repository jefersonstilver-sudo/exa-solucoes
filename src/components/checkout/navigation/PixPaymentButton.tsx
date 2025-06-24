
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { sendPixPaymentWebhook, getUserInfo, PixWebhookData, PixWebhookResponse } from '@/utils/paymentWebhooks';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useOrderManager } from '@/hooks/useOrderManager';
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
  const { createPendingOrder, isCreating } = useOrderManager();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<PixWebhookResponse | null>(null);
  
  const handlePayWithPix = async () => {
    try {
      setIsLoading(true);
      
      console.log("🎯 [PixPaymentButton] SISTEMA UNIFICADO - Iniciando fluxo PIX");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Iniciando fluxo PIX unificado",
        { totalPrice, timestamp: new Date().toISOString() }
      );
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // PASSO 1: Buscar dados do usuário
      console.log("👤 [PixPaymentButton] Buscando dados do usuário:", user.id);
      const userInfo = await getUserInfo(user.id);
      
      if (!userInfo) {
        throw new Error("Erro ao buscar dados do usuário");
      }

      // PASSO 2: Buscar carrinho usando sistema unificado
      console.log("🛒 [PixPaymentButton] Buscando carrinho com sistema unificado");
      const cartResult = findCartItems();
      
      if (!cartResult.success || cartResult.cartItems.length === 0) {
        console.error("❌ [PixPaymentButton] Carrinho vazio - Debug:", {
          success: cartResult.success,
          itemCount: cartResult.cartItems.length,
          usedKey: cartResult.usedKey,
          allLocalStorageKeys: Object.keys(localStorage)
        });
        throw new Error("Carrinho vazio. Adicione painéis antes de prosseguir.");
      }

      console.log("✅ [PixPaymentButton] Carrinho encontrado:", {
        source: cartResult.usedKey,
        itemCount: cartResult.cartItems.length,
        items: cartResult.cartItems.map(item => ({
          id: item.id || item.panel?.id,
          panelId: item.panel?.id,
          buildingName: item.panel?.buildings?.nome || 'Nome não disponível',
          price: item.price
        }))
      });

      const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');
      const discountedTotal = totalPrice * 0.95; // 5% desconto PIX

      // PASSO 3: Criar pedido pendente
      console.log("🏗️ [PixPaymentButton] Criando pedido pendente");
      toast.info("Criando seu pedido...", { duration: 2000 });
      
      const orderResult = await createPendingOrder({
        clientId: user.id,
        cartItems: cartResult.cartItems,
        selectedPlan,
        totalPrice: discountedTotal,
        couponId: null
      });

      if (!orderResult.success) {
        throw new Error(`Erro ao criar pedido: ${orderResult.error}`);
      }

      console.log("✅ [PixPaymentButton] Pedido criado:", {
        pedidoId: orderResult.pedidoId,
        transactionId: orderResult.transactionId
      });

      // PASSO 4: Preparar dados para webhook N8N
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

      const webhookData: PixWebhookData = {
        cliente_id: user.id,
        pedido_id: orderResult.pedidoId!,
        transaction_id: orderResult.transactionId!,
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
      
      console.log("📡 [PixPaymentButton] CORREÇÃO - Resposta completa do N8N:", {
        success: response.success,
        hasQrCodeBase64: !!response.qrCodeBase64,
        hasQrCodeText: !!response.qrCodeText,
        hasPixBase64: !!response.pix_base64,
        hasPixUrl: !!response.pix_url,
        allFields: Object.keys(response)
      });
      
      // CORREÇÃO: Verificar os campos corretos após mapeamento
      const hasValidPixData = response.success && (
        response.qrCodeBase64 || // Campo mapeado
        response.qrCodeText ||   // Campo mapeado
        response.pix_base64 ||   // Campo original
        response.pix_url         // Campo original
      );
      
      if (hasValidPixData) {
        // QR Code gerado com sucesso
        setPixData(response);
        setQrCodeDialogOpen(true);
        
        console.log("🎉 [PixPaymentButton] QR Code PIX gerado com sucesso!", {
          qrCodeBase64Available: !!response.qrCodeBase64,
          qrCodeTextAvailable: !!response.qrCodeText,
          pixBase64Available: !!response.pix_base64,
          pixUrlAvailable: !!response.pix_url
        });
        
        toast.success("QR Code PIX gerado com sucesso!");
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_EVENT,
          LogLevel.SUCCESS,
          "Fluxo PIX unificado executado com sucesso",
          { 
            pedidoId: orderResult.pedidoId,
            transactionId: orderResult.transactionId,
            hasQrCode: hasValidPixData,
            cartSource: cartResult.usedKey
          }
        );
      } else {
        // Log detalhado do erro
        console.error("❌ [PixPaymentButton] N8N não retornou dados PIX válidos:", {
          responseSuccess: response.success,
          responseError: response.error,
          availableFields: Object.keys(response),
          qrCodeBase64: !!response.qrCodeBase64,
          qrCodeText: !!response.qrCodeText,
          pix_base64: !!response.pix_base64,
          pix_url: !!response.pix_url
        });
        
        throw new Error(response.error || "N8N não retornou dados PIX válidos");
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
