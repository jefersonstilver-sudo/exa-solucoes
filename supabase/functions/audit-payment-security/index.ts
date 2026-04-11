
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, supabaseKey);
}

async function auditPaymentSecurity(supabase: any, clientId?: string) {
  try {
    console.log(`🔍 [AUDIT] Iniciando auditoria de segurança de pagamentos`);
    
    // Buscar todos os pedidos pagos
    let query = supabase
      .from('pedidos')
      .select('id, client_id, valor_total, status, log_pagamento, created_at, updated_at')
      .in('status', ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo']);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data: pedidos, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Erro ao buscar pedidos: ${error.message}`);
    }
    
    console.log(`📊 [AUDIT] Encontrados ${pedidos?.length || 0} pedidos pagos`);
    
    // Mapear paymentIds e verificar duplicatas
    const paymentIdMap = new Map<string, string[]>();
    const issues: any[] = [];
    
    for (const pedido of pedidos || []) {
      const logPagamento = pedido.log_pagamento as any;
      if (logPagamento) {
        const pixData = logPagamento.pixData || logPagamento.pix_data;
        if (pixData?.paymentId) {
          const paymentId = pixData.paymentId;
          
          if (!paymentIdMap.has(paymentId)) {
            paymentIdMap.set(paymentId, []);
          }
          
          paymentIdMap.get(paymentId)!.push(pedido.id);
        }
      }
    }
    
    // Identificar paymentIds duplicados
    const duplicates: any[] = [];
    for (const [paymentId, pedidoIds] of paymentIdMap.entries()) {
      if (pedidoIds.length > 1) {
        console.error(`🚨 [AUDIT] DUPLICATA: paymentId ${paymentId} usado em ${pedidoIds.length} pedidos:`, pedidoIds);
        
        duplicates.push({
          paymentId,
          affectedOrders: pedidoIds,
          count: pedidoIds.length
        });
        
        // Buscar detalhes de cada pedido afetado
        for (const pedidoId of pedidoIds) {
          const pedido = pedidos.find(p => p.id === pedidoId);
          if (pedido) {
            issues.push({
              type: 'DUPLICATE_PAYMENT_ID',
              severity: 'CRITICAL',
              pedidoId: pedido.id,
              clientId: pedido.client_id,
              paymentId,
              status: pedido.status,
              valorTotal: pedido.valor_total,
              createdAt: pedido.created_at,
              message: `PaymentId ${paymentId} está sendo usado por múltiplos pedidos`
            });
          }
        }
      }
    }
    
    // Verificar pedidos sem paymentId mas marcados como pagos
    for (const pedido of pedidos || []) {
      const logPagamento = pedido.log_pagamento as any;
      const pixData = logPagamento?.pixData || logPagamento?.pix_data;
      
      if (!pixData?.paymentId) {
        issues.push({
          type: 'MISSING_PAYMENT_ID',
          severity: 'HIGH',
          pedidoId: pedido.id,
          clientId: pedido.client_id,
          status: pedido.status,
          valorTotal: pedido.valor_total,
          message: 'Pedido marcado como pago mas sem paymentId'
        });
      }
    }
    
    console.log(`✅ [AUDIT] Auditoria completa:`, {
      totalPedidos: pedidos?.length || 0,
      totalIssues: issues.length,
      duplicates: duplicates.length
    });
    
    return {
      success: true,
      summary: {
        totalOrders: pedidos?.length || 0,
        totalIssues: issues.length,
        duplicatePayments: duplicates.length,
        timestamp: new Date().toISOString()
      },
      duplicates,
      issues
    };
    
  } catch (error: any) {
    console.error(`❌ [AUDIT] Erro:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createSupabaseClient();
    const { client_id } = await req.json().catch(() => ({}));
    
    const result = await auditPaymentSecurity(supabase, client_id);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
