// Mercado Pago Balance & Account Info
// Retorna saldo disponível, bloqueado e a liberar da conta MP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      throw new Error(`Erro ao buscar conta: ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();
    console.log('👤 [MP-BALANCE] Conta:', accountData.nickname || accountData.email);

    // 2. Buscar pagamentos recentes para calcular valores
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

    let approvedPayments = [];
    let totalReceived = 0;
    let netReceived = 0;
    let pendingRelease = 0;
    let feesTotal = 0;

    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      approvedPayments = paymentsData.results || [];

      for (const payment of approvedPayments) {
        totalReceived += payment.transaction_amount || 0;
        netReceived += payment.transaction_details?.net_received_amount || 0;
        
        // Calcular taxas
        if (payment.fee_details && payment.fee_details.length > 0) {
          for (const fee of payment.fee_details) {
            feesTotal += fee.amount || 0;
          }
        }

        // Verificar se já foi liberado (money_release_date no passado)
        if (payment.money_release_date) {
          const releaseDate = new Date(payment.money_release_date);
          if (releaseDate > now) {
            pendingRelease += payment.transaction_details?.net_received_amount || 0;
          }
        }
      }
    }

    // 3. Buscar pagamentos pendentes
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

    // 4. Calcular saldos estimados
    const availableBalance = netReceived - pendingRelease;
    const blockedBalance = pendingRelease;
    const toBeReleased = pendingRelease;

    const balanceData = {
      account: {
        id: accountData.id,
        nickname: accountData.nickname,
        email: accountData.email,
        site_status: accountData.status?.site_status,
        country_id: accountData.country_id
      },
      balance: {
        available: Math.max(0, availableBalance),
        blocked: blockedBalance,
        to_be_released: toBeReleased,
        currency: 'BRL'
      },
      summary_30d: {
        total_received: totalReceived,
        net_received: netReceived,
        fees_paid: feesTotal,
        payments_count: approvedPayments.length,
        pending_payments: pendingPayments,
        pending_amount: pendingAmount
      },
      last_updated: new Date().toISOString()
    };

    console.log('✅ [MP-BALANCE] Saldo calculado:', JSON.stringify(balanceData.balance));

    return new Response(JSON.stringify(balanceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [MP-BALANCE] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao buscar saldo'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
