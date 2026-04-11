/**
 * Get Asaas Account Balance
 * Retorna o saldo disponível, a liberar e bloqueado da conta Asaas
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💰 [ASAAS-BALANCE] Iniciando busca de saldo...');
    
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://api.asaas.com/v3';
    
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurado');
    }

    // 1. Buscar saldo da conta
    const balanceResponse = await fetch(`${asaasBaseUrl}/finance/balance`, {
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      console.error('❌ [ASAAS-BALANCE] Erro ao buscar saldo:', balanceResponse.status, errorText);
      throw new Error(`Erro ao buscar saldo: ${balanceResponse.statusText}`);
    }

    const balanceData = await balanceResponse.json();
    console.log('💵 [ASAAS-BALANCE] Saldo obtido:', JSON.stringify(balanceData));

    // 2. Buscar estatísticas de cobrança (últimos 30 dias)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [paymentsReceived, paymentsPending, paymentsOverdue] = await Promise.all([
      // Pagamentos recebidos
      fetch(`${asaasBaseUrl}/payments?status=RECEIVED&dateCreated[ge]=${thirtyDaysAgo.toISOString().split('T')[0]}&limit=100`, {
        headers: { 'access_token': asaasApiKey }
      }),
      // Pagamentos pendentes
      fetch(`${asaasBaseUrl}/payments?status=PENDING&limit=100`, {
        headers: { 'access_token': asaasApiKey }
      }),
      // Pagamentos vencidos
      fetch(`${asaasBaseUrl}/payments?status=OVERDUE&limit=100`, {
        headers: { 'access_token': asaasApiKey }
      })
    ]);

    let totalReceived = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let receivedCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    if (paymentsReceived.ok) {
      const data = await paymentsReceived.json();
      receivedCount = data.totalCount || data.data?.length || 0;
      for (const payment of data.data || []) {
        totalReceived += payment.netValue || payment.value || 0;
      }
    }

    if (paymentsPending.ok) {
      const data = await paymentsPending.json();
      pendingCount = data.totalCount || data.data?.length || 0;
      for (const payment of data.data || []) {
        totalPending += payment.value || 0;
      }
    }

    if (paymentsOverdue.ok) {
      const data = await paymentsOverdue.json();
      overdueCount = data.totalCount || data.data?.length || 0;
      for (const payment of data.data || []) {
        totalOverdue += payment.value || 0;
      }
    }

    console.log(`📊 [ASAAS-BALANCE] Recebidos: R$ ${totalReceived.toFixed(2)} (${receivedCount}) | Pendentes: R$ ${totalPending.toFixed(2)} (${pendingCount}) | Vencidos: R$ ${totalOverdue.toFixed(2)} (${overdueCount})`);

    const responseData = {
      balance: {
        available: balanceData.balance || 0,
        blocked: 0, // Asaas não tem conceito de bloqueado
        to_be_released: totalPending,
        currency: 'BRL',
        source: 'asaas'
      },
      summary_30d: {
        total_received: totalReceived,
        received_count: receivedCount,
        total_pending: totalPending,
        pending_count: pendingCount,
        total_overdue: totalOverdue,
        overdue_count: overdueCount
      },
      last_updated: new Date().toISOString()
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [ASAAS-BALANCE] Erro:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao buscar saldo',
      balance: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
