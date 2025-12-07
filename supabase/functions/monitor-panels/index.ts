import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HorarioFuncionamento {
  inicio: string;
  fim: string;
  herdar_predio: boolean;
}

interface AlertConfig {
  ativo: boolean;
  tempo_offline_minutos: number; // Now stored as seconds
  repetir_ate_resolver: boolean;
  intervalo_repeticao_minutos: number; // Now stored as seconds
  notificar_quando_online: boolean;
}

// Check if current time is within operating hours
function isWithinOperatingHours(horario: HorarioFuncionamento | null): boolean {
  if (!horario) return true; // If no schedule, always active

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [inicioHour, inicioMin] = horario.inicio.split(':').map(Number);
  const [fimHour, fimMin] = horario.fim.split(':').map(Number);
  const inicioTime = inicioHour * 60 + inicioMin;
  const fimTime = fimHour * 60 + fimMin;

  // Handle overnight schedule (e.g., 04:00 to 00:00)
  if (fimTime <= inicioTime) {
    // Active if current time is after inicio OR before fim
    return currentTime >= inicioTime || currentTime < fimTime;
  }
  
  // Normal schedule (e.g., 08:00 to 18:00)
  return currentTime >= inicioTime && currentTime < fimTime;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 [MONITOR] Iniciando verificação de painéis...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get offline alert config
    const { data: alertConfig } = await supabase
      .from('panel_offline_alert_config')
      .select('*')
      .limit(1)
      .single();

    if (!alertConfig?.ativo) {
      console.log('⏸️ [MONITOR] Alertas de offline desativados');
      return new Response(JSON.stringify({ message: 'Alertas desativados' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. Get recipients
    const { data: recipients } = await supabase
      .from('panel_offline_alert_recipients')
      .select('*')
      .eq('ativo', true);

    // 3. Get all active panels with their buildings
    const { data: paineis, error: paineisError } = await supabase
      .from('painels')
      .select(`
        *,
        buildings (
          id,
          nome,
          endereco,
          horario_funcionamento_padrao
        )
      `)
      .eq('status_vinculo', 'vinculado');

    if (paineisError) {
      console.error('❌ [MONITOR] Erro ao buscar painéis:', paineisError);
      throw paineisError;
    }

    console.log(`📊 [MONITOR] Analisando ${paineis?.length || 0} painéis vinculados...`);

    const now = new Date();
    // Values are now in seconds (field names kept for backwards compatibility)
    const offlineThresholdMs = (alertConfig.tempo_offline_minutos || 60) * 1000; // seconds to ms
    const repeatIntervalMs = (alertConfig.intervalo_repeticao_minutos || 300) * 1000; // seconds to ms
    
    let offlineDetected = 0;
    let backOnlineDetected = 0;
    let alertsSent = 0;

    for (const painel of paineis || []) {
      // Get operating hours (panel's own or inherited from building)
      let horario: HorarioFuncionamento | null = null;
      
      if (painel.horario_funcionamento) {
        horario = painel.horario_funcionamento as HorarioFuncionamento;
        if (horario.herdar_predio && painel.buildings?.horario_funcionamento_padrao) {
          horario = painel.buildings.horario_funcionamento_padrao as HorarioFuncionamento;
        }
      }

      // Check if within operating hours
      if (!isWithinOperatingHours(horario)) {
        console.log(`⏰ [MONITOR] Painel ${painel.code} fora do horário de funcionamento - ignorando`);
        continue;
      }

      const lastOnline = painel.ultima_sync ? new Date(painel.ultima_sync) : null;
      const timeSinceLastOnline = lastOnline ? now.getTime() - lastOnline.getTime() : Infinity;
      const isOffline = timeSinceLastOnline > offlineThresholdMs;
      const currentStatus = painel.status;

      // Detect: online → offline
      if (currentStatus !== 'offline' && isOffline) {
        console.warn(`🔴 [MONITOR] Painel OFFLINE detectado: ${painel.code}`);
        offlineDetected++;

        // Check if we should send alert (first time or repeat interval passed)
        const lastAlertAt = painel.last_offline_alert_at ? new Date(painel.last_offline_alert_at) : null;
        const shouldSendAlert = !lastAlertAt || 
          (alertConfig.repetir_ate_resolver && (now.getTime() - lastAlertAt.getTime() > repeatIntervalMs));

        if (shouldSendAlert && recipients && recipients.length > 0) {
          const offlineSeconds = Math.round(timeSinceLastOnline / 1000);
          const offlineDisplay = offlineSeconds >= 60 
            ? `${Math.floor(offlineSeconds / 60)}min ${offlineSeconds % 60}s`
            : `${offlineSeconds}s`;
          const alertCount = (painel.offline_alert_count || 0) + 1;
          
          // Send WhatsApp alert via Z-API
          try {
            const { data: agent } = await supabase
              .from('agents')
              .select('zapi_config')
              .eq('key', 'exa_alert')
              .single();

            if (agent?.zapi_config) {
              const zapiConfig = agent.zapi_config as { instance_id: string; token: string };
              
              for (const recipient of recipients) {
                const phone = recipient.telefone.replace(/\D/g, '');
                const message = `🔴 *PAINEL OFFLINE*\n\n` +
                  `📍 Prédio: ${painel.buildings?.nome || 'N/A'}\n` +
                  `🖥️ Painel: ${painel.code}\n` +
                  `⏱️ Offline há: ${offlineDisplay}\n` +
                  `📅 Detectado às: ${now.toLocaleTimeString('pt-BR')}\n` +
                  (alertCount > 1 ? `\n⚠️ Este é o ${alertCount}º aviso` : '');

                await fetch(`https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone, message })
                });
              }
              alertsSent++;
            }
          } catch (err) {
            console.error('❌ [MONITOR] Erro ao enviar alerta:', err);
          }

          // Update panel alert tracking
          await supabase
            .from('painels')
            .update({ 
              status: 'offline',
              last_offline_alert_at: now.toISOString(),
              offline_alert_count: alertCount
            })
            .eq('id', painel.id);

          // Log alert
          const offlineMinutesForLog = Math.round(timeSinceLastOnline / 60000);
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: painel.id,
            tipo: 'offline',
            mensagem: `Painel offline há ${offlineDisplay}`,
            tempo_offline_minutos: offlineMinutesForLog,
            destinatarios_notificados: recipients.map(r => r.telefone)
          });
        } else {
          // Just update status without sending alert
          await supabase
            .from('painels')
            .update({ status: 'offline' })
            .eq('id', painel.id);
        }
      }

      // Detect: offline → online
      if (currentStatus === 'offline' && !isOffline) {
        console.log(`🟢 [MONITOR] Painel VOLTOU ONLINE: ${painel.code}`);
        backOnlineDetected++;

        // Reset alert tracking
        await supabase
          .from('painels')
          .update({ 
            status: 'online',
            last_offline_alert_at: null,
            offline_alert_count: 0
          })
          .eq('id', painel.id);

        // Send online notification
        if (alertConfig.notificar_quando_online && recipients && recipients.length > 0) {
          const offlineSeconds = painel.offline_alert_count ? 
            Math.round((now.getTime() - new Date(painel.last_offline_alert_at || now).getTime()) / 1000) : 0;
          const offlineDisplay = offlineSeconds >= 60 
            ? `${Math.floor(offlineSeconds / 60)}min ${offlineSeconds % 60}s`
            : `${offlineSeconds}s`;
            

          try {
            const { data: agent } = await supabase
              .from('agents')
              .select('zapi_config')
              .eq('key', 'exa_alert')
              .single();

            if (agent?.zapi_config) {
              const zapiConfig = agent.zapi_config as { instance_id: string; token: string };
              
              for (const recipient of recipients) {
                const phone = recipient.telefone.replace(/\D/g, '');
                const message = `🟢 *PAINEL ONLINE*\n\n` +
                  `📍 Prédio: ${painel.buildings?.nome || 'N/A'}\n` +
                  `🖥️ Painel: ${painel.code}\n` +
                  `✅ Voltou online às: ${now.toLocaleTimeString('pt-BR')}\n` +
                  (offlineSeconds > 0 ? `⏱️ Ficou offline por: ${offlineDisplay}` : '');

                await fetch(`https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone, message })
                });
              }
            }
          } catch (err) {
            console.error('❌ [MONITOR] Erro ao enviar notificação online:', err);
          }

          // Log online event
          const offlineMinutesForLog = Math.round(offlineSeconds / 60);
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: painel.id,
            tipo: 'online',
            mensagem: `Painel voltou online após ${offlineDisplay}`,
            tempo_offline_minutos: offlineMinutesForLog,
            destinatarios_notificados: recipients.map(r => r.telefone)
          });
        }
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      total_paineis: paineis?.length || 0,
      offline_detected: offlineDetected,
      back_online_detected: backOnlineDetected,
      alerts_sent: alertsSent,
      monitoring_active: true,
    };

    console.log('✅ [MONITOR] Verificação concluída:', summary);

    return new Response(JSON.stringify(summary), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    console.error('❌ [MONITOR] Erro crítico:', error);
    return new Response(
      JSON.stringify({ error: error.message, monitoring_active: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
