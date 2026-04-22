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

interface GlobalAlertState {
  last_storm_detected_at?: string;
  storm_cooldown_until?: string;
  alerts_last_5_min?: number;
  last_alert_count_reset?: string;
}

interface DeviceAlertConfig {
  device_id: string;
  alerts_enabled: boolean;
  offline_threshold_minutes: number | null;
}

// ==================== PROTECTION CONSTANTS ====================
const MASS_OFFLINE_THRESHOLD_PERCENT = 0.7; // 70% devices offline = mass failure
const MIN_DEVICES_FOR_MASS_CHECK = 5; // Only check mass failure if >= 5 devices
const MAX_ALERTS_PER_DEVICE_PER_HOUR = 6; // Max 6 alerts per device per hour
const MIN_SECONDS_BETWEEN_DEVICE_ALERTS = 180; // Min 3 minutes between alerts for same device
const GLOBAL_ALERT_STORM_THRESHOLD = 30; // If 30+ alerts in 5 min, trigger storm protection
const STORM_COOLDOWN_MINUTES = 15; // Pause all alerts for 15 min after storm

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

// Helper to log to history table with correct columns ONLY
const logToHistory = async (
  supabase: any,
  data: {
    painel_id: string | null;
    tipo: string;
    mensagem: string;
    tempo_offline_minutos: number;
    destinatarios_notificados: string[];
    regra_id?: string | null;
    regra_nome?: string | null;
    incident_id?: string | null;
    incident_number?: number | null;
    alert_number?: number | null;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('panel_offline_alerts_history').insert({
      painel_id: data.painel_id,
      tipo: data.tipo,
      mensagem: data.mensagem,
      tempo_offline_minutos: data.tempo_offline_minutos,
      destinatarios_notificados: data.destinatarios_notificados,
      regra_id: data.regra_id || null,
      regra_nome: data.regra_nome || null,
      incident_id: data.incident_id || null,
      incident_number: data.incident_number || null,
      alert_number: data.alert_number || null
    });
    
    if (error) {
      console.error('❌ [MONITOR] Erro ao gravar histórico:', error.message, JSON.stringify(data));
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ [MONITOR] Exceção ao gravar histórico:', err);
    return false;
  }
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
    
    console.log(`🤖 [MONITOR] Iniciando verificação ${testMode ? '(MODO TESTE)' : ''} - Horário BRT: ${brazilTime}${isShutdownPeriod ? ' [PERÍODO PROGRAMADO 1h-6h]' : ''}...`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ==================== GLOBAL STATE CHECK ====================
    const { data: globalState } = await supabase
      .from('agent_context')
      .select('*')
      .eq('key', 'monitor_panels_state')
      .single();
    
    const state: GlobalAlertState = (globalState?.value as GlobalAlertState) || {};
    const now = new Date();
    
    // Check storm cooldown
    if (state.storm_cooldown_until && !testMode) {
      const cooldownEnd = new Date(state.storm_cooldown_until);
      if (now < cooldownEnd) {
        const remainingMin = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 60000);
        console.log(`⛔ [MONITOR] Sistema em COOLDOWN após tempestade de alertas. Restam ${remainingMin} minutos.`);
        return new Response(JSON.stringify({ 
          message: 'Em cooldown após tempestade de alertas',
          cooldown_remaining_minutes: remainingMin 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }

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
      .select(`*, device_group_id, buildings:building_id (endereco, bairro, notion_internet, status)`)
      .eq('is_active', true);

    if (devicesError) throw devicesError;

    // 4.0.1 Load device groups (for silenciar_alertas check)
    const { data: deviceGroups } = await supabase
      .from('device_groups')
      .select('id, nome, silenciar_alertas');

    const deviceGroupsMap = new Map<string, { id: string; nome: string; silenciar_alertas: boolean }>(
      (deviceGroups || []).map((g: any) => [g.id, g])
    );

    // 4.1 Get device alert configs (alerts_enabled AND offline_threshold_minutes)
    const { data: alertConfigs } = await supabase
      .from('device_alert_configs')
      .select('device_id, alerts_enabled, offline_threshold_minutes');

    const alertConfigsMap = new Map<string, DeviceAlertConfig>(
      (alertConfigs || []).map((c: DeviceAlertConfig) => [c.device_id, c])
    );

    console.log(`📊 [MONITOR] Analisando ${devices?.length || 0} devices (${alertConfigs?.length || 0} com config de alertas, ${deviceGroups?.length || 0} grupos)...`);

    // ==================== MASS OFFLINE DETECTION ====================
    const totalDevices = devices?.length || 0;
    const offlineDevices = devices?.filter(d => d.status === 'offline') || [];
    const offlineCount = offlineDevices.length;
    const offlinePercent = totalDevices > 0 ? offlineCount / totalDevices : 0;

    if (totalDevices >= MIN_DEVICES_FOR_MASS_CHECK && offlinePercent >= MASS_OFFLINE_THRESHOLD_PERCENT && !testMode) {
      console.log(`⚠️ [MONITOR] QUEDA MASSIVA DETECTADA: ${offlineCount}/${totalDevices} devices offline (${Math.round(offlinePercent * 100)}%)`);
      console.log(`⚠️ [MONITOR] Provavelmente falha de infraestrutura/API - ALERTAS SUSPENSOS`);
      
      await logToHistory(supabase, {
        painel_id: null,
        tipo: 'queda_massiva',
        mensagem: `Queda massiva detectada: ${offlineCount}/${totalDevices} devices (${Math.round(offlinePercent * 100)}%) - Alertas suspensos`,
        tempo_offline_minutos: 0,
        destinatarios_notificados: [],
        regra_nome: 'PROTEÇÃO ANTI-FALSO-POSITIVO'
      });

      return new Response(JSON.stringify({ 
        message: 'Queda massiva detectada - alertas suspensos',
        offline_count: offlineCount,
        total_devices: totalDevices,
        offline_percent: Math.round(offlinePercent * 100)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    let offlineDetected = 0;
    let backOnlineDetected = 0;
    let alertsSent = 0;
    let alertsBlockedByRateLimit = 0;
    let alertsBlockedByThreshold = 0;

    // Get confirmation buttons
    const { data: confirmButtons } = await supabase
      .from('panel_offline_alert_buttons')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    // Helper to send WhatsApp
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

    // ==================== CHECK PER-DEVICE RATE LIMITS ====================
    const checkDeviceRateLimit = (metadata: DeviceMetadata): { allowed: boolean; reason?: string } => {
      const lastAlertAt = metadata.last_offline_alert_at ? new Date(metadata.last_offline_alert_at) : null;
      const alertCount = metadata.offline_alert_count || 0;

      // Check minimum time between alerts
      if (lastAlertAt) {
        const secondsSinceLastAlert = (now.getTime() - lastAlertAt.getTime()) / 1000;
        if (secondsSinceLastAlert < MIN_SECONDS_BETWEEN_DEVICE_ALERTS) {
          return { 
            allowed: false, 
            reason: `Apenas ${Math.round(secondsSinceLastAlert)}s desde último alerta (mín: ${MIN_SECONDS_BETWEEN_DEVICE_ALERTS}s)` 
          };
        }
      }

      // Check max alerts per hour
      if (alertCount >= MAX_ALERTS_PER_DEVICE_PER_HOUR && lastAlertAt) {
        const hoursSinceFirst = (now.getTime() - lastAlertAt.getTime()) / 3600000;
        if (hoursSinceFirst < 1) {
          return { 
            allowed: false, 
            reason: `Limite de ${MAX_ALERTS_PER_DEVICE_PER_HOUR} alertas/hora atingido` 
          };
        }
      }

      return { allowed: true };
    };

    for (const device of devices || []) {
      const lastOnline = device.last_online_at ? new Date(device.last_online_at) : null;
      const timeSinceLastOnline = lastOnline ? now.getTime() - lastOnline.getTime() : Infinity;
      const offlineSeconds = Math.round(timeSinceLastOnline / 1000);
      const currentStatus = device.status;
      const metadata = (device.metadata || {}) as DeviceMetadata;

      // ==================== FIX #1: ONLY CONSIDER OFFLINE IF device.status === 'offline' ====================
      // This is the CRITICAL FIX - we only alert if the device is actually marked offline by sync
      const isDeviceReallyOffline = currentStatus === 'offline';

      // ==================== BLOCK A: Group with silenciar_alertas = true ====================
      if (device.device_group_id && !testMode) {
        const grupo = deviceGroupsMap.get(device.device_group_id);
        if (grupo?.silenciar_alertas) {
          console.log(JSON.stringify({
            type: 'BLOQUEIO_ALERTA', motivo: 'grupo_silenciado',
            device: device.name, device_id: device.id, grupo: grupo.nome,
          }));
          continue;
        }
      }

      // ==================== BLOCK B: Internal building ====================
      if (device.buildings?.status === 'interno' && !testMode) {
        console.log(JSON.stringify({
          type: 'BLOQUEIO_ALERTA', motivo: 'predio_interno',
          device: device.name, device_id: device.id,
          building_id: device.building_id, building_status: device.buildings?.status,
        }));
        continue;
      }

      // ==================== BLOCK B-2: Safety net - internal name keywords ====================
      // Bloqueia mesmo que o prédio esteja mal classificado no banco
      const NOMES_INTERNOS_PROIBIDOS = [
        'entrada', 'comercial tablet', 'sala reuniao', 'sala reunião',
        'reuniao', 'reunião', 'recepcao', 'recepção',
        'escritorio', 'escritório', 'interno', 'sala jeff',
      ];
      const nomeNormalizado = (device.name || '').toLowerCase().trim();
      const nomeProibido = NOMES_INTERNOS_PROIBIDOS.find(n => nomeNormalizado.includes(n));
      if (nomeProibido && !testMode) {
        console.log(JSON.stringify({
          type: 'BLOQUEIO_ALERTA', motivo: 'nome_interno_safety_net',
          device: device.name, device_id: device.id, palavra_detectada: nomeProibido,
          building_status: device.buildings?.status,
        }));
        continue;
      }

      // ==================== BLOCK C: Orphan device (no building AND no group) ====================
      if (!device.building_id && !device.device_group_id && !testMode) {
        console.log(JSON.stringify({
          type: 'BLOQUEIO_ALERTA', motivo: 'orfao_sem_grupo',
          device: device.name, device_id: device.id,
        }));
        continue;
      }

      // ==================== BLOCK D: Device has no building (orphan with group but unassigned) ====================
      // Painel sem prédio nunca deve disparar alerta — não há contexto para notificar
      if (!device.building_id && !testMode) {
        console.log(JSON.stringify({
          type: 'BLOQUEIO_ALERTA', motivo: 'sem_predio',
          device: device.name, device_id: device.id,
          device_group_id: device.device_group_id,
        }));
        continue;
      }

      // CHECK: Device has alerts disabled in device_alert_configs table
      const deviceConfig = alertConfigsMap.get(device.id);
      const alertsEnabledForDevice = deviceConfig?.alerts_enabled;
      
      if (alertsEnabledForDevice === false && !testMode) {
        console.log(`⏸️ [MONITOR] Device ${device.name}: alertas desativados via configuração admin`);
        continue;
      }

      // ==================== FIX #2: RESPECT PER-DEVICE offline_threshold_minutes ====================
      // Calculate effective threshold: MAX of global rule and per-device config
      const deviceThresholdSeconds = deviceConfig?.offline_threshold_minutes 
        ? deviceConfig.offline_threshold_minutes * 60 
        : 0;

      // Find applicable rule - but ONLY if device is REALLY offline
      let applicableRule: AlertRule | undefined;
      
      if (testMode && testRuleId) {
        applicableRule = alertRules.find(r => r.id === testRuleId);
      } else if (isDeviceReallyOffline) {
        // First, get rules where global threshold is met
        const candidateRules = alertRules
          .filter(r => offlineSeconds >= r.tempo_offline_segundos)
          .sort((a, b) => b.tempo_offline_segundos - a.tempo_offline_segundos);
        
        // Now, check if effective threshold (with per-device config) is also met
        for (const rule of candidateRules) {
          const effectiveThresholdSeconds = Math.max(rule.tempo_offline_segundos, deviceThresholdSeconds);
          
          if (offlineSeconds >= effectiveThresholdSeconds) {
            applicableRule = rule;
            break;
          }
        }
        
        // If no rule met the effective threshold, log it
        if (candidateRules.length > 0 && !applicableRule && deviceThresholdSeconds > 0) {
          console.log(`⏳ [MONITOR] Device ${device.name}: offline ${offlineSeconds}s, mas threshold individual é ${deviceThresholdSeconds}s - aguardando`);
          alertsBlockedByThreshold++;
        }
      }

      const shouldProcessOffline = (applicableRule !== undefined || testMode) && (isDeviceReallyOffline || testMode);

      // ========== DEVICE IS OFFLINE ==========
      if (shouldProcessOffline && applicableRule) {
        console.log(`🔴 [MONITOR] Device ${device.name}: status=${currentStatus}, offline há ${formatOfflineDuration(timeSinceLastOnline)}${isShutdownPeriod ? ' [PERÍODO PROGRAMADO]' : ''}`);
        offlineDetected++;

        // Skip during shutdown period
        if (isShutdownPeriod && !testMode) {
          await logToHistory(supabase, {
            painel_id: device.id,
            tipo: 'programado',
            mensagem: `Período programado (1h-6h) - alerta ignorado`,
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

        // ==================== RATE LIMIT CHECK ====================
        if (!testMode) {
          const rateLimitCheck = checkDeviceRateLimit(metadata);
          if (!rateLimitCheck.allowed) {
            console.log(`🚫 [MONITOR] Device ${device.name}: RATE LIMIT - ${rateLimitCheck.reason}`);
            alertsBlockedByRateLimit++;
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
          
          // Use the LARGER of: configured interval OR minimum interval
          const effectiveIntervalMs = Math.max(intervaloMs, MIN_SECONDS_BETWEEN_DEVICE_ALERTS * 1000);
          
          if (timeSinceLastAlert >= effectiveIntervalMs) {
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

          const sentRecipients: string[] = [];
          for (const recipient of recipients) {
            const result = await sendWhatsApp(recipient.telefone, message, true, device.id);
            if (result.success) {
              alertsSent++;
              sentRecipients.push(recipient.telefone);
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
              .update({ metadata: newMetadata })
              .eq('id', device.id);
          }

          // Log alert with CORRECT columns only
          await logToHistory(supabase, {
            painel_id: device.id,
            tipo: testMode ? 'teste' : 'offline',
            mensagem: `${alertNumber}º aviso - Ocorrência #${incidentNumber} - ${device.name}`,
            tempo_offline_minutos: Math.round(timeSinceLastOnline / 60000),
            destinatarios_notificados: sentRecipients,
            regra_id: applicableRule.id,
            regra_nome: applicableRule.nome,
            incident_id: currentIncidentId,
            incident_number: incidentNumber,
            alert_number: alertNumber
          });
          
          if (testMode) break;
        }
      }

      // ========== DEVICE CAME BACK ONLINE ==========
      // Only notify if device was previously marked as offline and NOW is online
      if (!testMode && currentStatus === 'online' && metadata.triggered_rules && metadata.triggered_rules.length > 0) {
        console.log(`🟢 [MONITOR] Device VOLTOU ONLINE: ${device.name}`);
        backOnlineDetected++;

        if (isShutdownPeriod) continue;

        const notifyOnlineRules = alertRules.filter(r => r.notificar_quando_online);
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
          .update({ metadata: cleanMetadata })
          .eq('id', device.id);

        if (notifyOnlineRules.length > 0) {
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

          await logToHistory(supabase, {
            painel_id: device.id,
            tipo: 'online',
            mensagem: `Voltou online - Ocorrência #${incidentNum} encerrada - ${device.name}`,
            tempo_offline_minutos: 0,
            destinatarios_notificados: recipients.map(r => r.telefone),
            incident_id: incidentId,
            incident_number: incidentNum
          });
        }
      }
    }

    // ==================== STORM DETECTION ====================
    if (!testMode && alertsSent >= GLOBAL_ALERT_STORM_THRESHOLD) {
      console.log(`⛈️ [MONITOR] TEMPESTADE DE ALERTAS DETECTADA: ${alertsSent} alertas enviados!`);
      console.log(`⛈️ [MONITOR] Ativando cooldown de ${STORM_COOLDOWN_MINUTES} minutos`);

      const cooldownEnd = new Date(now.getTime() + STORM_COOLDOWN_MINUTES * 60000);
      
      await supabase.from('agent_context').upsert({
        key: 'monitor_panels_state',
        value: {
          last_storm_detected_at: now.toISOString(),
          storm_cooldown_until: cooldownEnd.toISOString(),
          alerts_sent_during_storm: alertsSent
        },
        updated_at: now.toISOString()
      }, { onConflict: 'key' });

      await logToHistory(supabase, {
        painel_id: null,
        tipo: 'storm_detected',
        mensagem: `Tempestade de alertas: ${alertsSent} enviados. Cooldown ativado por ${STORM_COOLDOWN_MINUTES} min`,
        tempo_offline_minutos: 0,
        destinatarios_notificados: [],
        regra_nome: 'PROTEÇÃO ANTI-TEMPESTADE'
      });
    }

    const summary = {
      timestamp: now.toISOString(),
      total_devices: devices?.length || 0,
      active_rules: alertRules.length,
      offline_detected: offlineDetected,
      back_online_detected: backOnlineDetected,
      alerts_sent: alertsSent,
      alerts_blocked_by_rate_limit: alertsBlockedByRateLimit,
      alerts_blocked_by_threshold: alertsBlockedByThreshold,
      monitoring_active: true,
      test_mode: testMode
    };

    console.log(`✅ [MONITOR] Verificação concluída:`, JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ [MONITOR] Erro:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
