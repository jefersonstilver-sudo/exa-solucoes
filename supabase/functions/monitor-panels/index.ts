import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRule {
  id: string;
  nome: string;
  tempo_offline_segundos: number;
  intervalo_repeticao_segundos: number;
  repetir_ate_resolver: boolean;
  notificar_quando_online: boolean;
  ativo: boolean;
  prioridade: number;
}

interface DeviceMetadata {
  last_offline_alert_at?: string;
  offline_alert_count?: number;
  triggered_rules?: string[];
  last_rule_id?: string;
  current_incident_id?: string;
  incident_number?: number;
  notifications_paused_until?: string;
  paused_by?: string;
}

// Helper to check if we're in scheduled shutdown period (1:00 - 6:00 BRT)
const isScheduledShutdownPeriod = (): boolean => {
  const brazilTime = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const hour = new Date(brazilTime).getHours();
  return hour >= 1 && hour < 6;
};

// Helper to get Brazil time string
const getBrazilTimeString = (): string => {
  return new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

// Helper to generate UUID
const generateUUID = (): string => {
  return crypto.randomUUID();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const testMode = body.testMode === true;
    const testRuleId = body.ruleId;
    
    const isShutdownPeriod = isScheduledShutdownPeriod();
    const brazilTime = getBrazilTimeString();
    
    console.log(`🤖 [MONITOR] Iniciando verificação ${testMode ? '(MODO TESTE)' : ''} - Horário BRT: ${brazilTime}${isShutdownPeriod ? ' [PERÍODO PROGRAMADO 1h-4h]' : ''}...`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get all active alert rules
    const { data: alertRules, error: rulesError } = await supabase
      .from('panel_offline_alert_rules')
      .select('*')
      .eq('ativo', true)
      .order('tempo_offline_segundos', { ascending: true });

    if (rulesError) throw rulesError;

    if (!alertRules || alertRules.length === 0) {
      console.log('⏸️ [MONITOR] Nenhuma regra de alerta ativa');
      return new Response(JSON.stringify({ message: 'Sem regras ativas' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. Get recipients
    const { data: recipients } = await supabase
      .from('panel_offline_alert_recipients')
      .select('*')
      .eq('ativo', true);

    if (!recipients || recipients.length === 0) {
      console.log('⏸️ [MONITOR] Nenhum destinatário configurado');
      return new Response(JSON.stringify({ message: 'Sem destinatários' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 3. Get Z-API config
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'exa_alert')
      .single();

    if (!agent?.zapi_config) {
      console.error('❌ [MONITOR] Z-API config não encontrada');
      return new Response(JSON.stringify({ error: 'Z-API não configurado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const zapiConfig = agent.zapi_config as { instance_id: string; token: string; client_token?: string };

    // 4. Get all active devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select(`*, buildings:building_id (endereco, bairro, notion_internet)`)
      .eq('is_active', true);

    if (devicesError) throw devicesError;

    console.log(`📊 [MONITOR] Analisando ${devices?.length || 0} devices...`);

    const now = new Date();
    let offlineDetected = 0;
    let backOnlineDetected = 0;
    let alertsSent = 0;

    // Get confirmation buttons
    const { data: confirmButtons } = await supabase
      .from('panel_offline_alert_buttons')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    // Helper to send WhatsApp - now includes deviceId in button actions for tracking
    const sendWhatsApp = async (phone: string, message: string, withButtons: boolean = false, deviceId?: string): Promise<{ success: boolean; messageId?: string }> => {
      try {
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55') && formattedPhone.length === 11) {
          formattedPhone = '55' + formattedPhone;
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (zapiClientToken) headers['Client-Token'] = zapiClientToken;
        else if (zapiConfig.client_token) headers['Client-Token'] = zapiConfig.client_token;

        if (withButtons && confirmButtons && confirmButtons.length > 0) {
          // Include deviceId in button ID for tracking: "buttonId:deviceId"
          const buttonActions = confirmButtons.map((btn) => ({
            id: deviceId ? `${btn.id}:${deviceId}` : btn.id,
            type: 'REPLY',
            label: `${btn.emoji || '✅'} ${btn.label}`
          }));

          const response = await fetch(
            `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-button-actions`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ phone: formattedPhone, message, buttonActions, footer: 'Clique para confirmar' })
            }
          );

          const result = await response.json();
          if (result.error) {
            console.error('❌ [MONITOR] Z-API button error:', result.error);
            return { success: false };
          }
          return { success: true, messageId: result.messageId };
        }

        const response = await fetch(
          `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`,
          { method: 'POST', headers, body: JSON.stringify({ phone: formattedPhone, message }) }
        );

        const result = await response.json();
        if (result.error) return { success: false };
        return { success: true, messageId: result.messageId };
      } catch (err) {
        console.error('❌ [MONITOR] Erro ao enviar WhatsApp:', err);
        return { success: false };
      }
    };

    // Helper to format offline duration
    const formatOfflineDuration = (ms: number): string => {
      const seconds = Math.round(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) return `${minutes}min ${remainingSeconds}s`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    };

    for (const device of devices || []) {
      const lastOnline = device.last_online_at ? new Date(device.last_online_at) : null;
      const timeSinceLastOnline = lastOnline ? now.getTime() - lastOnline.getTime() : Infinity;
      const offlineSeconds = Math.round(timeSinceLastOnline / 1000);
      const currentStatus = device.status;
      const metadata = (device.metadata || {}) as DeviceMetadata;

      // Find applicable rule
      let applicableRule: AlertRule | undefined;
      
      if (testMode && testRuleId) {
        applicableRule = alertRules.find(r => r.id === testRuleId);
      } else {
        applicableRule = alertRules
          .filter(r => offlineSeconds >= r.tempo_offline_segundos)
          .sort((a, b) => b.tempo_offline_segundos - a.tempo_offline_segundos)[0];
      }

      const isOffline = applicableRule !== undefined || testMode;

      // ========== DEVICE WENT OFFLINE ==========
      if (isOffline && applicableRule) {
        console.log(`🔴 [MONITOR] Device ${device.name}: offline há ${formatOfflineDuration(timeSinceLastOnline)}${isShutdownPeriod ? ' [PERÍODO PROGRAMADO]' : ''}`);
        offlineDetected++;

        // Skip during shutdown period
        if (isShutdownPeriod && !testMode) {
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: device.id,
            device_name: device.name,
            tipo: 'programado',
            mensagem: `Período programado (1h-4h) - alerta ignorado`,
            tempo_offline_minutos: Math.round(timeSinceLastOnline / 60000),
            destinatarios_notificados: [],
            regra_id: applicableRule.id,
            regra_nome: applicableRule.nome
          });
          continue;
        }

        // CHECK PAUSE STATUS
        const pausedUntil = metadata.notifications_paused_until;
        if (pausedUntil && !testMode) {
          if (pausedUntil === 'indefinite') {
            console.log(`⏸️ [MONITOR] Device ${device.name}: notificações interrompidas até voltar online`);
            continue;
          }
          if (new Date(pausedUntil) > now) {
            console.log(`⏸️ [MONITOR] Device ${device.name}: notificações pausadas até ${pausedUntil}`);
            continue;
          }
        }

        const triggeredRules = metadata.triggered_rules || [];
        const alreadyTriggeredThisRule = triggeredRules.includes(applicableRule.id);
        const lastAlertAt = metadata.last_offline_alert_at ? new Date(metadata.last_offline_alert_at) : null;

        // INCIDENT MANAGEMENT
        let currentIncidentId = metadata.current_incident_id;
        let incidentNumber = metadata.incident_number || 0;
        let alertNumber = metadata.offline_alert_count || 0;

        // First offline for this incident
        if (!currentIncidentId) {
          currentIncidentId = generateUUID();
          incidentNumber = (incidentNumber || 0) + 1;
          alertNumber = 0;
          console.log(`🆕 [MONITOR] Nova ocorrência #${incidentNumber} para ${device.name}`);
        }

        let shouldSendAlert = false;
        let isRepeatAlert = false;

        if (testMode) {
          shouldSendAlert = true;
        } else if (!alreadyTriggeredThisRule) {
          shouldSendAlert = true;
        } else if (applicableRule.repetir_ate_resolver && lastAlertAt) {
          const timeSinceLastAlert = now.getTime() - lastAlertAt.getTime();
          const intervaloMs = applicableRule.intervalo_repeticao_segundos * 1000;
          
          if (timeSinceLastAlert >= intervaloMs) {
            shouldSendAlert = true;
            isRepeatAlert = true;
          }
        }

        if (shouldSendAlert) {
          alertNumber = alertNumber + 1;
          const offlineDisplay = formatOfflineDuration(timeSinceLastOnline);

          const emoji = testMode ? '🧪' :
                        applicableRule.tempo_offline_segundos >= 1800 ? '🚨' : 
                        applicableRule.tempo_offline_segundos >= 300 ? '⚠️' : '🔴';
          
          const buildingData = (device as any).buildings;
          const endereco = device.address || buildingData?.endereco || '';
          const bairro = buildingData?.bairro || '';
          const provedor = device.provider || buildingData?.notion_internet || '';
          
          let enderecoLine = endereco ? (bairro ? `🏠 ${endereco}, ${bairro}\n` : `🏠 ${endereco}\n`) : '';
          const provedorLine = provedor ? `🌐 Provedor: ${provedor}\n` : '';
          
          const testLabel = testMode ? ' (TESTE)' : '';
          const alertLabel = alertNumber > 1 ? `\n\n🔄 *${alertNumber}º AVISO* | Ocorrência #${incidentNumber}` : `\n\n📌 Ocorrência #${incidentNumber}`;
          
          const message = `${emoji} *${applicableRule.nome.toUpperCase()}${testLabel}*\n\n` +
            `📍 ${device.condominio_name || device.name}\n` +
            enderecoLine +
            `🖥️ Painel: ${device.name}\n` +
            provedorLine +
            `⏱️ Offline há: ${offlineDisplay}\n` +
            `📅 ${brazilTime}` +
            alertLabel;

          const sentRecipients: Array<{ phone: string; name: string; messageId?: string }> = [];
          for (const recipient of recipients) {
            // Pass device.id to include in button actions for tracking
            const result = await sendWhatsApp(recipient.telefone, message, true, device.id);
            if (result.success) {
              alertsSent++;
              sentRecipients.push({ phone: recipient.telefone, name: recipient.nome, messageId: result.messageId });
            }
          }

          // Update metadata
          if (!testMode) {
            const newTriggeredRules = [...triggeredRules];
            if (!newTriggeredRules.includes(applicableRule.id)) {
              newTriggeredRules.push(applicableRule.id);
            }

            const newMetadata: DeviceMetadata = {
              ...metadata,
              last_offline_alert_at: now.toISOString(),
              offline_alert_count: alertNumber,
              triggered_rules: newTriggeredRules,
              last_rule_id: applicableRule.id,
              current_incident_id: currentIncidentId,
              incident_number: incidentNumber
            };

            await supabase
              .from('devices')
              .update({ status: 'offline', metadata: newMetadata })
              .eq('id', device.id);
          }

          // Log alert with incident info
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: device.id,
            device_name: device.name,
            tipo: testMode ? 'teste' : 'offline',
            mensagem: `${alertNumber}º aviso - Ocorrência #${incidentNumber}`,
            tempo_offline_minutos: Math.round(timeSinceLastOnline / 60000),
            destinatarios_notificados: recipients.map(r => r.telefone),
            recipients: sentRecipients,
            regra_id: applicableRule.id,
            regra_nome: applicableRule.nome,
            incident_id: currentIncidentId,
            incident_number: incidentNumber,
            alert_number: alertNumber
          });
          
          if (testMode) break;
        } else if (currentStatus !== 'offline' && !testMode) {
          await supabase.from('devices').update({ status: 'offline' }).eq('id', device.id);
        }
      }

      // ========== DEVICE CAME BACK ONLINE ==========
      if (!testMode && currentStatus === 'offline' && !isOffline && lastOnline) {
        console.log(`🟢 [MONITOR] Device VOLTOU ONLINE: ${device.name}`);
        backOnlineDetected++;

        if (isShutdownPeriod) continue;

        const notifyOnlineRules = alertRules.filter(r => r.notificar_quando_online);
        const wasAlerted = metadata.triggered_rules && metadata.triggered_rules.length > 0;
        const incidentId = metadata.current_incident_id;
        const incidentNum = metadata.incident_number;

        // Reset ALL metadata including pause
        const cleanMetadata: DeviceMetadata = {
          ...metadata,
          last_offline_alert_at: undefined,
          offline_alert_count: 0,
          triggered_rules: [],
          last_rule_id: undefined,
          current_incident_id: undefined,
          notifications_paused_until: undefined,
          paused_by: undefined
        };

        await supabase
          .from('devices')
          .update({ status: 'online', metadata: cleanMetadata })
          .eq('id', device.id);

        if (wasAlerted && notifyOnlineRules.length > 0) {
          const lastRuleName = metadata.last_rule_id 
            ? alertRules.find(r => r.id === metadata.last_rule_id)?.nome || 'Alerta'
            : 'Alerta';

          const message = `🟢 *PAINEL ONLINE*\n\n` +
            `📍 ${device.condominio_name || device.name}\n` +
            `🖥️ ${device.name}\n` +
            `✅ Voltou online às ${brazilTime}\n` +
            (incidentNum ? `📌 Ocorrência #${incidentNum} encerrada` : '');

          for (const recipient of recipients) {
            await sendWhatsApp(recipient.telefone, message, false);
          }

          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: device.id,
            device_name: device.name,
            tipo: 'online',
            mensagem: `Voltou online - Ocorrência #${incidentNum} encerrada`,
            tempo_offline_minutos: 0,
            destinatarios_notificados: recipients.map(r => r.telefone),
            incident_id: incidentId,
            incident_number: incidentNum
          });
        }
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      total_devices: devices?.length || 0,
      active_rules: alertRules.length,
      offline_detected: offlineDetected,
      back_online_detected: backOnlineDetected,
      alerts_sent: alertsSent,
      monitoring_active: true,
      test_mode: testMode
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
