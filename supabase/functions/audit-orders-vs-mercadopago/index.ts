// Audit Orders vs Mercado Pago - Anti-Fraud System
// Verifica integridade entre pedidos locais e pagamentos MP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  pedido_id: string | null;
  client_name: string | null;
  client_email: string | null;
  order_value: number | null;
  mp_value: number | null;
  mp_payer_name: string | null;
  details: Record<string, any>;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [AUDIT] Iniciando auditoria anti-fraude...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    const alerts: AuditAlert[] = [];
    const stats = {
      total_orders_checked: 0,
      validated: 0,
      warnings: 0,
      critical: 0,
      integrity_percentage: 100
    };

    // 1. Buscar pedidos pagos recentes (últimos 90 dias)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        id,
        status,
        valor_total,
        metodo_pagamento,
        log_pagamento,
        compliance_data,
        created_at,
        client_id,
        users:client_id (
          nome,
          email
        )
      `)
      .in('status', ['pago', 'pago_pendente_video', 'em_veiculacao', 'concluido'])
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(200);

    if (pedidosError) {
      console.error('❌ [AUDIT] Erro ao buscar pedidos:', pedidosError);
      throw pedidosError;
    }

    console.log(`📋 [AUDIT] Analisando ${pedidos?.length || 0} pedidos pagos...`);
    stats.total_orders_checked = pedidos?.length || 0;

    // 2. Buscar pagamentos aprovados do MP (últimos 90 dias)
    const mpPaymentsResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?` +
      `status=approved&` +
      `begin_date=${ninetyDaysAgo.toISOString()}&` +
      `end_date=${new Date().toISOString()}&` +
      `limit=200`,
      {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let mpPayments: any[] = [];
    if (mpPaymentsResponse.ok) {
      const mpData = await mpPaymentsResponse.json();
      mpPayments = mpData.results || [];
    }

    console.log(`💳 [AUDIT] ${mpPayments.length} pagamentos MP encontrados`);

    // Criar mapa de pagamentos MP por external_reference
    const mpPaymentsByRef = new Map<string, any>();
    const mpPaymentsByAmount = new Map<number, any[]>();

    for (const mp of mpPayments) {
      if (mp.external_reference) {
        // Limpar referência (remover prefix de proposal se houver)
        let cleanRef = mp.external_reference;
        if (cleanRef.startsWith('proposal:')) {
          cleanRef = cleanRef.replace('proposal:', '').split(':installment:')[0];
        }
        mpPaymentsByRef.set(cleanRef, mp);
      }
      
      // Indexar por valor para busca fuzzy
      const amount = Math.round(mp.transaction_amount * 100); // Em centavos
      if (!mpPaymentsByAmount.has(amount)) {
        mpPaymentsByAmount.set(amount, []);
      }
      mpPaymentsByAmount.get(amount)!.push(mp);
    }

    // 3. Verificar cada pedido
    for (const pedido of (pedidos || [])) {
      const clientName = (pedido.users as any)?.nome || 'Desconhecido';
      const clientEmail = (pedido.users as any)?.email || null;
      const orderValue = pedido.valor_total || 0;

      // Verificação 1: Tem transaction_id no log_pagamento?
      const logPagamento = pedido.log_pagamento || {};
      const transactionId = logPagamento.pixData?.mpResponse?.id || 
                           logPagamento.cardData?.mpResponse?.id ||
                           logPagamento.transaction_id;

      // Verificação 2: Tem compliance_data.payer?
      const complianceData = pedido.compliance_data || {};
      const payerInfo = complianceData.payer || null;

      // Verificação 3: Existe pagamento MP correspondente?
      let mpPayment = mpPaymentsByRef.get(pedido.id);
      
      // Se não encontrou por ref, tentar por valor aproximado
      if (!mpPayment) {
        const orderValueCents = Math.round(orderValue * 100);
        const possiblePayments = mpPaymentsByAmount.get(orderValueCents) || [];
        
        // Verificar se algum pagamento foi criado próximo à data do pedido
        const pedidoDate = new Date(pedido.created_at);
        for (const pp of possiblePayments) {
          const ppDate = new Date(pp.date_created);
          const diffHours = Math.abs(pedidoDate.getTime() - ppDate.getTime()) / (1000 * 60 * 60);
          if (diffHours < 24) { // Dentro de 24h
            mpPayment = pp;
            break;
          }
        }
      }

      // Verificação 4: Nome do cliente bate com nome do pagador MP?
      let nameMatch = true;
      let mpPayerName = null;
      
      if (mpPayment && mpPayment.payer) {
        mpPayerName = `${mpPayment.payer.first_name || ''} ${mpPayment.payer.last_name || ''}`.trim();
        if (mpPayerName && clientName) {
          // Comparação fuzzy de nomes
          const clientNameLower = clientName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const payerNameLower = mpPayerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          // Verificar se algum nome está contido no outro
          nameMatch = clientNameLower.includes(payerNameLower.split(' ')[0]) || 
                     payerNameLower.includes(clientNameLower.split(' ')[0]);
        }
      }

      // Verificação 5: Valor do pedido bate com valor do pagamento MP?
      let valueMatch = true;
      let mpValue = null;
      
      if (mpPayment) {
        mpValue = mpPayment.transaction_amount;
        // Tolerância de R$ 0.01 para arredondamentos
        valueMatch = Math.abs(orderValue - mpValue) < 0.02;
      }

      // Gerar alertas baseados nas verificações
      let issuesFound = 0;

      // CRÍTICO: Pedido pago sem nenhum registro no MP
      if (!mpPayment && !transactionId) {
        stats.critical++;
        issuesFound++;
        alerts.push({
          id: crypto.randomUUID(),
          level: 'critical',
          type: 'ORDEM_SEM_PAGAMENTO_MP',
          message: 'Pedido marcado como pago sem registro de pagamento no Mercado Pago',
          pedido_id: pedido.id,
          client_name: clientName,
          client_email: clientEmail,
          order_value: orderValue,
          mp_value: null,
          mp_payer_name: null,
          details: {
            pedido_status: pedido.status,
            metodo_pagamento: pedido.metodo_pagamento,
            has_transaction_id: !!transactionId,
            has_compliance_data: !!payerInfo
          },
          created_at: new Date().toISOString()
        });
      }

      // WARNING: Nomes não batem
      if (mpPayment && !nameMatch && mpPayerName) {
        stats.warnings++;
        issuesFound++;
        alerts.push({
          id: crypto.randomUUID(),
          level: 'warning',
          type: 'NOME_DIVERGENTE',
          message: `Nome do cliente não corresponde ao pagador MP`,
          pedido_id: pedido.id,
          client_name: clientName,
          client_email: clientEmail,
          order_value: orderValue,
          mp_value: mpValue,
          mp_payer_name: mpPayerName,
          details: {
            client_name: clientName,
            mp_payer_name: mpPayerName,
            mp_payer_email: mpPayment.payer?.email,
            mp_payment_id: mpPayment.id
          },
          created_at: new Date().toISOString()
        });
      }

      // CRÍTICO: Valores não batem (possível fraude)
      if (mpPayment && !valueMatch) {
        stats.critical++;
        issuesFound++;
        alerts.push({
          id: crypto.randomUUID(),
          level: 'critical',
          type: 'VALOR_DIVERGENTE',
          message: `Valor do pedido (R$ ${orderValue.toFixed(2)}) difere do pagamento MP (R$ ${mpValue?.toFixed(2)})`,
          pedido_id: pedido.id,
          client_name: clientName,
          client_email: clientEmail,
          order_value: orderValue,
          mp_value: mpValue,
          mp_payer_name: mpPayerName,
          details: {
            difference: Math.abs(orderValue - (mpValue || 0)),
            mp_payment_id: mpPayment.id
          },
          created_at: new Date().toISOString()
        });
      }

      // WARNING: Pedido sem compliance_data
      if (!payerInfo && mpPayment) {
        stats.warnings++;
        alerts.push({
          id: crypto.randomUUID(),
          level: 'info',
          type: 'DADOS_AUDITORIA_INCOMPLETOS',
          message: 'Pedido sem dados de auditoria completos (compliance_data)',
          pedido_id: pedido.id,
          client_name: clientName,
          client_email: clientEmail,
          order_value: orderValue,
          mp_value: mpValue,
          mp_payer_name: mpPayerName,
          details: {
            has_payer_info: !!payerInfo,
            has_transaction_id: !!transactionId
          },
          created_at: new Date().toISOString()
        });
      }

      if (issuesFound === 0) {
        stats.validated++;
      }
    }

    // 4. Verificar webhooks órfãos (pagamentos MP sem pedidos)
    const pedidoIds = new Set((pedidos || []).map(p => p.id));
    
    for (const mp of mpPayments) {
      let refId = mp.external_reference;
      if (refId?.startsWith('proposal:')) {
        refId = refId.replace('proposal:', '').split(':installment:')[0];
      }
      
      if (refId && !pedidoIds.has(refId) && !refId.startsWith('proposal')) {
        // Verificar se não é uma proposta
        const { data: proposal } = await supabase
          .from('proposals')
          .select('id')
          .eq('id', refId)
          .single();

        if (!proposal) {
          stats.warnings++;
          alerts.push({
            id: crypto.randomUUID(),
            level: 'warning',
            type: 'PAGAMENTO_MP_ORFAO',
            message: 'Pagamento MP aprovado sem pedido correspondente no sistema',
            pedido_id: null,
            client_name: `${mp.payer?.first_name || ''} ${mp.payer?.last_name || ''}`.trim() || 'Desconhecido',
            client_email: mp.payer?.email,
            order_value: null,
            mp_value: mp.transaction_amount,
            mp_payer_name: `${mp.payer?.first_name || ''} ${mp.payer?.last_name || ''}`.trim(),
            details: {
              mp_payment_id: mp.id,
              external_reference: mp.external_reference,
              date_approved: mp.date_approved,
              payment_method: mp.payment_method_id
            },
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Calcular integridade
    stats.integrity_percentage = stats.total_orders_checked > 0 
      ? Math.round((stats.validated / stats.total_orders_checked) * 100)
      : 100;

    // Ordenar alertas por severidade
    alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.level] - order[b.level];
    });

    console.log(`✅ [AUDIT] Auditoria concluída: ${stats.validated} validados, ${stats.warnings} warnings, ${stats.critical} críticos`);

    // Salvar alertas críticos no banco
    if (alerts.filter(a => a.level === 'critical').length > 0) {
      const { error: insertError } = await supabase
        .from('financial_audit_alerts')
        .upsert(
          alerts.filter(a => a.level === 'critical').map(a => ({
            id: a.id,
            level: a.level,
            alert_type: a.type,
            message: a.message,
            pedido_id: a.pedido_id,
            client_name: a.client_name,
            client_email: a.client_email,
            order_value: a.order_value,
            mp_value: a.mp_value,
            mp_payer_name: a.mp_payer_name,
            details: a.details,
            resolved: false,
            created_at: a.created_at
          })),
          { onConflict: 'id' }
        );

      if (insertError) {
        console.error('⚠️ [AUDIT] Erro ao salvar alertas:', insertError);
      }
    }

    return new Response(JSON.stringify({
      stats,
      alerts: alerts.slice(0, 50), // Limitar a 50 alertas no response
      total_alerts: alerts.length,
      last_audit: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [AUDIT] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro na auditoria'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
