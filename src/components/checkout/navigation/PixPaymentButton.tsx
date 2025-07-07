
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
      
      console.log("🎯 [PixPaymentButton] ✅ CORREÇÃO DEFINITIVA IMPLEMENTADA - Iniciando fluxo PIX");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "CORREÇÃO DEFINITIVA: Iniciando processamento PIX",
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

      // PASSO 2: Buscar carrinho
      console.log("🛒 [PixPaymentButton] Buscando carrinho");
      const cartResult = findCartItems();
      
      if (!cartResult.success || cartResult.cartItems.length === 0) {
        console.error("❌ [PixPaymentButton] Carrinho vazio");
        throw new Error("Carrinho vazio. Adicione painéis antes de prosseguir.");
      }

      console.log("✅ [PixPaymentButton] Carrinho encontrado:", {
        source: cartResult.usedKey,
        itemCount: cartResult.cartItems.length
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

      console.log("✅ [PixPaymentButton] Pedido criado com sucesso:", {
        pedidoId: orderResult.pedidoId,
        transactionId: orderResult.transactionId
      });

      // PASSO 4: Preparar dados para webhook
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

      // PASSO 5: CORREÇÃO DEFINITIVA - Processar webhook PIX
      console.log("💳 [PixPaymentButton] 🚀 CORREÇÃO DEFINITIVA - Enviando webhook PIX");
      toast.info("Processando pagamento PIX...", { duration: 2000 });
      
      const response = await sendPixPaymentWebhook(webhookData);
      
      console.log("📡 [PixPaymentButton] 🎯 RESPOSTA WEBHOOK RECEBIDA:", JSON.stringify(response, null, 2));
      
      if (!response.success) {
        throw new Error(response.error || "Falha ao processar pagamento PIX");
      }

      // CORREÇÃO DEFINITIVA: PRIORIDADE ABSOLUTA PARA INIT_POINT
      if (response.init_point) {
        console.log("🚀 [PixPaymentButton] ✅ CORREÇÃO DEFINITIVA - INIT_POINT DETECTADO:", response.init_point);
        console.log("🔗 [PixPaymentButton] 🎯 EXECUTANDO REDIRECIONAMENTO IMEDIATO AGORA!");
        
        toast.success("Redirecionando para MercadoPago...", { duration: 1000 });
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_EVENT,
          LogLevel.SUCCESS,
          "CORREÇÃO DEFINITIVA: Redirecionamento PIX executado com sucesso",
          { 
            pedidoId: orderResult.pedidoId,
            transactionId: orderResult.transactionId,
            init_point: response.init_point,
            correcaoDefinitiva: true
          }
        );
        
        // REDIRECIONAMENTO IMEDIATO - SAIR IMEDIATAMENTE
        console.log("⚡ [PixPaymentButton] REDIRECIONAMENTO EXECUTADO - SAINDO DA FUNÇÃO");
        setTimeout(() => {
          window.location.href = response.init_point!;
        }, 500);
        
        return; // SAIR IMEDIATAMENTE - NÃO EXECUTAR MAIS NADA
      }
      
      // FALLBACK: Apenas para casos onde realmente não há init_point
      console.log("📱 [PixPaymentButton] ⚠️ FALLBACK - Sem init_point, verificando dados PIX");
      
      const hasPixData = !!(
        response.qrCodeBase64 || 
        response.pix_base64 || 
        response.qrCodeText || 
        response.pix_url
      );
      
      if (hasPixData) {
        console.log("✅ [PixPaymentButton] Dados PIX encontrados, mostrando QR Code");
        
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
            hasQrCode: true
          }
        );
      } else {
        // ERRO REAL: Nem init_point nem dados PIX
        console.error("❌ [PixPaymentButton] ERRO: Webhook não retornou dados válidos");
        throw new Error("Webhook não retornou método de pagamento válido");
      }
      
    } catch (error: any) {
      console.error("❌ [PixPaymentButton] ERRO CAPTURADO:", error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro no processamento PIX",
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

      {/* Popup do QR Code PIX - APENAS para fallback quando NÃO há init_point */}
      {pixData && qrCodeDialogOpen && !pixData.init_point && (
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
