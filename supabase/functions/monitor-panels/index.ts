import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Device {
  id: string;
  name: string;
  anydesk_client_id: string;
  status: 'online' | 'offline' | 'unknown';
  last_online_at: string | null;
  metadata: {
    provider?: string;
    comments?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 [MONITOR] Iniciando verificação de painéis...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar todos os dispositivos ativos
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (devicesError) {
      console.error('❌ [MONITOR] Erro ao buscar dispositivos:', devicesError);
      throw devicesError;
    }

    console.log(`📊 [MONITOR] Analisando ${devices?.length || 0} dispositivos...`);

    const now = new Date();
    const offlineThresholdMs = 5 * 60 * 1000; // 5 minutos
    let offlineDetected = 0;
    let backOnlineDetected = 0;
    const alerts = [];

    for (const device of devices || []) {
      const lastOnline = device.last_online_at ? new Date(device.last_online_at) : null;
      const timeSinceLastOnline = lastOnline ? now.getTime() - lastOnline.getTime() : Infinity;
      const isOffline = timeSinceLastOnline > offlineThresholdMs;
      const currentStatus = device.status;

      // Detectar mudança de status: online → offline
      if (currentStatus === 'online' && isOffline) {
        console.warn(`🔴 [MONITOR] Painel OFFLINE detectado: ${device.name} (${device.anydesk_client_id})`);
        offlineDetected++;

        // Atualizar status do dispositivo
        await supabase
          .from('devices')
          .update({ status: 'offline', updated_at: now.toISOString() })
          .eq('id', device.id);

        // Criar alerta
        const alert = {
          device_id: device.id,
          alert_type: 'offline',
          severity: 'high',
          message: `Painel ${device.name || device.anydesk_client_id} está offline há ${Math.round(timeSinceLastOnline / 60000)} minutos`,
          metadata: {
            device_name: device.name,
            anydesk_id: device.anydesk_client_id,
            last_online_at: device.last_online_at,
            offline_duration_ms: timeSinceLastOnline,
            provider: device.metadata?.provider,
          },
          resolved: false,
        };

        const { error: alertError } = await supabase
          .from('panel_alerts')
          .insert(alert);

        if (alertError) {
          console.error('❌ [MONITOR] Erro ao criar alerta:', alertError);
        } else {
          alerts.push(alert);
        }
      }

      // Detectar mudança de status: offline → online
      if (currentStatus === 'offline' && !isOffline) {
        console.log(`🟢 [MONITOR] Painel VOLTOU ONLINE: ${device.name} (${device.anydesk_client_id})`);
        backOnlineDetected++;

        // Atualizar status do dispositivo
        await supabase
          .from('devices')
          .update({ status: 'online', updated_at: now.toISOString() })
          .eq('id', device.id);

        // Resolver alertas anteriores
        await supabase
          .from('panel_alerts')
          .update({ 
            resolved: true, 
            resolved_at: now.toISOString(),
            resolved_by: 'system'
          })
          .eq('device_id', device.id)
          .eq('alert_type', 'offline')
          .eq('resolved', false);

        // Criar alerta de volta online
        const alert = {
          device_id: device.id,
          alert_type: 'online',
          severity: 'low',
          message: `Painel ${device.name || device.anydesk_client_id} voltou online`,
          metadata: {
            device_name: device.name,
            anydesk_id: device.anydesk_client_id,
            recovered_at: now.toISOString(),
            provider: device.metadata?.provider,
          },
          resolved: true,
          resolved_at: now.toISOString(),
          resolved_by: 'system',
        };

        await supabase.from('panel_alerts').insert(alert);
        alerts.push(alert);
      }
    }

    // 3. Buscar configuração de alertas
    const { data: config } = await supabase
      .from('panel_monitoring_config')
      .select('*')
      .limit(1)
      .single();

    // 4. Enviar notificações se configurado
    if (config?.alert_email && offlineDetected > 0) {
      console.log(`📧 [MONITOR] Enviando notificação para: ${config.alert_email}`);
      // TODO: Implementar envio de email via edge function dedicada
    }

    const summary = {
      timestamp: now.toISOString(),
      total_devices: devices?.length || 0,
      offline_detected: offlineDetected,
      back_online_detected: backOnlineDetected,
      alerts_created: alerts.length,
      monitoring_active: true,
    };

    console.log('✅ [MONITOR] Verificação concluída:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ [MONITOR] Erro crítico:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        monitoring_active: false,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});