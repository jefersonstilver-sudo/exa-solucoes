import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Data limite: 2 dias atrás
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    console.log('🧹 Cancelando pedidos pendentes anteriores a:', twoDaysAgo.toISOString());
    
    // Buscar pedidos pendentes expirados
    const { data: expiredOrders, error: fetchError } = await supabase
      .from('pedidos')
      .select('id, created_at, valor_total, client_id, status')
      .eq('status', 'pendente')
      .lt('created_at', twoDaysAgo.toISOString());
    
    if (fetchError) {
      console.error('❌ Erro ao buscar pedidos:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`📊 Encontrados ${expiredOrders?.length || 0} pedidos para cancelar`);
    
    // Cancelar cada pedido
    let canceledCount = 0;
    const errors: string[] = [];
    
    for (const order of expiredOrders || []) {
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ 
          status: 'cancelado',
          log_pagamento: {
            ...order.log_pagamento,
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Pagamento não realizado em 48 horas',
            auto_cancelled: true
          }
        })
        .eq('id', order.id);
      
      if (!updateError) {
        canceledCount++;
        console.log(`✅ Pedido ${order.id} cancelado`);
      } else {
        const errorMsg = `Erro ao cancelar ${order.id}: ${updateError.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const response = {
      success: true,
      canceled: canceledCount,
      total: expiredOrders?.length || 0,
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log('📊 Resultado final:', response);
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('💥 Erro fatal:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
