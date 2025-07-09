
import { useState } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { sendCardWebhookData } from '@/services/cardWebhookService';
import { toast } from 'sonner';

export const useCardCheckout = () => {
  const { user } = useUserSession();
  const { cartItems, selectedPlan } = useCheckout();
  const [isProcessing, setIsProcessing] = useState(false);

  const processCardPayment = async (couponDiscount: number = 0) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Carrinho vazio');
    }

    if (!selectedPlan) {
      throw new Error('Plano não selecionado');
    }

    setIsProcessing(true);

    try {
      // Calcular preços (cartão SEM desconto PIX)
      const subtotal = cartItems.reduce((total, item) => {
        return total + (item.panel.buildings?.preco_base || 0);
      }, 0);

      const planMultiplier = selectedPlan;
      const baseTotal = subtotal * planMultiplier;
      
      // Aplicar desconto de cupom se houver, mas NÃO o desconto PIX
      const totalWithCouponDiscount = couponDiscount > 0 ? baseTotal * (1 - couponDiscount / 100) : baseTotal;

      // Preparar dados do período
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + selectedPlan);

      // Preparar dados dos prédios selecionados
      const prediosSelecionados = cartItems.map(item => ({
        id: item.panel.buildings?.id || item.panel.id,
        nome: item.panel.buildings?.nome || 'Prédio não identificado',
        painel_ids: [item.panel.id]
      }));

      const webhookData = {
        cliente_id: user.id,
        pedido_id: `card_${Date.now()}_${user.id}`,
        email: user.email || 'email@naoidentificado.com',
        nome: user.nome || user.name || user.email?.split('@')[0] || 'Cliente',
        plano_escolhido: `${selectedPlan} ${selectedPlan === 1 ? 'mês' : 'meses'}`,
        periodo_meses: selectedPlan,
        predios_selecionados: prediosSelecionados,
        valor_total: totalWithCouponDiscount.toFixed(2),
        periodo_exibicao: {
          inicio: startDate.toISOString().split('T')[0],
          fim: endDate.toISOString().split('T')[0]
        }
      };

      console.log('💳 [CardCheckout] Enviando dados para webhook:', webhookData);

      const result = await sendCardWebhookData(webhookData);

      if (!result.success) {
        throw new Error(result.error || 'Falha ao processar pagamento com cartão');
      }

      // Se recebeu init_point, redirecionar
      if (result.init_point) {
        console.log('💳 [CardCheckout] Redirecionando para:', result.init_point);
        window.location.href = result.init_point;
        return {
          success: true,
          redirected: true,
          init_point: result.init_point
        };
      }

      // Se recebeu preference_id mas não init_point
      if (result.preference_id) {
        const mercadoPagoUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${result.preference_id}`;
        console.log('💳 [CardCheckout] Redirecionando para MercadoPago:', mercadoPagoUrl);
        window.location.href = mercadoPagoUrl;
        return {
          success: true,
          redirected: true,
          preference_id: result.preference_id
        };
      }

      return {
        success: true,
        message: result.message || 'Pagamento processado com sucesso'
      };

    } catch (error: any) {
      console.error('💳 [CardCheckout] Erro no processamento:', error);
      toast.error(`Erro no pagamento: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processCardPayment,
    isProcessing
  };
};
