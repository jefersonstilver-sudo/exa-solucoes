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
    console.log('[SYNC-ANYDESK] 🚀 Starting AnyDesk synchronization...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const licenseId = Deno.env.get('ANYDESK_LICENSE_ID');
    const apiPassword = Deno.env.get('ANYDESK_API_PASSWORD');

    if (!licenseId || !apiPassword) {
      throw new Error('AnyDesk credentials not configured');
    }

    // Gerar token HMAC-SHA1 usando Web Crypto API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiPassword);
    const messageData = encoder.encode(licenseId + timestamp);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const token = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('[SYNC-ANYDESK] 🔑 Authentication token generated');

    // Buscar clientes do AnyDesk
    const anydeskUrl = `https://my.anydesk.com/api/v1/clients`;
    const response = await fetch(anydeskUrl, {
      method: 'GET',
      headers: {
        'X-API-License': licenseId,
        'X-API-Timestamp': timestamp,
        'X-API-Token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SYNC-ANYDESK] ❌ API Error:', errorText);
      throw new Error(`AnyDesk API error: ${response.status} - ${errorText}`);
    }

    const anydeskData = await response.json();
    const clients = anydeskData.clients || [];
    
    console.log(`[SYNC-ANYDESK] 📋 Found ${clients.length} clients from AnyDesk API`);

    let devicesUpdated = 0;
    let devicesCreated = 0;
    let statusChanges = 0;
    const errors: string[] = [];

    // Processar cada cliente
    for (const client of clients) {
      try {
        const anydeskId = client.cid;
        const hostname = client.alias || client.cid;
        const status = client.online ? 'online' : 'offline';

        // Buscar dispositivo existente
        const { data: existingDevice } = await supabase
          .from('devices')
          .select('*')
          .eq('anydesk_id', anydeskId)
          .maybeSingle();

        const deviceData = {
          anydesk_id: anydeskId,
          hostname: hostname,
          status: status,
          last_online: client.online ? new Date().toISOString() : existingDevice?.last_online,
          ip_public: client.remote_address || null,
          os: client.os || null,
          version: client.version || null,
          comment: client.comment || null,
          platform: client.platform || null,
          client_version: client.client_version || null,
          metadata: {
            license: client.license,
            last_sync: new Date().toISOString(),
          },
        };

        if (existingDevice) {
          // Detectar mudança de status
          const statusChanged = existingDevice.status !== status;

          // Atualizar dispositivo
          const { error: updateError } = await supabase
            .from('devices')
            .update(deviceData)
            .eq('id', existingDevice.id);

          if (updateError) {
            console.error(`[SYNC-ANYDESK] ❌ Error updating ${anydeskId}:`, updateError);
            errors.push(`Update error for ${anydeskId}`);
            continue;
          }

          devicesUpdated++;

          if (statusChanged) {
            statusChanges++;
            console.log(`[SYNC-ANYDESK] 🔄 Status changed for ${hostname}: ${existingDevice.status} → ${status}`);

            // Registrar evento
            await supabase.from('events_log').insert({
              computer_id: existingDevice.id,
              event_type: 'status_change',
              old_status: existingDevice.status,
              new_status: status,
              description: `Status changed from ${existingDevice.status} to ${status}`,
              metadata: { timestamp: new Date().toISOString() },
            });

            // Atualizar connection_history
            if (status === 'offline') {
              // Finalizar período online anterior
              const { data: lastConnection } = await supabase
                .from('connection_history')
                .select('*')
                .eq('computer_id', existingDevice.id)
                .eq('event_type', 'online')
                .is('ended_at', null)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (lastConnection) {
                const duration = Math.floor((Date.now() - new Date(lastConnection.started_at).getTime()) / 1000);
                await supabase
                  .from('connection_history')
                  .update({
                    ended_at: new Date().toISOString(),
                    duration_seconds: duration,
                  })
                  .eq('id', lastConnection.id);
              }

              // Iniciar novo período offline
              await supabase.from('connection_history').insert({
                computer_id: existingDevice.id,
                event_type: 'offline',
                started_at: new Date().toISOString(),
              });

              // Criar alerta se configurado
              if (existingDevice.alert_enabled) {
                await supabase.from('computer_alerts').insert({
                  computer_id: existingDevice.id,
                  alert_type: 'offline',
                  message: `${hostname} went offline`,
                });
              }
            } else {
              // Finalizar período offline anterior
              const { data: lastConnection } = await supabase
                .from('connection_history')
                .select('*')
                .eq('computer_id', existingDevice.id)
                .eq('event_type', 'offline')
                .is('ended_at', null)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (lastConnection) {
                const duration = Math.floor((Date.now() - new Date(lastConnection.started_at).getTime()) / 1000);
                await supabase
                  .from('connection_history')
                  .update({
                    ended_at: new Date().toISOString(),
                    duration_seconds: duration,
                  })
                  .eq('id', lastConnection.id);

                // Resolver alerta se existir
                await supabase
                  .from('computer_alerts')
                  .update({ resolved_at: new Date().toISOString() })
                  .eq('computer_id', existingDevice.id)
                  .is('resolved_at', null);
              }

              // Iniciar novo período online
              await supabase.from('connection_history').insert({
                computer_id: existingDevice.id,
                event_type: 'online',
                started_at: new Date().toISOString(),
              });
            }
          }
        } else {
          // Criar novo dispositivo
          const { data: newDevice, error: insertError } = await supabase
            .from('devices')
            .insert(deviceData)
            .select()
            .single();

          if (insertError) {
            console.error(`[SYNC-ANYDESK] ❌ Error creating ${anydeskId}:`, insertError);
            errors.push(`Insert error for ${anydeskId}`);
            continue;
          }

          devicesCreated++;
          console.log(`[SYNC-ANYDESK] ✅ Created new device: ${hostname}`);

          // Registrar evento de primeira sincronização
          await supabase.from('events_log').insert({
            computer_id: newDevice.id,
            event_type: 'first_sync',
            new_status: status,
            description: `Device first synced with status: ${status}`,
          });

          // Criar histórico inicial
          await supabase.from('connection_history').insert({
            computer_id: newDevice.id,
            event_type: status,
            started_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`[SYNC-ANYDESK] ❌ Error processing client ${client.cid}:`, error);
        errors.push(`Processing error for ${client.cid}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_clients: clients.length,
        devices_updated: devicesUpdated,
        devices_created: devicesCreated,
        status_changes: statusChanges,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[SYNC-ANYDESK] ✅ Synchronization completed:', result.summary);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SYNC-ANYDESK] 💥 Critical error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});