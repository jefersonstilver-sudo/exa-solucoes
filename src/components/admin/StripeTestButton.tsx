import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TestTube } from 'lucide-react';

export const StripeTestButton = () => {
  const testStripeFlow = async () => {
    console.log('🧪 [STRIPE_TEST] Iniciando teste do fluxo Stripe...');
    
    toast.loading('🧪 Iniciando teste...', { id: 'stripe-test' });
    
    try {
      // 1. Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar logado para testar', { id: 'stripe-test' });
        return;
      }
      
      console.log('✅ [STRIPE_TEST] Usuário autenticado:', user.id);
      
      // 2. Buscar painel válido
      const { data: panels, error: panelError } = await supabase
        .from('painels')
        .select('id, building_id')
        .limit(1);
      
      if (panelError || !panels || panels.length === 0) {
        toast.error('Nenhum painel disponível para teste', { id: 'stripe-test' });
        console.error('❌ [STRIPE_TEST] Erro ao buscar painéis:', panelError);
        return;
      }
      
      console.log('✅ [STRIPE_TEST] Painel válido encontrado:', panels[0].id);
      
      // 3. Criar pedido de teste
      const testOrderData = {
        client_id: user.id,
        lista_paineis: [panels[0].id],
        lista_predios: panels[0].building_id ? [panels[0].building_id] : [],
        valor_total: 10.00, // R$ 10 - acima do mínimo para ambos métodos
        status: 'pendente',
        metodo_pagamento: 'pix'
      };
      
      const { data: order, error: orderError } = await supabase
        .from('pedidos')
        .insert(testOrderData)
        .select()
        .single();
      
      if (orderError || !order) {
        toast.error('Erro ao criar pedido de teste: ' + (orderError?.message || 'Desconhecido'), { id: 'stripe-test' });
        console.error('❌ [STRIPE_TEST] Erro ao criar pedido:', orderError);
        return;
      }
      
      console.log('✅ [STRIPE_TEST] Pedido criado:', order.id);
      
      // 4. Testar edge function
      toast.loading('🔄 Chamando Stripe Checkout...', { id: 'stripe-test' });
      
      const { data: checkoutData, error: functionError } = await supabase.functions.invoke(
        'stripe-create-checkout',
        { body: { pedidoId: order.id } }
      );
      
      if (functionError) {
        toast.error('Erro na edge function: ' + functionError.message, { id: 'stripe-test' });
        console.error('❌ [STRIPE_TEST] Erro na edge function:', functionError);
        return;
      }
      
      if (checkoutData?.url) {
        toast.success('✅ Teste completo! Redirecionando para Stripe...', { id: 'stripe-test' });
        console.log('✅ [STRIPE_TEST] URL do Stripe recebida:', checkoutData.url);
        
        // Abrir em nova aba
        setTimeout(() => {
          window.open(checkoutData.url, '_blank');
        }, 1000);
      } else {
        toast.error('Nenhuma URL retornada pelo Stripe', { id: 'stripe-test' });
        console.error('❌ [STRIPE_TEST] Resposta sem URL:', checkoutData);
      }
    } catch (error: any) {
      toast.error('Erro no teste: ' + error.message, { id: 'stripe-test' });
      console.error('❌ [STRIPE_TEST] Erro geral:', error);
    }
  };
  
  return (
    <Button 
      onClick={testStripeFlow} 
      variant="outline"
      className="gap-2"
    >
      <TestTube className="w-4 h-4" />
      Testar Fluxo Stripe
    </Button>
  );
};
