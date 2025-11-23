import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect provider from text
function detectProvider(text: string): string {
  const upperText = text.toUpperCase();
  if (upperText.includes('LIGGA')) return 'LIGGA';
  if (upperText.includes('TELECOM FOZ') || upperText.includes('TELECOMFOZ')) return 'TELECOM FOZ';
  if (upperText.includes('VIVO')) return 'VIVO';
  return 'Sem provedor';
}

// Extract address from text
function extractAddress(text: string): string | null {
  const addressPattern = /(Rua|Av\.|Avenida|R\.|Travessa|Alameda)\s+[^,]+,?\s*\d*[^,]*/i;
  const match = text.match(addressPattern);
  return match ? match[0].trim() : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SYNC-ANYDESK] 🚀 Starting enhanced AnyDesk synchronization...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const licenseId = Deno.env.get('ANYDESK_LICENSE_ID');
    const apiPassword = Deno.env.get('ANYDESK_API_PASSWORD');

    if (!licenseId || !apiPassword) {
      throw new Error('AnyDesk credentials not configured');
    }

    // Generate auth token
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const resource = '/clients';
    const method = 'GET';
    const content = '';
    
    const encoder = new TextEncoder();
    const contentData = encoder.encode(content);
    const contentHashBuffer = await crypto.subtle.digest('SHA-1', contentData);
    const contentHash = btoa(String.fromCharCode(...new Uint8Array(contentHashBuffer)));
    
    const requestString = `${method}\n${resource}\n${timestamp}\n${contentHash}`;
    const keyData = encoder.encode(apiPassword);
    const messageData = encoder.encode(requestString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const token = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const authHeader = `AD ${licenseId}:${timestamp}:${token}`;

    console.log('[SYNC-ANYDESK] 🔑 Authentication token generated');

    // Fetch clients
    const anydeskUrl = `https://v1.api.anydesk.com:8081/clients`;
    const response = await fetch(anydeskUrl, {
      method: 'GET',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SYNC-ANYDESK] ❌ API Error:', errorText);
      throw new Error(`AnyDesk API error: ${response.status} - ${errorText}`);
    }

    const anydeskData = await response.json();
    const clients = anydeskData.list || [];
    
    console.log(`[SYNC-ANYDESK] 📋 Found ${clients.length} clients from AnyDesk API`);

    let devicesUpdated = 0, devicesCreated = 0, statusChanges = 0, providerDetections = 0;
    const errors: string[] = [];

    for (const client of clients) {
      try {
        const anydeskId = client.cid;
        const alias = client.alias || client.cid;
        const comment = client.comment || '';
        const label = client.label || '';
        const status = client.online ? 'online' : 'offline';
        
        // Extract data from all text fields
        const allText = `${alias} ${comment} ${label}`;
        const provider = detectProvider(allText);
        const address = extractAddress(allText) || 'Sem endereço';
        const tags = client.tags || [];
        const panelName = comment || alias;

        const { data: existingDevice } = await supabase
          .from('devices')
          .select('*')
          .eq('anydesk_client_id', anydeskId)
          .maybeSingle();

        const deviceData = {
          anydesk_client_id: anydeskId,
          name: panelName,
          status: status,
          last_online_at: client.online ? new Date().toISOString() : existingDevice?.last_online_at,
          condominio_name: existingDevice?.condominio_name || 'Não especificado',
          tags: tags,
          comments: comment,
          provider: provider,
          address: address,
          metadata: { alias, label, online_time: client['online-time'] },
        };

        if (existingDevice) {
          const statusChanged = existingDevice.status !== status;
          const providerChanged = existingDevice.provider !== provider && provider !== 'Sem provedor';

          const { error: updateError } = await supabase
            .from('devices')
            .update(deviceData)
            .eq('id', existingDevice.id);

          if (updateError) {
            errors.push(`Update error for ${anydeskId}`);
            continue;
          }

          devicesUpdated++;

          // Provider detection alert
          if (providerChanged) {
            providerDetections++;
            await supabase.from('provider_alerts').insert({
              computer_id: existingDevice.id,
              old_provider: existingDevice.provider,
              new_provider: provider,
            });
          }

          if (statusChanged) {
            statusChanges++;
            
            await supabase.from('devices').update({
              total_events: (existingDevice.total_events || 0) + 1,
              offline_count: status === 'offline' ? (existingDevice.offline_count || 0) + 1 : existingDevice.offline_count,
            }).eq('id', existingDevice.id);

            await supabase.from('events_log').insert({
              computer_id: existingDevice.id,
              event_type: 'status_change',
              old_status: existingDevice.status,
              new_status: status,
              description: `Status changed from ${existingDevice.status} to ${status}`,
              metadata: { timestamp: new Date().toISOString(), provider, address },
            });

            if (status === 'offline') {
              const { data: lastOnline } = await supabase
                .from('connection_history')
                .select('*')
                .eq('computer_id', existingDevice.id)
                .eq('event_type', 'online')
                .is('ended_at', null)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (lastOnline) {
                const duration = Math.floor((Date.now() - new Date(lastOnline.started_at).getTime()) / 1000);
                await supabase.from('connection_history')
                  .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
                  .eq('id', lastOnline.id);
              }

              await supabase.from('connection_history').insert({
                computer_id: existingDevice.id,
                event_type: 'offline',
                started_at: new Date().toISOString(),
              });
            } else {
              const { data: lastOffline } = await supabase
                .from('connection_history')
                .select('*')
                .eq('computer_id', existingDevice.id)
                .eq('event_type', 'offline')
                .is('ended_at', null)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (lastOffline) {
                const duration = Math.floor((Date.now() - new Date(lastOffline.started_at).getTime()) / 1000);
                await supabase.from('connection_history')
                  .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
                  .eq('id', lastOffline.id);
              }

              await supabase.from('connection_history').insert({
                computer_id: existingDevice.id,
                event_type: 'online',
                started_at: new Date().toISOString(),
              });
            }
          }
        } else {
          const { data: newDevice, error: insertError } = await supabase
            .from('devices')
            .insert(deviceData)
            .select()
            .single();

          if (insertError) {
            errors.push(`Insert error for ${anydeskId}`);
            continue;
          }

          devicesCreated++;

          await supabase.from('events_log').insert({
            computer_id: newDevice.id,
            event_type: 'first_sync',
            new_status: status,
            description: `Device first synced with status: ${status}`,
          });

          await supabase.from('connection_history').insert({
            computer_id: newDevice.id,
            event_type: status,
            started_at: new Date().toISOString(),
          });

          if (provider !== 'Sem provedor') {
            providerDetections++;
            await supabase.from('provider_alerts').insert({
              computer_id: newDevice.id,
              new_provider: provider,
            });
          }
        }
      } catch (error) {
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
        provider_detections: providerDetections,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('[SYNC-ANYDESK] ✅ Enhanced synchronization completed:', result.summary);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SYNC-ANYDESK] 💥 Critical error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, timestamp: new Date().toISOString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
