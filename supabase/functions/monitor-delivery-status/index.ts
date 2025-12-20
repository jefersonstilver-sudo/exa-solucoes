import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half_open';
  failure_count: number;
  cooldown_until: string | null;
}

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos
const RETRY_COOLDOWN_MS = 60 * 1000; // 1 minuto entre retries
const MAX_RETRIES = 2;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[MONITOR-DELIVERY] ========== INICIANDO VERIFICAÇÃO ==========');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Buscar mensagens outbound pendentes de verificação (últimos 30 min)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('messages')
      .select(`
        id,
        zapi_message_id,
        conversation_id,
        content,
        created_at,
        delivery_status,
        delivery_retry_count,
        conversations!inner(agent_key)
      `)
      .eq('direction', 'outbound')
      .in('delivery_status', ['pending', 'suspected_delivery_failure'])
      .gte('created_at', thirtyMinutesAgo)
      .lt('delivery_retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[MONITOR-DELIVERY] Erro ao buscar mensagens:', fetchError);
      throw fetchError;
    }

    console.log(`[MONITOR-DELIVERY] Mensagens pendentes encontradas: ${pendingMessages?.length || 0}`);

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        checked: 0,
        message: 'Nenhuma mensagem pendente para verificar'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Agrupar por agent_key para verificar circuit breaker
    const messagesByAgent: Record<string, typeof pendingMessages> = {};
    for (const msg of pendingMessages) {
      const agentKey = (msg.conversations as any)?.agent_key || 'unknown';
      if (!messagesByAgent[agentKey]) {
        messagesByAgent[agentKey] = [];
      }
      messagesByAgent[agentKey].push(msg);
    }

    const results = {
      checked: 0,
      delivered: 0,
      suspected_failure: 0,
      failed: 0,
      retried: 0,
      skipped_circuit_open: 0,
      alerts_created: 0
    };

    // 3. Processar cada agente
    for (const [agentKey, messages] of Object.entries(messagesByAgent)) {
      // Verificar circuit breaker
      const { data: circuitState } = await supabase
        .from('delivery_circuit_breaker')
        .select('*')
        .eq('agent_key', agentKey)
        .maybeSingle();

      const now = new Date();
      
      // Se circuit breaker está aberto e cooldown não passou, skip
      if (circuitState?.state === 'open' && circuitState?.cooldown_until) {
        const cooldownUntil = new Date(circuitState.cooldown_until);
        if (now < cooldownUntil) {
          console.log(`[MONITOR-DELIVERY] Circuit breaker OPEN para ${agentKey}, skipping ${messages.length} mensagens`);
          results.skipped_circuit_open += messages.length;
          continue;
        }
        
        // Cooldown passou, mudar para half_open
        await supabase
          .from('delivery_circuit_breaker')
          .update({ state: 'half_open', updated_at: now.toISOString() })
          .eq('agent_key', agentKey);
      }

      // Buscar configuração do agente para Z-API
      const { data: agent } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', agentKey)
        .maybeSingle();

      if (!agent?.zapi_config) {
        console.log(`[MONITOR-DELIVERY] Agente ${agentKey} sem configuração Z-API`);
        continue;
      }

      const zapiConfig = agent.zapi_config as { instance_id: string; token: string };
      const clientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

      // 4. Verificar status de cada mensagem
      let failuresInBatch = 0;

      for (const message of messages) {
        results.checked++;

        if (!message.zapi_message_id) {
          console.log(`[MONITOR-DELIVERY] Mensagem ${message.id} sem zapi_message_id, marcando como failed`);
          await updateDeliveryStatus(supabase, message.id, 'failed', 'No zapi_message_id');
          results.failed++;
          continue;
        }

        try {
          // Consultar status no Z-API
          const statusUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/message-status/${message.zapi_message_id}`;
          
          const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
              'Client-Token': clientToken || '',
              'Content-Type': 'application/json'
            }
          });

          if (!statusResponse.ok) {
            // Z-API retornou erro - pode ser not_found
            if (statusResponse.status === 404) {
              // Mensagem não encontrada - suspected_delivery_failure
              console.log(`[MONITOR-DELIVERY] Mensagem ${message.id} not_found no Z-API`);
              await updateDeliveryStatus(supabase, message.id, 'suspected_delivery_failure', 'Message not found in Z-API');
              results.suspected_failure++;
              failuresInBatch++;
              
              // Tentar retry se ainda não excedeu limite
              if ((message.delivery_retry_count || 0) < MAX_RETRIES) {
                await scheduleRetry(supabase, message);
                results.retried++;
              }
            } else {
              console.error(`[MONITOR-DELIVERY] Erro ao consultar Z-API: ${statusResponse.status}`);
              failuresInBatch++;
            }
            continue;
          }

          const statusData = await statusResponse.json();
          console.log(`[MONITOR-DELIVERY] Status da mensagem ${message.id}:`, statusData);

          // Interpretar status do Z-API
          const zapiStatus = statusData.status?.toLowerCase() || statusData.ack?.toLowerCase();
          
          if (['delivered', 'read', 'played'].includes(zapiStatus)) {
            // Entregue com sucesso
            await updateDeliveryStatus(supabase, message.id, 'delivered');
            results.delivered++;
          } else if (['sent', 'server'].includes(zapiStatus)) {
            // Enviado mas não confirmado ainda - manter pending
            console.log(`[MONITOR-DELIVERY] Mensagem ${message.id} ainda em trânsito: ${zapiStatus}`);
          } else if (['failed', 'error'].includes(zapiStatus)) {
            // Falha confirmada
            await updateDeliveryStatus(supabase, message.id, 'failed', `Z-API status: ${zapiStatus}`);
            results.failed++;
            failuresInBatch++;
            
            // Criar alerta
            await createAlert(supabase, message, 'delivery_failed', `Mensagem falhou na entrega: ${zapiStatus}`);
            results.alerts_created++;
          } else {
            // Status desconhecido - suspected
            console.log(`[MONITOR-DELIVERY] Status desconhecido para ${message.id}: ${zapiStatus}`);
            await updateDeliveryStatus(supabase, message.id, 'suspected_delivery_failure', `Unknown status: ${zapiStatus}`);
            results.suspected_failure++;
          }

        } catch (error) {
          console.error(`[MONITOR-DELIVERY] Erro ao verificar mensagem ${message.id}:`, error);
          failuresInBatch++;
        }
      }

      // 5. Atualizar circuit breaker
      await updateCircuitBreaker(supabase, agentKey, failuresInBatch, circuitState);
    }

    const duration = Date.now() - startTime;
    console.log(`[MONITOR-DELIVERY] ========== CONCLUÍDO em ${duration}ms ==========`);
    console.log(`[MONITOR-DELIVERY] Resultados:`, results);

    return new Response(JSON.stringify({
      success: true,
      duration_ms: duration,
      ...results
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[MONITOR-DELIVERY] Erro fatal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function updateDeliveryStatus(
  supabase: any,
  messageId: string,
  status: string,
  error?: string
) {
  await supabase
    .from('messages')
    .update({
      delivery_status: status,
      delivery_checked_at: new Date().toISOString(),
      delivery_last_error: error || null
    })
    .eq('id', messageId);
}

async function scheduleRetry(supabase: any, message: any) {
  console.log(`[MONITOR-DELIVERY] Agendando retry para mensagem ${message.id}`);
  
  // Incrementar contador de retry
  await supabase
    .from('messages')
    .update({
      delivery_retry_count: (message.delivery_retry_count || 0) + 1
    })
    .eq('id', message.id);

  // Aqui poderia triggerar um re-envio via zapi-send-message
  // Por enquanto, apenas logamos - o próximo ciclo tentará novamente
}

async function createAlert(
  supabase: any,
  message: any,
  type: string,
  alertMessage: string
) {
  await supabase
    .from('system_alerts')
    .insert({
      type,
      severity: 'warning',
      title: 'Falha na entrega de mensagem',
      message: alertMessage,
      related_message_id: message.id,
      metadata: {
        zapi_message_id: message.zapi_message_id,
        conversation_id: message.conversation_id,
        content_preview: message.content?.substring(0, 100)
      }
    });
}

async function updateCircuitBreaker(
  supabase: any,
  agentKey: string,
  failures: number,
  currentState: CircuitBreakerState | null
) {
  const now = new Date();
  
  if (!currentState) {
    // Criar registro inicial
    await supabase
      .from('delivery_circuit_breaker')
      .insert({
        agent_key: agentKey,
        state: failures >= CIRCUIT_BREAKER_THRESHOLD ? 'open' : 'closed',
        failure_count: failures,
        last_failure_at: failures > 0 ? now.toISOString() : null,
        opened_at: failures >= CIRCUIT_BREAKER_THRESHOLD ? now.toISOString() : null,
        cooldown_until: failures >= CIRCUIT_BREAKER_THRESHOLD 
          ? new Date(now.getTime() + CIRCUIT_BREAKER_COOLDOWN_MS).toISOString() 
          : null
      });
    return;
  }

  const newFailureCount = (currentState.failure_count || 0) + failures;
  
  if (newFailureCount >= CIRCUIT_BREAKER_THRESHOLD && currentState.state !== 'open') {
    // Abrir circuit breaker
    console.log(`[MONITOR-DELIVERY] Circuit breaker OPENING para ${agentKey}`);
    await supabase
      .from('delivery_circuit_breaker')
      .update({
        state: 'open',
        failure_count: newFailureCount,
        last_failure_at: now.toISOString(),
        opened_at: now.toISOString(),
        cooldown_until: new Date(now.getTime() + CIRCUIT_BREAKER_COOLDOWN_MS).toISOString(),
        updated_at: now.toISOString()
      })
      .eq('agent_key', agentKey);
  } else if (failures === 0 && currentState.state === 'half_open') {
    // Sucesso em half_open - fechar circuit breaker
    console.log(`[MONITOR-DELIVERY] Circuit breaker CLOSING para ${agentKey}`);
    await supabase
      .from('delivery_circuit_breaker')
      .update({
        state: 'closed',
        failure_count: 0,
        cooldown_until: null,
        updated_at: now.toISOString()
      })
      .eq('agent_key', agentKey);
  } else {
    // Atualizar contagem
    await supabase
      .from('delivery_circuit_breaker')
      .update({
        failure_count: newFailureCount,
        last_failure_at: failures > 0 ? now.toISOString() : currentState.last_failure_at,
        updated_at: now.toISOString()
      })
      .eq('agent_key', agentKey);
  }
}
