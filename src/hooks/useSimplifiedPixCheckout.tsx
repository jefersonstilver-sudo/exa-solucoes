
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useCartManager } from '@/hooks/useCartManager';
import { useOrderManager } from '@/hooks/useOrderManager';
import { calculatePixPrice } from '@/utils/priceCalculator';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { toast } from 'sonner';

export const useSimplifiedPixCheckout = () => {
  const navigate = useNavigate();
  const { user } = useUserSession();
  const { cartItems, selectedPlan, handleClearCart } = useCartManager();
  const { createPendingOrder } = useOrderManager();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPixPayment = async (couponId?: string, couponDiscountPercent: number = 0) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    if (!selectedPlan) {
      toast.error("Plano não selecionado");
      return false;
    }

    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return false;
    }

    setIsProcessing(true);

    try {
      // Calcular preço final usando calculador centralizado
      const finalPrice = calculatePixPrice(selectedPlan, cartItems, couponDiscountPercent);
      
      if (finalPrice <= 0) {
        throw new Error("Preço calculado inválido");
      }

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

      // Calcular período
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataInicio.getMonth() + selectedPlan);

      const webhookData = {
        cliente_id: user.id,
        pedido_id: orderResult.pedidoId,
        transaction_id: orderResult.transactionId || '',
        email: user.email || '',
        nome: user.email?.split('@')[0] || 'Cliente',
        plano_escolhido: `${selectedPlan} ${selectedPlan === 1 ? 'mês' : 'meses'}`,
        periodo_meses: selectedPlan,
        predios_selecionados: predioIds.map(id => ({ 
          id: String(id),
          nome: cartItems.find(item => 
            (item.panel?.buildings?.id || item.panel?.building_id) === id
          )?.panel?.buildings?.nome || 'Prédio'
        })),
        valor_total: String(finalPrice),
        periodo_exibicao: {
          inicio: dataInicio.toISOString().split('T')[0],
          fim: dataFim.toISOString().split('T')[0]
        }
      };

      // Enviar para webhook PIX
      const pixResult = await sendPixPaymentWebhook(webhookData);

      if (!pixResult.success) {
        throw new Error(pixResult.error || "Erro ao processar PIX");
      }

      // Limpar carrinho
      handleClearCart();
      localStorage.removeItem('selectedPlan');

      // Navegar para página de pagamento PIX
      navigate(`/pix-payment?pedido=${orderResult.pedidoId}`);

      return true;

    } catch (error: any) {
      toast.error(`Erro no pagamento: ${error.message}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPixPayment,
    isProcessing,
    canProcess: !!user?.id && !!selectedPlan && cartItems.length > 0
  };
};
