// Mercado Pago Balance & Account Info
// Retorna saldo disponível, bloqueado e a liberar da conta MP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💰 [MP-BALANCE] Iniciando busca de saldo...');
    
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    // 1. Buscar informações da conta
    const accountResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('❌ [MP-BALANCE] Erro ao buscar conta:', accountResponse.status, errorText);
      throw new Error(`Erro ao buscar conta: ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();
    console.log('👤 [MP-BALANCE] Conta:', accountData.nickname || accountData.email, '| ID:', accountData.id);

    // 2. Tentar múltiplas fontes de saldo
    let balanceData = null;
    let balanceSource = 'unavailable';

    // Tentativa 1: /users/me/balance (nem sempre disponível)
    try {
      const balanceResponse = await fetch('https://api.mercadopago.com/users/me/balance', {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 [MP-BALANCE] Resposta /users/me/balance:', balanceResponse.status);
      
      if (balanceResponse.ok) {
        const data = await balanceResponse.json();
        console.log('💵 [MP-BALANCE] Dados de saldo:', JSON.stringify(data));
        
        if (data.available_balance !== undefined || data.total_amount !== undefined) {
          balanceData = {
            available: data.available_balance || data.total_amount || 0,
            blocked: data.unavailable_balance || data.unavailable_amount || 0,
            to_be_released: data.pending_balance || 0,
            currency: 'BRL'
          };
          balanceSource = 'api';
        }
      }
    } catch (e) {
      console.log('⚠️ [MP-BALANCE] /users/me/balance não disponível');
    }

    // Tentativa 2: /v1/account/balance
    if (!balanceData) {
      try {
        const altBalanceResponse = await fetch('https://api.mercadopago.com/v1/account/balance', {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 [MP-BALANCE] Resposta /v1/account/balance:', altBalanceResponse.status);
        
        if (altBalanceResponse.ok) {
          const data = await altBalanceResponse.json();
          console.log('💵 [MP-BALANCE] Dados alt balance:', JSON.stringify(data));
          
          if (data.available_balance !== undefined) {
            balanceData = {
              available: data.available_balance || 0,
              blocked: data.unavailable_balance || 0,
              to_be_released: data.pending_balance || 0,
              currency: 'BRL'
            };
            balanceSource = 'api';
          }
        }
      } catch (e) {
        console.log('⚠️ [MP-BALANCE] /v1/account/balance não disponível');
      }
    }

    // 3. Buscar pagamentos para KPIs (últimos 30 dias)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const paymentsResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?` +
      `begin_date=${thirtyDaysAgo.toISOString()}&` +
      `end_date=${now.toISOString()}&` +
      `status=approved&` +
      `limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let totalReceived = 0;
    let netReceived = 0;
    let feesTotal = 0;
    let paymentsCount = 0;

    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      const approvedPayments = paymentsData.results || [];
      paymentsCount = approvedPayments.length;

      for (const payment of approvedPayments) {
        totalReceived += payment.transaction_amount || 0;
        netReceived += payment.transaction_details?.net_received_amount || 0;
        
        if (payment.fee_details && payment.fee_details.length > 0) {
          for (const fee of payment.fee_details) {
            feesTotal += fee.amount || 0;
          }
        }
      }
      
      console.log(`📊 [MP-BALANCE] ${paymentsCount} pagamentos (30d) | Bruto: R$ ${totalReceived.toFixed(2)} | Líquido: R$ ${netReceived.toFixed(2)} | Taxas: R$ ${feesTotal.toFixed(2)}`);
    }

    // 4. Buscar pagamentos pendentes
    const pendingResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?status=pending&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let pendingPayments = 0;
    let pendingAmount = 0;

    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      pendingPayments = pendingData.results?.length || 0;
      for (const payment of pendingData.results || []) {
        pendingAmount += payment.transaction_amount || 0;
      }
    }

    // 5. Resposta final - SEM CALCULAR SALDO FICTÍCIO
    const responseData = {
      account: {
        id: accountData.id,
        nickname: accountData.nickname,
        email: accountData.email,
        site_status: accountData.status?.site_status,
        country_id: accountData.country_id
      },
      balance: balanceData, // null se não disponível
      balance_source: balanceSource,
      summary_30d: {
        total_received: totalReceived,
        net_received: netReceived,
        fees_paid: feesTotal,
        payments_count: paymentsCount,
        pending_payments: pendingPayments,
        pending_amount: pendingAmount
      },
      last_updated: new Date().toISOString()
    };

    console.log(`✅ [MP-BALANCE] Fonte do saldo: ${balanceSource} | Saldo: ${balanceData ? 'disponível' : 'NÃO disponível'}`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [MP-BALANCE] Erro:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao buscar saldo',
      balance: null,
      balance_source: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
