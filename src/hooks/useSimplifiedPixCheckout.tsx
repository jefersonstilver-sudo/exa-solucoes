
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useCartManager } from '@/hooks/useCartManager';
import { useOrderManager } from '@/hooks/useOrderManager';
import { useTentativaManager } from '@/hooks/useTentativaManager';
import { calculatePixPrice, MINIMUM_ORDER_VALUE } from '@/utils/priceCalculator';
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
  const { createTentativa } = useTentativaManager();
  const [isProcessing, setIsProcessing] = useState(false);

  // REMOVIDO: Não existem mais pedidos gratuitos - todos geram PIX

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
      
      // TODOS OS PEDIDOS geram PIX - mesmo cupom 100% paga R$ 0,05
      console.log('[useSimplifiedPixCheckout] Valor final após descontos:', finalPrice);

      // 🔥 CRIAR TENTATIVA PRIMEIRO COM VALIDAÇÕES
      const prediosSelecionados = cartItems
        .map(item => item.panel?.buildings?.id || item.panel?.building_id)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index);

      console.log('[useSimplifiedPixCheckout] VALIDAÇÃO DOS PRÉDIOS:', {
        totalCartItems: cartItems.length,
        prediosEncontrados: prediosSelecionados.length,
        prediosList: prediosSelecionados,
        cartItemsDebug: cartItems.map(item => ({
          panelId: item.panel?.id,
          buildingId: item.panel?.buildings?.id || item.panel?.building_id,
          buildingName: item.panel?.buildings?.nome
        }))
      });

      if (prediosSelecionados.length === 0) {
        throw new Error('Nenhum prédio válido encontrado no carrinho. Verifique os itens selecionados.');
      }

      const tentativaResult = await createTentativa({
        userId: user.id,
        prediosSelecionados,
        cartItems,
        selectedPlan,
        valorTotal: finalPrice
      });

      if (!tentativaResult.success) {
        throw new Error(tentativaResult.error || 'Erro ao criar tentativa');
      }

      console.log('[useSimplifiedPixCheckout] Criando pedido vinculado à tentativa:', {
        clientId: user.id,
        cartItemsCount: cartItems.length,
        selectedPlan,
        finalPrice,
        tentativaId: tentativaResult.tentativaId
      });

      // Criar pedido pendente vinculado à tentativa
      const orderResult = await createPendingOrder({
        clientId: user.id,
        cartItems,
        selectedPlan,
        totalPrice: finalPrice,
        couponId,
        tentativaId: tentativaResult.tentativaId // 🔥 VINCULAR TENTATIVA
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
    navigateToPixPayment: (pedidoId: string) => navigate(`/pix-payment?pedido=${pedidoId}`),
    isProcessing,
    canProcess: !!user?.id && !!selectedPlan && cartItems.length > 0
  };
};
