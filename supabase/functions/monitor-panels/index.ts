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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 [MONITOR] Iniciando verificação de painéis (devices)...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get all active alert rules ordered by threshold
    const { data: alertRules, error: rulesError } = await supabase
      .from('panel_offline_alert_rules')
      .select('*')
      .eq('ativo', true)
      .order('tempo_offline_segundos', { ascending: true });

    if (rulesError) {
      console.error('❌ [MONITOR] Erro ao buscar regras:', rulesError);
      throw rulesError;
    }

    if (!alertRules || alertRules.length === 0) {
      console.log('⏸️ [MONITOR] Nenhuma regra de alerta ativa');
      return new Response(JSON.stringify({ message: 'Sem regras ativas' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`📋 [MONITOR] ${alertRules.length} regra(s) de alerta ativa(s)`);

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
      console.error('❌ [MONITOR] Z-API config não encontrada para exa_alert');
      return new Response(JSON.stringify({ error: 'Z-API não configurado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const zapiConfig = agent.zapi_config as { instance_id: string; token: string; client_token?: string };

    // 4. Get all active devices with building data for address/provider
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select(`
        *,
        buildings:building_id (
          endereco,
          bairro,
          notion_internet
        )
      `)
      .eq('is_active', true);

    if (devicesError) {
      console.error('❌ [MONITOR] Erro ao buscar devices:', devicesError);
      throw devicesError;
    }

    console.log(`📊 [MONITOR] Analisando ${devices?.length || 0} devices ativos...`);

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

    console.log(`📋 [MONITOR] ${confirmButtons?.length || 0} botões de confirmação ativos`);

    // Helper to send WhatsApp message with optional buttons
    const sendWhatsApp = async (phone: string, message: string, withButtons: boolean = false, deviceInfo?: { id: string; name: string }): Promise<{ success: boolean; messageId?: string }> => {
      try {
        // Ensure phone has country code
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55') && formattedPhone.length === 11) {
          formattedPhone = '55' + formattedPhone;
        }

        console.log(`📱 [MONITOR] Enviando para ${formattedPhone}...`);

        const headers: Record<string, string> = { 
          'Content-Type': 'application/json'
        };

        // Add Client-Token if available (CRITICAL for Z-API auth!)
        if (zapiClientToken) {
          headers['Client-Token'] = zapiClientToken;
        } else if (zapiConfig.client_token) {
          headers['Client-Token'] = zapiConfig.client_token;
        }

        // If buttons are enabled and we have buttons, use button-actions endpoint
        if (withButtons && confirmButtons && confirmButtons.length > 0) {
          const buttonActions = confirmButtons.map((btn) => ({
            id: btn.id,
            type: 'REPLY',
            label: `${btn.emoji || '✅'} ${btn.label}`
          }));

          const response = await fetch(
            `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-button-actions`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ 
                phone: formattedPhone, 
                message,
                buttonActions,
                footer: 'Clique para confirmar'
              })
            }
          );

          const result = await response.json();
          console.log(`📱 [MONITOR] Z-API button response:`, result);

          if (result.error) {
            console.error(`❌ [MONITOR] Z-API error:`, result.error);
            return { success: false };
          }
          return { success: true, messageId: result.messageId };
        }

        // Regular text message (fallback or online notifications)
        const response = await fetch(
          `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone: formattedPhone, message })
          }
        );

        const result = await response.json();
        console.log(`📱 [MONITOR] Z-API response:`, result);

        if (result.error) {
          console.error(`❌ [MONITOR] Z-API error:`, result.error);
          return { success: false };
        }
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

      // Find which rule applies based on offline duration
      const applicableRule = alertRules
        .filter(r => offlineSeconds >= r.tempo_offline_segundos)
        .sort((a, b) => b.tempo_offline_segundos - a.tempo_offline_segundos)[0];

      const isOffline = applicableRule !== undefined;

      // ========== DETECT: DEVICE WENT OFFLINE ==========
      if (isOffline) {
        console.log(`🔴 [MONITOR] Device ${device.name}: offline há ${formatOfflineDuration(timeSinceLastOnline)}, regra aplicável: ${applicableRule?.nome || 'nenhuma'}`);
        offlineDetected++;

        const triggeredRules = metadata.triggered_rules || [];
        const alreadyTriggeredThisRule = triggeredRules.includes(applicableRule.id);
        const lastAlertAt = metadata.last_offline_alert_at ? new Date(metadata.last_offline_alert_at) : null;

        // Determine if we should send alert
        let shouldSendAlert = false;
        let isRepeatAlert = false;

        if (!alreadyTriggeredThisRule) {
          // First time this rule is triggered
          shouldSendAlert = true;
          console.log(`🔔 [MONITOR] Primeira vez que regra "${applicableRule.nome}" é acionada para ${device.name}`);
        } else if (applicableRule.repetir_ate_resolver) {
          // Check if enough time passed for repeat using last_offline_alert_at
          if (lastAlertAt) {
            const timeSinceLastAlert = now.getTime() - lastAlertAt.getTime();
            const intervaloMs = applicableRule.intervalo_repeticao_segundos * 1000;
            
            console.log(`⏱️ [MONITOR] Device ${device.name}: tempo desde último alerta = ${Math.round(timeSinceLastAlert/1000)}s, intervalo configurado = ${applicableRule.intervalo_repeticao_segundos}s`);
            
            if (timeSinceLastAlert >= intervaloMs) {
              shouldSendAlert = true;
              isRepeatAlert = true;
              console.log(`🔔 [MONITOR] Repetindo alerta da regra "${applicableRule.nome}" para ${device.name} (passou ${Math.round(timeSinceLastAlert/1000)}s >= ${applicableRule.intervalo_repeticao_segundos}s)`);
            } else {
              console.log(`⏸️ [MONITOR] Aguardando intervalo para repetir alerta: faltam ${Math.round((intervaloMs - timeSinceLastAlert)/1000)}s`);
            }
          } else {
            // No last alert recorded but rule already triggered - send alert
            shouldSendAlert = true;
            isRepeatAlert = true;
            console.log(`🔔 [MONITOR] Repetindo alerta (sem last_offline_alert_at registrado)`);
          }
        }

        if (shouldSendAlert) {
          const alertCount = (metadata.offline_alert_count || 0) + 1;
          const offlineDisplay = formatOfflineDuration(timeSinceLastOnline);

          // Build message with rule info including address and provider
          const emoji = applicableRule.tempo_offline_segundos >= 1800 ? '🚨' : 
                        applicableRule.tempo_offline_segundos >= 300 ? '⚠️' : '🔴';
          
          // Get address and provider from device or building
          const buildingData = (device as any).buildings;
          const endereco = device.address || buildingData?.endereco || '';
          const bairro = buildingData?.bairro || '';
          const provedor = device.provider || buildingData?.notion_internet || '';
          
          // Build address line
          const enderecoLine = endereco 
            ? `🏠 Endereço: ${endereco}${bairro ? `, ${bairro}` : ''}\n` 
            : '';
          const provedorLine = provedor 
            ? `🌐 Provedor: ${provedor}\n` 
            : '';
          
          const message = `${emoji} *${applicableRule.nome.toUpperCase()}*\n\n` +
            `📍 Local: ${device.condominio_name || device.name}\n` +
            enderecoLine +
            `🖥️ Painel: ${device.name}\n` +
            provedorLine +
            `⏱️ Offline há: ${offlineDisplay}\n` +
            `📅 Detectado às: ${now.toLocaleTimeString('pt-BR')}\n` +
            (isRepeatAlert ? `\n🔄 Este é o ${alertCount}º aviso` : '');

          // Send to all recipients with buttons
          const sentRecipients: Array<{ phone: string; name: string; messageId?: string }> = [];
          for (const recipient of recipients) {
            const result = await sendWhatsApp(recipient.telefone, message, true, { id: device.id, name: device.name });
            if (result.success) {
              alertsSent++;
              sentRecipients.push({
                phone: recipient.telefone,
                name: recipient.nome,
                messageId: result.messageId
              });
            }
          }

          // Update device metadata
          const newTriggeredRules = [...triggeredRules];
          if (!newTriggeredRules.includes(applicableRule.id)) {
            newTriggeredRules.push(applicableRule.id);
          }

          const newMetadata: DeviceMetadata = {
            ...metadata,
            last_offline_alert_at: now.toISOString(),
            offline_alert_count: alertCount,
            triggered_rules: newTriggeredRules,
            last_rule_id: applicableRule.id
          };

          await supabase
            .from('devices')
            .update({ 
              status: 'offline',
              metadata: newMetadata
            })
            .eq('id', device.id);

          // Log alert with recipients info for confirmation tracking
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: device.id,
            device_name: device.name,
            tipo: 'offline',
            mensagem: `Device ${device.name} offline há ${offlineDisplay} (regra: ${applicableRule.nome})`,
            tempo_offline_minutos: Math.round(timeSinceLastOnline / 60000),
            destinatarios_notificados: recipients.map(r => r.telefone),
            recipients: sentRecipients,
            regra_id: applicableRule.id,
            regra_nome: applicableRule.nome
          });
        } else if (currentStatus !== 'offline') {
          // Just update status without sending alert
          await supabase
            .from('devices')
            .update({ status: 'offline' })
            .eq('id', device.id);
        }
      }

      // ========== DETECT: DEVICE CAME BACK ONLINE ==========
      if (currentStatus === 'offline' && !isOffline && lastOnline) {
        console.log(`🟢 [MONITOR] Device VOLTOU ONLINE: ${device.name}`);
        backOnlineDetected++;

        // Find any rule that wants online notification
        const notifyOnlineRules = alertRules.filter(r => r.notificar_quando_online);
        const wasAlerted = metadata.triggered_rules && metadata.triggered_rules.length > 0;

        // Reset metadata
        const newMetadata: DeviceMetadata = {
          ...metadata,
          last_offline_alert_at: undefined,
          offline_alert_count: 0,
          triggered_rules: [],
          last_rule_id: undefined
        };

        await supabase
          .from('devices')
          .update({ 
            status: 'online',
            metadata: newMetadata
          })
          .eq('id', device.id);

        // Send online notification if was previously alerted
        if (wasAlerted && notifyOnlineRules.length > 0) {
          const lastRuleName = metadata.last_rule_id 
            ? alertRules.find(r => r.id === metadata.last_rule_id)?.nome || 'Alerta'
            : 'Alerta';

          const message = `🟢 *PAINEL ONLINE*\n\n` +
            `📍 Local: ${device.condominio_name || device.name}\n` +
            `🖥️ Painel: ${device.name}\n` +
            `✅ Voltou online às: ${now.toLocaleTimeString('pt-BR')}\n` +
            `📊 Último alerta: ${lastRuleName}`;

          for (const recipient of recipients) {
            await sendWhatsApp(recipient.telefone, message, false);
          }

          // Log online event
          await supabase.from('panel_offline_alerts_history').insert({
            painel_id: device.id,
            tipo: 'online',
            mensagem: `Device ${device.name} voltou online`,
            tempo_offline_minutos: 0,
            destinatarios_notificados: recipients.map(r => r.telefone)
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
