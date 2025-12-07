import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertConfig {
  ativo: boolean;
  tempo_offline_minutos: number; // Stored as seconds
  repetir_ate_resolver: boolean;
  intervalo_repeticao_minutos: number; // Stored as seconds
  notificar_quando_online: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 [MONITOR] Iniciando verificação de painéis (devices)...');
    
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

    // 3. Get all active devices (the actual panels with AnyDesk)
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .eq('is_active', true);

    if (devicesError) {
      console.error('❌ [MONITOR] Erro ao buscar devices:', devicesError);
      throw devicesError;
    }

    console.log(`📊 [MONITOR] Analisando ${devices?.length || 0} devices ativos...`);

    const now = new Date();
    // Values are in seconds
    const offlineThresholdMs = (alertConfig.tempo_offline_minutos || 60) * 1000;
    const repeatIntervalMs = (alertConfig.intervalo_repeticao_minutos || 300) * 1000;
    
    let offlineDetected = 0;
    let backOnlineDetected = 0;
    let alertsSent = 0;

    for (const device of devices || []) {
      const lastOnline = device.last_online_at ? new Date(device.last_online_at) : null;
      const timeSinceLastOnline = lastOnline ? now.getTime() - lastOnline.getTime() : Infinity;
      const isOffline = timeSinceLastOnline > offlineThresholdMs;
      const currentStatus = device.status;

      // Detect: online → offline
      if (currentStatus !== 'offline' && isOffline) {
        console.warn(`🔴 [MONITOR] Device OFFLINE detectado: ${device.name}`);
        offlineDetected++;

        // Get metadata for alert tracking
        const metadata = (device.metadata || {}) as { last_offline_alert_at?: string; offline_alert_count?: number };
        const lastAlertAt = metadata.last_offline_alert_at ? new Date(metadata.last_offline_alert_at) : null;
        const shouldSendAlert = !lastAlertAt || 
          (alertConfig.repetir_ate_resolver && (now.getTime() - lastAlertAt.getTime() > repeatIntervalMs));

        if (shouldSendAlert && recipients && recipients.length > 0) {
          const offlineSeconds = Math.round(timeSinceLastOnline / 1000);
          const offlineDisplay = offlineSeconds >= 60 
            ? `${Math.floor(offlineSeconds / 60)}min ${offlineSeconds % 60}s`
            : `${offlineSeconds}s`;
          const alertCount = (metadata.offline_alert_count || 0) + 1;
          
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
                // Ensure phone has country code
                let phone = recipient.telefone.replace(/\D/g, '');
                if (!phone.startsWith('55') && phone.length === 11) {
                  phone = '55' + phone;
                }
                
                const message = `🔴 *PAINEL OFFLINE*\n\n` +
                  `📍 Local: ${device.condominio_name || device.name}\n` +
                  `🖥️ Painel: ${device.name}\n` +
                  `⏱️ Offline há: ${offlineDisplay}\n` +
                  `📅 Detectado às: ${now.toLocaleTimeString('pt-BR')}\n` +
                  (alertCount > 1 ? `\n⚠️ Este é o ${alertCount}º aviso` : '');

                console.log(`📱 [MONITOR] Enviando alerta para ${phone}...`);
                
                const zapiResponse = await fetch(`https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone, message })
                });
                
                const zapiResult = await zapiResponse.json();
                console.log(`📱 [MONITOR] Z-API response:`, zapiResult);
              }
              alertsSent++;
            } else {
              console.error('❌ [MONITOR] Z-API config não encontrada para exa_alert');
            }
          } catch (err) {
            console.error('❌ [MONITOR] Erro ao enviar alerta:', err);
          }

          // Update device metadata for alert tracking
          const newMetadata = {
            ...device.metadata,
            last_offline_alert_at: now.toISOString(),
            offline_alert_count: alertCount
          };
          
          await supabase
            .from('devices')
            .update({ 
              status: 'offline',
              metadata: newMetadata
            })
            .eq('id', device.id);

          // Log alert
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: device.id,
            tipo: 'offline',
            mensagem: `Device ${device.name} offline há ${offlineDisplay}`,
            tempo_offline_minutos: Math.round(timeSinceLastOnline / 60000),
            destinatarios_notificados: recipients.map(r => r.telefone)
          });
        } else {
          // Just update status without sending alert
          await supabase
            .from('devices')
            .update({ status: 'offline' })
            .eq('id', device.id);
        }
      }

      // Detect: offline → online
      if (currentStatus === 'offline' && !isOffline) {
        console.log(`🟢 [MONITOR] Device VOLTOU ONLINE: ${device.name}`);
        backOnlineDetected++;

        const metadata = (device.metadata || {}) as { last_offline_alert_at?: string; offline_alert_count?: number };

        // Reset alert tracking in metadata
        const newMetadata = {
          ...device.metadata,
          last_offline_alert_at: null,
          offline_alert_count: 0
        };
        
        await supabase
          .from('devices')
          .update({ 
            status: 'online',
            metadata: newMetadata
          })
          .eq('id', device.id);

        // Send online notification
        if (alertConfig.notificar_quando_online && recipients && recipients.length > 0) {
          const offlineSeconds = metadata.last_offline_alert_at ? 
            Math.round((now.getTime() - new Date(metadata.last_offline_alert_at).getTime()) / 1000) : 0;
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
                let phone = recipient.telefone.replace(/\D/g, '');
                if (!phone.startsWith('55') && phone.length === 11) {
                  phone = '55' + phone;
                }
                
                const message = `🟢 *PAINEL ONLINE*\n\n` +
                  `📍 Local: ${device.condominio_name || device.name}\n` +
                  `🖥️ Painel: ${device.name}\n` +
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
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: device.id,
            tipo: 'online',
            mensagem: `Device ${device.name} voltou online após ${offlineDisplay}`,
            tempo_offline_minutos: Math.round(offlineSeconds / 60),
            destinatarios_notificados: recipients.map(r => r.telefone)
          });
        }
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      total_devices: devices?.length || 0,
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
