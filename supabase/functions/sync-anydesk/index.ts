import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parser inteligente para extrair informações estruturadas do comments
interface ParsedComments {
  buildingName: string;
  provider: string;
  address: string;
  parseMethod: 'structured' | 'fallback' | 'minimal';
}

function parseComments(comments: string, tags: string[]): ParsedComments {
  console.log(`[PARSER] 🔍 Parsing comments: "${comments}"`);
  
  // Tenta parsing estruturado: "NOME - PROVEDOR - ENDEREÇO"
  const structuredPattern = /^([^-]+)\s*-\s*([^-]+)\s*-\s*(.+)$/;
  const match = comments.match(structuredPattern);
  
  if (match) {
    const buildingName = match[1].trim();
    const providerPart = match[2].trim().toUpperCase();
    const addressPart = match[3].trim();
    
    // Valida se o provedor é conhecido
    const knownProviders = ['LIGGA', 'VIVO', 'CLARO', 'TIM', 'OI', 'TELECOM FOZ', 'TELECOMFOZ'];
    const detectedProvider = knownProviders.find(p => providerPart.includes(p)) || providerPart;
    
    console.log(`[PARSER] ✅ Structured parsing successful:`, {
      buildingName,
      provider: detectedProvider,
      address: addressPart,
    });
    
    return {
      buildingName,
      provider: detectedProvider,
      address: addressPart,
      parseMethod: 'structured',
    };
  }
  
  // Fallback: tenta detectar provedor e endereço no texto completo
  console.log(`[PARSER] ⚠️ Structured parsing failed, trying fallback...`);
  
  const allText = [...tags, comments].join(' ');
  const upperText = allText.toUpperCase();
  
  // Detecta provedor
  let provider = 'Sem provedor';
  if (upperText.includes('LIGGA')) provider = 'LIGGA';
  else if (upperText.includes('TELECOM FOZ') || upperText.includes('TELECOMFOZ')) provider = 'TELECOM FOZ';
  else if (upperText.includes('VIVO')) provider = 'VIVO';
  else if (upperText.includes('CLARO')) provider = 'CLARO';
  else if (upperText.includes('TIM')) provider = 'TIM';
  else if (upperText.includes('OI')) provider = 'OI';
  
  // Detecta endereço
  const addressPatterns = [
    /((?:Rua|Av\.|Avenida|R\.|Travessa|Alameda|Praça)\s+[^,\n]+,?\s*(?:n[°º]?\s*)?\d+[^,\n]*)/i,
    /((?:Rua|Av\.|Avenida|R\.|Travessa|Alameda|Praça)\s+[^,\n]+)/i,
  ];
  
  let address = 'Sem endereço';
  for (const pattern of addressPatterns) {
    const addressMatch = allText.match(pattern);
    if (addressMatch) {
      address = addressMatch[1].trim();
      break;
    }
  }
  
  // Nome do prédio = primeira palavra/parte antes de hífen ou texto completo
  let buildingName = comments.split(/[-,]/)[0].trim() || comments.trim();
  
  console.log(`[PARSER] 🔄 Fallback parsing result:`, {
    buildingName,
    provider,
    address,
  });
  
  return {
    buildingName,
    provider,
    address,
    parseMethod: 'fallback',
  };
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

    // Fetch clients with retry logic for HTTP/2 connection errors
    const anydeskUrl = `https://v1.api.anydesk.com:8081/clients`;
    const maxRetries = 3;
    let lastError: Error | null = null;
    let response: Response | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[SYNC-ANYDESK] 🔄 Attempt ${attempt}/${maxRetries} to fetch AnyDesk API...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        response = await fetch(anydeskUrl, {
          method: 'GET',
          headers: { 
            'Authorization': authHeader, 
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`[SYNC-ANYDESK] ✅ API request successful on attempt ${attempt}`);
          break;
        } else {
          const errorText = await response.text();
          lastError = new Error(`AnyDesk API error: ${response.status} - ${errorText}`);
          console.warn(`[SYNC-ANYDESK] ⚠️ API returned ${response.status} on attempt ${attempt}`);
        }
      } catch (fetchError) {
        lastError = fetchError;
        console.warn(`[SYNC-ANYDESK] ⚠️ Fetch error on attempt ${attempt}:`, fetchError.message);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`[SYNC-ANYDESK] ⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!response || !response.ok) {
      console.error('[SYNC-ANYDESK] ❌ All retry attempts failed:', lastError?.message);
      throw lastError || new Error('Failed to fetch AnyDesk API after all retries');
    }

    const anydeskData = await response.json();
    const clients = anydeskData.list || [];
    
    console.log(`[SYNC-ANYDESK] 📋 Found ${clients.length} clients from AnyDesk API`);

    let devicesUpdated = 0, devicesCreated = 0, statusChanges = 0, providerDetections = 0, staleRecovered = 0;
    const errors: string[] = [];

    for (const client of clients) {
      try {
        const anydeskId = client.cid;
        const alias = client.alias || client.cid;
        const comment = client.comment || '';
        const label = client.label || '';
        
        // Buscar dispositivo existente para debounce
        const { data: existingDevice } = await supabase
          .from('devices')
          .select('*')
          .eq('anydesk_client_id', anydeskId)
          .maybeSingle();
        
        // SKIP DELETED DEVICES - não sincronizar devices marcados como excluídos
        if (existingDevice?.is_deleted === true) {
          console.log(`[SYNC-ANYDESK] ⏭️ Skipping deleted device ${anydeskId} (${existingDevice?.name})`);
          continue;
        }
        
        // ============ IMPROVED DEBOUNCE LOGIC ============
        // Goal: Prevent flipflop by requiring multiple confirmations before status change
        
        const onlineTime = client['online-time'] || -1;
        const isCurrentlyOnline = client.online === true || onlineTime > 0;
        const previousStatus = existingDevice?.status || 'online';
        const currentOfflineCount = existingDevice?.consecutive_offline_count || 0;
        
        let finalStatus: string;
        let newOfflineCount: number;
        let shouldRecordStatusChange = false;
        
        if (isCurrentlyOnline) {
          // Device is currently ONLINE according to AnyDesk
          newOfflineCount = 0; // Reset counter
          
          if (previousStatus === 'offline') {
            // Transition: offline -> online (immediate, no debounce needed)
            finalStatus = 'online';
            shouldRecordStatusChange = true;
            console.log(`[SYNC-ANYDESK] 🟢 Device ${anydeskId}: CONFIRMED online (was offline)`);
          } else {
            // Already online, no change
            finalStatus = 'online';
            shouldRecordStatusChange = false;
          }
        } else {
          // Device is currently OFFLINE according to AnyDesk
          newOfflineCount = currentOfflineCount + 1;
          
          if (previousStatus === 'online') {
            // Device was online, now showing offline
            // Require 2 consecutive offline detections before confirming (≈30 seconds)
            if (newOfflineCount >= 2) {
              finalStatus = 'offline';
              shouldRecordStatusChange = true;
              newOfflineCount = 0; // Reset after confirming
              console.log(`[SYNC-ANYDESK] 🔴 Device ${anydeskId}: CONFIRMED offline after ${currentOfflineCount + 1} checks`);
            } else {
              // Not yet confirmed - keep as online
              finalStatus = 'online';
              shouldRecordStatusChange = false;
              console.log(`[SYNC-ANYDESK] ⏳ Device ${anydeskId}: Offline detection ${newOfflineCount}/2 (waiting for confirmation)`);
            }
          } else {
            // Already offline, still offline - no change needed
            finalStatus = 'offline';
            shouldRecordStatusChange = false;
            newOfflineCount = 0; // Keep counter at 0 since we're already confirmed offline
            
            // NOTE: Removed SAFETY CHECK that was causing duplicate connection_history records
            // The proper offline record should be created only during actual status transitions
            console.log(`[SYNC-ANYDESK] ℹ️ Device ${anydeskId}: Still offline, no action needed`);
          }
        }
        
        // Get tags from AnyDesk API (array of strings)
        const rawTags = Array.isArray(client.tags) ? client.tags : [];
        
        // Parse comments inteligentemente
        const parsed = parseComments(comment, rawTags);
        
        console.log(`[SYNC-ANYDESK] 📊 Device ${anydeskId}:`, {
          alias,
          anydeskOnline: client.online,
          onlineTime,
          previousStatus,
          finalStatus,
          offlineCount: newOfflineCount,
          willRecordChange: shouldRecordStatusChange,
        });

        // CRITICAL: Preserve existing metadata (especially alert-related fields) while updating AnyDesk data
        const existingMetadata = existingDevice?.metadata || {};
        const wasStale = (existingMetadata as any).stale === true;

        // Build cleaned metadata: strip stale_* flags when device returns from API
        const cleanedExistingMeta: any = { ...existingMetadata };
        if (wasStale) {
          delete cleanedExistingMeta.stale;
          delete cleanedExistingMeta.stale_reason;
          delete cleanedExistingMeta.stale_detected_at;
          delete cleanedExistingMeta.stale_since;
          delete cleanedExistingMeta.stale_last_check;
          cleanedExistingMeta.stale_recovered_at = new Date().toISOString();
          console.log(`[SYNC-ANYDESK] ♻️ Device ${anydeskId} (${parsed.buildingName}) RECUPERADO da stale list`);
        }

        const deviceData = {
          anydesk_client_id: anydeskId,
          name: parsed.buildingName,
          status: finalStatus,
          consecutive_offline_count: newOfflineCount,
          last_online_at: isCurrentlyOnline ? new Date().toISOString() : existingDevice?.last_online_at,
          condominio_name: parsed.buildingName,
          tags: rawTags,
          comments: comment,
          provider: parsed.provider,
          address: parsed.address,
          metadata: {
            // Preserve existing alert-related fields (DO NOT OVERWRITE!) — minus any cleared stale_* keys
            ...cleanedExistingMeta,
            // Update AnyDesk-specific fields
            alias,
            label,
            online_time: client['online-time'],
            raw_tags: rawTags,
            parsed_data: {
              buildingName: parsed.buildingName,
              provider: parsed.provider,
              address: parsed.address,
              parseMethod: parsed.parseMethod,
              originalComments: comment,
            },
            parsed_at: new Date().toISOString()
          },
        };

        if (existingDevice) {
          const providerChanged = existingDevice.provider !== parsed.provider && parsed.provider !== 'Sem provedor';

          const { error: updateError } = await supabase
            .from('devices')
            .update(deviceData)
            .eq('id', existingDevice.id);

          if (updateError) {
            errors.push(`Update error for ${anydeskId}`);
            continue;
          }

          devicesUpdated++;

          // Stale recovery: log event when a previously stale device returns
          if (wasStale) {
            staleRecovered++;
            await supabase.from('events_log').insert({
              computer_id: existingDevice.id,
              event_type: 'stale_recovered',
              old_status: existingDevice.status,
              new_status: finalStatus,
              description: 'Device voltou a aparecer na API AnyDesk',
              metadata: { recovered_at: new Date().toISOString() },
            });
          }

          // Provider detection alert
          if (providerChanged) {
            providerDetections++;
            await supabase.from('provider_alerts').insert({
              computer_id: existingDevice.id,
              old_provider: existingDevice.provider,
              new_provider: parsed.provider,
            });
          }

          // Only record status change if confirmed by debounce logic
          if (shouldRecordStatusChange) {
            statusChanges++;
            
            await supabase.from('devices').update({
              total_events: (existingDevice.total_events || 0) + 1,
              offline_count: finalStatus === 'offline' ? (existingDevice.offline_count || 0) + 1 : existingDevice.offline_count,
            }).eq('id', existingDevice.id);

            await supabase.from('events_log').insert({
              computer_id: existingDevice.id,
              event_type: 'status_change',
              old_status: previousStatus,
              new_status: finalStatus,
              description: `Status changed from ${previousStatus} to ${finalStatus}`,
              metadata: { timestamp: new Date().toISOString(), provider: parsed.provider, address: parsed.address },
            });

            if (finalStatus === 'offline') {
              // Device went offline - close any open online session and create offline record
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

              // Create the offline event record (this is what we track as "quedas")
              await supabase.from('connection_history').insert({
                computer_id: existingDevice.id,
                event_type: 'offline',
                started_at: new Date().toISOString(),
              });
              
              console.log(`[SYNC-ANYDESK] 📝 Created connection_history OFFLINE record for ${anydeskId}`);
            } else {
              // Device came back online - close any open offline session
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
                  
                console.log(`[SYNC-ANYDESK] 📝 Closed OFFLINE record for ${anydeskId}, duration: ${duration}s`);
              }
              
              // NOTE: Do NOT create new "online" record here - 
              // we only track offline events (quedas) to avoid polluting the database
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
            new_status: finalStatus,
            description: `Device first synced with status: ${finalStatus}`,
          });

          // Only create initial offline record if device is offline on first sync
          if (finalStatus === 'offline') {
            await supabase.from('connection_history').insert({
              computer_id: newDevice.id,
              event_type: 'offline',
              started_at: new Date().toISOString(),
            });
          }

          if (parsed.provider !== 'Sem provedor') {
            providerDetections++;
            await supabase.from('provider_alerts').insert({
              computer_id: newDevice.id,
              new_provider: parsed.provider,
            });
          }
        }
      } catch (error) {
        errors.push(`Processing error for ${client.cid}: ${error.message}`);
      }
    }

    // ============ STALE DEVICE DETECTION ============
    // Devices que NÃO apareceram nesta resposta da API são marcados como offline
    // (preservando last_online_at). NUNCA deletar — só admin pode arquivar.
    let staleDetected = 0;
    try {
      const apiClientIds = clients.map((c: any) => String(c.cid));
      
      // Busca todos os devices ativos não-deletados
      const { data: allActiveDevices } = await supabase
        .from('devices')
        .select('id, anydesk_client_id, status, last_online_at, metadata, name')
        .eq('is_deleted', false);
      
      const missingDevices = (allActiveDevices || []).filter(
        (d) => d.anydesk_client_id && !apiClientIds.includes(String(d.anydesk_client_id))
      );
      
      console.log(`[SYNC-ANYDESK] 🔍 Stale check: ${missingDevices.length} devices não retornaram da API`);
      
      for (const dev of missingDevices) {
        const existingMeta = (dev.metadata as any) || {};
        const wasAlreadyStale = existingMeta.stale === true;
        const wasOnline = dev.status !== 'offline';
        
        // Atualiza status + flag stale (preserva last_online_at)
        const newMetadata = {
          ...existingMeta,
          stale: true,
          stale_reason: 'not_returned_by_anydesk_api',
          stale_detected_at: existingMeta.stale_detected_at || new Date().toISOString(),
          stale_since: existingMeta.stale_since || dev.last_online_at,
          stale_last_check: new Date().toISOString(),
        };
        
        const { error: staleErr } = await supabase
          .from('devices')
          .update({
            status: 'offline',
            consecutive_offline_count: 0,
            metadata: newMetadata,
          })
          .eq('id', dev.id);
        
        if (staleErr) {
          console.warn(`[SYNC-ANYDESK] ⚠️ Stale update error ${dev.anydesk_client_id}:`, staleErr.message);
          continue;
        }
        
        // Só registra evento na transição (primeira vez detectado)
        if (!wasAlreadyStale) {
          staleDetected++;
          console.log(`[SYNC-ANYDESK] 👻 Device ${dev.anydesk_client_id} (${dev.name}) marcado como STALE`);
          
          await supabase.from('events_log').insert({
            computer_id: dev.id,
            event_type: 'stale_detected',
            old_status: dev.status,
            new_status: 'offline',
            description: 'Device removido da API AnyDesk - marcado como offline',
            metadata: { stale_since: dev.last_online_at, reason: 'missing_from_api' },
          });
          
          // Fecha sessão online aberta, se houver
          if (wasOnline) {
            const { data: lastOnline } = await supabase
              .from('connection_history')
              .select('*')
              .eq('computer_id', dev.id)
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
              computer_id: dev.id,
              event_type: 'offline',
              started_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (staleError) {
      console.error('[SYNC-ANYDESK] ⚠️ Stale detection block failed:', staleError);
    }
    // ============ END STALE DETECTION ============

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_clients: clients.length,
        devices_updated: devicesUpdated,
        devices_created: devicesCreated,
        status_changes: statusChanges,
        provider_detections: providerDetections,
        stale_detected: staleDetected,
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
