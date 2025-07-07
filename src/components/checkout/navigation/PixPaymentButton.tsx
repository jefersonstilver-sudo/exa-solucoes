
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
      
      console.log("🎯 [PixPaymentButton] REDIRECIONAMENTO IMEDIATO - Iniciando fluxo PIX");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Iniciando fluxo PIX com redirecionamento direto",
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

      // PASSO 5: Gerar PIX via N8N - PRIORIDADE PARA REDIRECIONAMENTO
      console.log("💳 [PixPaymentButton] Gerando pagamento PIX via N8N - PRIORIDADE REDIRECIONAMENTO");
      toast.info("Processando pagamento PIX...", { duration: 2000 });
      
      const response = await sendPixPaymentWebhook(webhookData);
      
      console.log("📡 [PixPaymentButton] Resposta do N8N:", response);
      
      if (response.success) {
        // PRIORIDADE ABSOLUTA: Redirecionar para init_point se disponível
        if (response.init_point) {
          console.log("🚀 [PixPaymentButton] REDIRECIONAMENTO IMEDIATO - INIT_POINT ENCONTRADO:", response.init_point);
          
          toast.success("Redirecionando para pagamento MercadoPago...", { duration: 2000 });
          
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_EVENT,
            LogLevel.SUCCESS,
            "Redirecionamento imediato para init_point executado",
            { 
              pedidoId: orderResult.pedidoId,
              transactionId: orderResult.transactionId,
              init_point: response.init_point,
              cartSource: cartResult.usedKey
            }
          );
          
          // REDIRECIONAMENTO IMEDIATO - NÃO ABRIR POPUP
          setTimeout(() => {
            console.log("🔗 [PixPaymentButton] EXECUTANDO REDIRECIONAMENTO PARA:", response.init_point);
            window.location.href = response.init_point!;
          }, 1000);
          
          return; // IMPORTANTE: Sair da função aqui para não abrir popup
        }
        
        // FALLBACK: QR Code apenas se init_point não estiver disponível
        const hasPixData = !!(
          response.qrCodeBase64 || 
          response.pix_base64 || 
          response.qrCodeText || 
          response.pix_url
        );
        
        if (hasPixData) {
          console.log("📱 [PixPaymentButton] Init_point não disponível, usando QR Code como fallback");
          
          setPixData(response);
          setQrCodeDialogOpen(true);
          
          toast.success("QR Code PIX gerado com sucesso!");
          
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_EVENT,
            LogLevel.SUCCESS,
            "QR Code PIX gerado como fallback",
            { 
              pedidoId: orderResult.pedidoId,
              transactionId: orderResult.transactionId,
              hasQrCode: true,
              cartSource: cartResult.usedKey
            }
          );
        } else {
          // Se não tem init_point nem dados PIX, erro real
          throw new Error("Nenhum método de pagamento disponível na resposta do webhook");
        }
      } else {
        throw new Error(response.error || "Falha ao processar pagamento PIX");
      }
      
    } catch (error: any) {
      console.error("❌ [PixPaymentButton] Erro no fluxo PIX:", error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro no fluxo PIX com redirecionamento",
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
              {isCreating ? "Criando pedido..." : "Processando pagamento..."}
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

      {/* Popup do QR Code PIX - APENAS para fallback quando não há init_point */}
      {pixData && qrCodeDialogOpen && (
        <PixQrCodeDialog
          isOpen={qrCodeDialogOpen}
          onClose={() => {
            console.log("🔄 [PixPaymentButton] Fechando popup PIX fallback");
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
