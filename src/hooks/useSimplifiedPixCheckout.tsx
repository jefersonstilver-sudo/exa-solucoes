
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useCartManager } from '@/hooks/useCartManager';
import { useOrderManager } from '@/hooks/useOrderManager';
import { calculatePixPrice } from '@/utils/priceCalculator';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { supabase } from '@/integrations/supabase/client';
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

  // Função para processar pedidos gratuitos (cupom 100%)
  const processFreeOrder = async (couponId?: string): Promise<PixPaymentResult> => {
    console.log('[useSimplifiedPixCheckout] PROCESSANDO PEDIDO GRATUITO (CUPOM 100%):', {
      userId: user?.id,
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      couponId
    });

    try {
      // Criar pedido diretamente como pago
      const orderResult = await createPendingOrder({
        clientId: user.id,
        cartItems,
        selectedPlan,
        totalPrice: 0.01, // Valor mínimo para evitar problemas no sistema
        couponId
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Erro ao criar pedido gratuito");
      }

      // Atualizar status para pago imediatamente
      await supabase
        .from('pedidos')
        .update({
          status: 'pago',
          log_pagamento: {
            payment_method: 'free_coupon',
            payment_status: 'approved',
            coupon_discount: '100%',
            processed_at: new Date().toISOString(),
            free_order: true
          }
        })
        .eq('id', orderResult.pedidoId);

      // Limpar carrinho
      handleClearCart();
      localStorage.removeItem('selectedPlan');

      // Log do evento
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'FREE_ORDER_COMPLETED',
        descricao: `Pedido gratuito completado: ID=${orderResult.pedidoId}, Cupom 100%`
      });

      return {
        success: true,
        pixData: {
          pedido_id: orderResult.pedidoId,
          transaction_id: orderResult.transactionId,
          qrCodeText: 'PEDIDO_GRATUITO',
          paymentLink: `/success?pedido=${orderResult.pedidoId}`
        }
      };

    } catch (error: any) {
      console.error('[useSimplifiedPixCheckout] ERRO no pedido gratuito:', error);
      return {
        success: false,
        error: `Erro no pedido gratuito: ${error.message}`
      };
    }
  };

  const processPixPayment = async (couponId?: string, couponDiscountPercent: number = 0): Promise<PixPaymentResult> => {
    console.log('[useSimplifiedPixCheckout] INICIANDO PROCESSO PIX COM CORREÇÃO:', {
      userId: user?.id,
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      couponDiscountPercent,
      timestamp: new Date().toISOString()
    });

    if (!user?.id) {
      console.error('[useSimplifiedPixCheckout] Usuário não autenticado');
      toast.error("Usuário não autenticado");
      return { success: false, error: "Usuário não autenticado" };
    }

    if (!selectedPlan) {
      console.error('[useSimplifiedPixCheckout] Plano não selecionado');
      toast.error("Plano não selecionado");
      return { success: false, error: "Plano não selecionado" };
    }

    if (cartItems.length === 0) {
      console.error('[useSimplifiedPixCheckout] Carrinho vazio');
      toast.error("Carrinho vazio");
      return { success: false, error: "Carrinho vazio" };
    }

    setIsProcessing(true);

    try {
      // CORREÇÃO CRÍTICA: Calcular preço usando função corrigida (já multiplica por meses)
      const finalPrice = calculatePixPrice(selectedPlan, cartItems, couponDiscountPercent);
      
      console.log('[useSimplifiedPixCheckout] PREÇO CALCULADO CORRIGIDO COM MESES:', {
        selectedPlan,
        cartItemsCount: cartItems.length,
        finalPrice,
        mesesMultiplicados: `Valor já inclui ${selectedPlan} meses`,
        cartItems: cartItems.map(item => ({
          panelId: item.panel.id,
          buildingName: item.panel?.buildings?.nome,
          precoBaseMensal: item.panel?.buildings?.preco_base
        }))
      });
      
      // NOVA LÓGICA: Se cupom é 100% (valor final <= 0.01), processar como pedido gratuito
      if (finalPrice <= 0.01) {
        console.log('[useSimplifiedPixCheckout] DETECTADO CUPOM 100% - Processando como pedido gratuito');
        toast.info("Cupom de 100% aplicado! Processando pedido gratuito...");
        return await processFreeOrder(couponId);
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

      console.log('[useSimplifiedPixCheckout] Pedido criado:', orderResult);

      // Preparar dados para webhook PIX com valor correto MULTIPLICADO POR MESES
      const predioIds = cartItems
        .map(item => item.panel?.buildings?.id || item.panel?.building_id)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index);

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
        valor_total: String(finalPrice.toFixed(2)), // CORREÇÃO: Valor correto JÁ MULTIPLICADO POR MESES
        periodo_exibicao: {
          inicio: new Date().toISOString(),
          fim: new Date(Date.now() + selectedPlan * 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      console.log('[useSimplifiedPixCheckout] WEBHOOK DATA COM VALOR CORRIGIDO (MESES INCLUSOS):', {
        ...webhookData,
        valorTotalCalculado: `R$ ${finalPrice.toFixed(2)} (já inclui ${selectedPlan} meses)`
      });

      // Enviar para webhook PIX
      const pixResult = await sendPixPaymentWebhook(webhookData);

      console.log('[useSimplifiedPixCheckout] RESULTADO DO WEBHOOK PIX:', {
        success: pixResult.success,
        hasQrCode: !!pixResult.qrCodeBase64 || !!pixResult.pix_base64,
        hasPixUrl: !!pixResult.qrCodeText || !!pixResult.pix_url,
        error: pixResult.error
      });

      if (!pixResult.success) {
        console.error('[useSimplifiedPixCheckout] Webhook falhou:', pixResult.error);
        return {
          success: false,
          error: `Erro no webhook: ${pixResult.error}`
        };
      }

      // Limpar carrinho SOMENTE se tudo der certo
      handleClearCart();
      localStorage.removeItem('selectedPlan');

      // Retornar dados PIX para o componente pai
      const finalPixData = {
        qrCodeBase64: pixResult.qrCodeBase64 || pixResult.pix_base64,
        qrCodeText: pixResult.qrCodeText || pixResult.pix_url,
        pix_base64: pixResult.pix_base64,
        pix_url: pixResult.pix_url,
        paymentLink: pixResult.paymentLink,
        pedido_id: pixResult.pedido_id || orderResult.pedidoId,
        transaction_id: pixResult.transaction_id || orderResult.transactionId
      };

      console.log('[useSimplifiedPixCheckout] DADOS PIX FINAIS:', finalPixData);

      return {
        success: true,
        pixData: finalPixData
      };

    } catch (error: any) {
      console.error('[useSimplifiedPixCheckout] ERRO CAPTURADO:', error);
      const errorMessage = `Erro no pagamento: ${error.message}`;
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
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
    processFreeOrder,
    navigateToPixPayment: (pedidoId: string) => navigate(`/pix-payment?pedido=${pedidoId}`),
    isProcessing,
    canProcess: !!user?.id && !!selectedPlan && cartItems.length > 0
  };
};
