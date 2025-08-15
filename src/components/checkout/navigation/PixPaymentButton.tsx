
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { sendPixPaymentWebhook, getUserInfo, PixWebhookData, PixWebhookResponse } from '@/utils/paymentWebhooks';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useOrderManager } from '@/hooks/useOrderManager';
import { useTentativaManager } from '@/hooks/useTentativaManager';
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
  const { createTentativa, isCreating: isCreatingTentativa } = useTentativaManager();
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
          buildingName: item.panel?.buildings?.nome || 'Nome não disponível', // CORRIGIDO
          price: item.price
        }))
      });

      const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');
      const discountedTotal = totalPrice * 0.95; // 5% desconto PIX

      // PASSO 3: Criar tentativa de compra
      console.log("📝 [PixPaymentButton] Criando tentativa de compra");
      toast.info("Registrando tentativa...", { duration: 1500 });
      
      const tentativaResult = await createTentativa({
        userId: user.id,
        cartItems: cartResult.cartItems,
        selectedPlan,
        valorTotal: discountedTotal
      });

      if (!tentativaResult.success) {
        throw new Error(`Erro ao criar tentativa: ${tentativaResult.error}`);
      }

      console.log("✅ [PixPaymentButton] Tentativa criada:", tentativaResult.tentativaId);

      // PASSO 4: Criar pedido pendente com referência à tentativa
      console.log("🏗️ [PixPaymentButton] Criando pedido pendente");
      toast.info("Criando seu pedido...", { duration: 2000 });
      
      const orderResult = await createPendingOrder({
        clientId: user.id,
        cartItems: cartResult.cartItems,
        selectedPlan,
        totalPrice: discountedTotal,
        couponId: null,
        tentativaId: tentativaResult.tentativaId
      });

      if (!orderResult.success) {
        throw new Error(`Erro ao criar pedido: ${orderResult.error}`);
      }

      console.log("✅ [PixPaymentButton] Pedido criado:", {
        pedidoId: orderResult.pedidoId,
        transactionId: orderResult.transactionId
      });

      // PASSO 5: Preparar dados para webhook N8N
      const formattedPredios = cartResult.cartItems.map((item: any, index: number) => ({
        id: item.panel?.id || item.id || `panel_${index}`,
        nome: item.panel?.buildings?.nome || `Painel ${index + 1}`, // CORRIGIDO
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

      // PASSO 6: Gerar PIX via N8N
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
          "Fluxo PIX unificado executado com sucesso",
          { 
            pedidoId: orderResult.pedidoId,
            transactionId: orderResult.transactionId,
            hasQrCode: !!(response.qrCodeBase64 || response.pix_base64),
            cartSource: cartResult.usedKey
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
        disabled={isDisabled || isLoading || externalIsLoading || isCreating || isCreatingTentativa}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        {isLoading || externalIsLoading || isCreating || isCreatingTentativa ? (
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>
              {isCreatingTentativa ? "Registrando tentativa..." : 
               isCreating ? "Criando pedido..." : "Gerando QR Code PIX..."}
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
