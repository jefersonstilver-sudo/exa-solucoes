
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useCartManager } from '@/hooks/useCartManager';
import { useOrderManager } from '@/hooks/useOrderManager';
import { calculatePixPrice } from '@/utils/priceCalculator';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { toast } from 'sonner';

interface PixPaymentResult {
  success: boolean;
  pixData?: {
    qrCodeBase64?: string;
    qrCodeText?: string;
    pix_base64?: string;
    pix_url?: string;
    paymentLink?: string;
    pedido_id?: string;
    transaction_id?: string;
  };
  error?: string;
}

export const useSimplifiedPixCheckout = () => {
  const navigate = useNavigate();
  const { user } = useUserSession();
  const { cartItems, selectedPlan, handleClearCart } = useCartManager();
  const { createPendingOrder } = useOrderManager();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPixPayment = async (couponId?: string, couponDiscountPercent: number = 0): Promise<PixPaymentResult> => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return { success: false, error: "Usuário não autenticado" };
    }

    if (!selectedPlan) {
      toast.error("Plano não selecionado");
      return { success: false, error: "Plano não selecionado" };
    }

    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return { success: false, error: "Carrinho vazio" };
    }

    setIsProcessing(true);

    try {
      // Calcular preço final usando calculador centralizado
      const finalPrice = calculatePixPrice(selectedPlan, cartItems, couponDiscountPercent);
      
      if (finalPrice <= 0) {
        throw new Error("Preço calculado inválido");
      }

      console.log('[useSimplifiedPixCheckout] Criando pedido:', {
        clientId: user.id,
        cartItemsCount: cartItems.length,
        selectedPlan,
        finalPrice
      });

      // Criar pedido pendente
      const orderResult = await createPendingOrder({
        clientId: user.id,
        cartItems,
        selectedPlan,
        totalPrice: finalPrice,
        couponId
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Erro ao criar pedido");
      }

      // Preparar dados para webhook PIX
      const predioIds = cartItems
        .map(item => item.panel?.buildings?.id || item.panel?.building_id)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index);

      // CORREÇÃO: Mapear corretamente para PixWebhookData com todas propriedades obrigatórias
      const webhookData = {
        cliente_id: user.id,
        pedido_id: orderResult.pedidoId,
        transaction_id: orderResult.transactionId || '',
        email: user.email || '',
        nome: user.email || 'Usuário',
        plano_escolhido: `Plano ${selectedPlan} ${selectedPlan === 1 ? 'mês' : 'meses'}`,
        periodo_meses: selectedPlan,
        predios_selecionados: predioIds.map(id => ({ 
          id: String(id), 
          nome: cartItems.find(item => 
            item.panel?.buildings?.id === id || item.panel?.building_id === id
          )?.panel?.buildings?.nome || 'Prédio'
        })),
        valor_total: String(finalPrice),
        periodo_exibicao: {
          inicio: new Date().toISOString(),
          fim: new Date(Date.now() + selectedPlan * 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      console.log('[useSimplifiedPixCheckout] Enviando para webhook PIX:', webhookData);

      // Enviar para webhook PIX
      const pixResult = await sendPixPaymentWebhook(webhookData);

      if (!pixResult.success) {
        throw new Error(pixResult.error || "Erro ao processar PIX");
      }

      console.log('[useSimplifiedPixCheckout] Webhook PIX respondeu:', pixResult);

      // Limpar carrinho
      handleClearCart();
      localStorage.removeItem('selectedPlan');

      // Retornar dados PIX para o componente pai
      return {
        success: true,
        pixData: {
          qrCodeBase64: pixResult.qrCodeBase64 || pixResult.pix_base64,
          qrCodeText: pixResult.qrCodeText || pixResult.pix_url,
          pix_base64: pixResult.pix_base64,
          pix_url: pixResult.pix_url,
          paymentLink: pixResult.paymentLink,
          pedido_id: pixResult.pedido_id || orderResult.pedidoId,
          transaction_id: pixResult.transaction_id || orderResult.transactionId
        }
      };

    } catch (error: any) {
      console.error('[useSimplifiedPixCheckout] Erro no pagamento:', error);
      const errorMessage = `Erro no pagamento: ${error.message}`;
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  };

  // Função de fallback para navegar para página PIX (caso necessário)
  const navigateToPixPayment = (pedidoId: string) => {
    navigate(`/pix-payment?pedido=${pedidoId}`);
  };

  return {
    processPixPayment,
    navigateToPixPayment,
    isProcessing,
    canProcess: !!user?.id && !!selectedPlan && cartItems.length > 0
  };
};
