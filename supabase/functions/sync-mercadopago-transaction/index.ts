import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { paymentId, externalReference } = await req.json();

    if (!paymentId) {
      throw new Error('Payment ID é obrigatório');
    }

    console.log('🔄 [SYNC] Sincronizando transaction_id do MercadoPago:', {
      paymentId,
      externalReference
    });

    // 1. Encontrar o pedido pelo external_reference (UUID do pedido)
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', externalReference)
      .single();

    if (pedidoError || !pedido) {
      throw new Error(`Pedido não encontrado: ${externalReference}`);
    }

    // 2. Atualizar o mercadopago_transaction_id no pedido
    const { error: updatePedidoError } = await supabase
      .from('pedidos')
      .update({
        mercadopago_transaction_id: paymentId.toString()
      })
      .eq('id', pedido.id);

    if (updatePedidoError) {
      throw new Error(`Erro ao atualizar pedido: ${updatePedidoError.message}`);
    }

    // 3. Tentar encontrar e atualizar a tentativa correspondente
    const { data: tentativas, error: tentativasError } = await supabase
      .from('tentativas_compra')
      .select('*')
      .eq('id_user', pedido.client_id)
      .eq('valor_total', pedido.valor_total)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!tentativasError && tentativas && tentativas.length > 0) {
      // Atualizar a tentativa mais recente correspondente
      const tentativaParaAtualizar = tentativas[0];
      
      const { error: updateTentativaError } = await supabase
        .from('tentativas_compra')
        .update({
          transaction_id: paymentId.toString()
        })
        .eq('id', tentativaParaAtualizar.id);

      if (updateTentativaError) {
        console.error('Erro ao atualizar tentativa:', updateTentativaError);
      } else {
        console.log('✅ Tentativa atualizada com transaction_id:', paymentId);
      }
    }

    // 4. Logar a sincronização
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'MERCADOPAGO_TRANSACTION_ID_SYNC',
        descricao: `Transaction ID ${paymentId} sincronizado para pedido ${pedido.id}`
      });

    console.log('✅ [SYNC] Sincronização concluída:', {
      pedidoId: pedido.id,
      paymentId,
      valorTotal: pedido.valor_total
    });

    return new Response(
      JSON.stringify({
        success: true,
        pedidoId: pedido.id,
        paymentId,
        message: 'Transaction ID sincronizado com sucesso'
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('❌ [SYNC] Erro na sincronização:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});