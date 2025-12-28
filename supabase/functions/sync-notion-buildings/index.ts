import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotionProperty {
  type: string;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  number?: number;
  select?: { name: string };
  status?: { name: string };
  checkbox?: boolean;
  url?: string;
  email?: string;
  phone_number?: string;
  files?: { name: string; file?: { url: string }; external?: { url: string } }[];
  date?: { start: string };
  last_edited_time?: string;
  unique_id?: { number: number; prefix?: string };
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
  last_edited_time: string;
}

// Map Notion status to EXA database status
function mapNotionStatus(notionStatus: string | null): string {
  if (!notionStatus) return 'lead';
  
  // Remove emojis and normalize the status string
  const statusClean = notionStatus
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|⚪|🟢|🔴|🟡|🟣|🔵|⚫|🟤|🟠/gu, '')
    .trim()
    .toLowerCase();
  
  console.log(`[SYNC-NOTION] 🔄 Mapping status: "${notionStatus}" -> cleaned: "${statusClean}"`);
  
  // Status mapping based on Notion values - includes ALL Notion statuses
  switch (statusClean) {
    case 'online':
    case 'ativo':
      return 'ativo';
    case 'offline':
      return 'inativo';
    case 'manut':
    case 'manutenção':
    case 'manutencao':
      return 'manutencao';
    case 'instalação':
    case 'instalacao':
      return 'instalacao';
    case 'subir nuc':
      return 'subir_nuc';
    case 'instalação internet':
    case 'instalacao internet':
      return 'instalacao_internet';
    case 'troca painel':
      return 'troca_painel';
    case 'primeira reunião':
    case 'primeira reuniao':
      return 'primeira_reuniao';
    case 'visita técnica':
    case 'visita tecnica':
      return 'visita_tecnica';
    case 'interesse':
    case 'lead':
      return 'lead';
    case 'cancelado':
    case 'encerrado':
      return 'inativo';
    default:
      console.log(`[SYNC-NOTION] ⚠️ Unknown status: "${notionStatus}" (cleaned: "${statusClean}"), defaulting to 'ativo'`);
      return 'ativo';
  }
}

// Map Notion type to location_type
function mapNotionTipo(notionTipo: string | null): string {
  if (!notionTipo) return 'residential';
  
  const tipoLower = notionTipo.toLowerCase().trim();
  
  if (tipoLower.includes('comercial') || tipoLower.includes('business')) {
    return 'commercial';
  }
  
  return 'residential';
}

// Extract bairro from address if possible
function extractBairro(endereco: string | null): string {
  if (!endereco) return '';
  
  // Try to extract bairro from address (usually after comma or dash)
  const parts = endereco.split(/[,\-]/);
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  
  return '';
}

function mapNotionToBuilding(page: NotionPage): Record<string, any> {
  const props = page.properties;
  
  // Extract all 24 properties using exact Notion property names
  const nome = props['Nome do Prédio']?.title?.[0]?.plain_text || null;
  const endereco = props['Endereço']?.rich_text?.[0]?.plain_text || null;
  const numeroAndares = props['Nº Andares']?.number ?? null;
  const numeroBlocos = props['Nº Blocos']?.number ?? null;
  const numeroUnidades = props['Unidades']?.number ?? null;
  const numeroElevadores = props['Elevadores sociais']?.number ?? null;
  const publicoAprox = props['Publico Aprox.']?.number ?? null;
  
  // Status field (status type in Notion)
  const notionStatus = props['Status']?.status?.name || null;
  
  // Select fields
  const notionTipo = props['Tipo']?.select?.name || null;
  const notionPortaria = props['Portaria?']?.select?.name || null;
  const notionInternet = props['INTERNET']?.select?.name || null;
  
  // Contact fields
  const contatoSindico = props['Contato Sindico']?.phone_number || null;
  const notionEmail = props['E-mail']?.email || null;
  
  // URL fields
  const notionWhatsappUrl = props['Whatsapp']?.url || null;
  const notionContratoUrl = props['Contrato']?.url || null;
  
  // Rich text fields
  const notionOti = props['O.T.I']?.rich_text?.[0]?.plain_text || null;
  
  // Files/media fields
  const notionFotos = props['Fotos']?.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
  const notionTermoAceite = props['Termo de Aceite']?.files || null;
  
  // Date fields - extract date and time separately
  const dataTrabalhoRaw = props['Data Trabalho']?.date?.start || null;
  let notionDataTrabalho: string | null = null;
  let notionHorarioTrabalho: string | null = null;
  
  if (dataTrabalhoRaw) {
    // Check if it has time component (ISO format with T)
    if (dataTrabalhoRaw.includes('T')) {
      const [datePart, timePart] = dataTrabalhoRaw.split('T');
      notionDataTrabalho = datePart;
      // Extract time in HH:MM format
      notionHorarioTrabalho = timePart.slice(0, 5);
    } else {
      notionDataTrabalho = dataTrabalhoRaw;
    }
  }
  
  const notionInstalado = props['instalado']?.date?.start || null;
  const notionOutDate = props['Out 2025']?.date?.start || null;
  
  // Unique ID field
  const notionInternalId = props['ID']?.unique_id?.number ?? null;
  
  // Last edited time (from page metadata or property)
  const notionUpdatedAt = props['Atualização']?.last_edited_time || page.last_edited_time;
  
  // Map status to EXA status
  const status = mapNotionStatus(notionStatus);
  const locationType = mapNotionTipo(notionTipo);
  const bairro = extractBairro(endereco);
  
  return {
    notion_page_id: page.id,
    notion_updated_at: notionUpdatedAt,
    notion_properties: props, // Store all properties as JSONB backup
    
    // Core building fields
    nome: nome || 'Sem nome',
    endereco: endereco || '',
    bairro: bairro,
    numero_andares: numeroAndares,
    numero_blocos: numeroBlocos,
    numero_unidades: numeroUnidades,
    numero_elevadores: numeroElevadores,
    publico_estimado: publicoAprox,
    
    // Status fields
    status: status,
    notion_status: notionStatus,
    location_type: locationType,
    
    // Notion-specific fields
    notion_tipo: notionTipo,
    notion_portaria: notionPortaria,
    notion_internet: notionInternet,
    notion_oti: notionOti,
    notion_email: notionEmail,
    contato_sindico: contatoSindico,
    notion_whatsapp_url: notionWhatsappUrl,
    notion_contrato_url: notionContratoUrl,
    notion_fotos: notionFotos,
    notion_termo_aceite: notionTermoAceite,
    notion_instalado: notionInstalado,
    notion_data_trabalho: notionDataTrabalho,
    notion_horario_trabalho: notionHorarioTrabalho,
    notion_out_date: notionOutDate,
    notion_internal_id: notionInternalId,
  };
}

async function fetchNotionDatabase(apiKey: string, databaseId: string): Promise<NotionPage[]> {
  const allPages: NotionPage[] = [];
  let hasMore = true;
  let startCursor: string | undefined;
  
  while (hasMore) {
    const body: any = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;
    
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    allPages.push(...data.results);
    
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }
  
  return allPages;
}

async function updateNotionPage(apiKey: string, pageId: string, properties: Record<string, any>): Promise<boolean> {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`[SYNC-NOTION] Failed to update Notion page ${pageId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`[SYNC-NOTION] Error updating Notion page ${pageId}:`, error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let logId: string | null = null;
  
  // Parse request body for force mode
  let forceUpdate = false;
  try {
    const body = await req.json();
    forceUpdate = body?.force === true;
  } catch {
    // No body or invalid JSON, continue with default
  }
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const notionApiKey = Deno.env.get('NOTION_API_KEY');
  const notionDatabaseId = Deno.env.get('NOTION_DATABASE_ID');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`[SYNC-NOTION] 🚀 Starting Notion sync... (force=${forceUpdate})`);
    
    // Validate required secrets
    if (!notionApiKey || !notionDatabaseId) {
      throw new Error('Missing NOTION_API_KEY or NOTION_DATABASE_ID secrets');
    }

    // Create sync log entry
    const { data: logData, error: logError } = await supabase
      .from('notion_sync_logs')
      .insert({ status: 'running' })
      .select('id')
      .single();
    
    if (logData) logId = logData.id;

    // Fetch all pages from Notion database
    console.log('[SYNC-NOTION] 📥 Fetching Notion database...');
    const notionPages = await fetchNotionDatabase(notionApiKey, notionDatabaseId);
    console.log(`[SYNC-NOTION] 📊 Found ${notionPages.length} pages in Notion`);

    // Fetch existing buildings with notion_page_id
    const { data: existingBuildings, error: fetchError } = await supabase
      .from('buildings')
      .select('id, notion_page_id, notion_updated_at, local_updated_at, notion_last_synced_at, nome, endereco, status, notion_status');
    
    if (fetchError) throw fetchError;

    const existingByNotionId = new Map(
      existingBuildings?.filter(b => b.notion_page_id).map(b => [b.notion_page_id, b]) || []
    );

    let created = 0;
    let updated = 0;
    let syncedToNotion = 0;
    const errors: any[] = [];

    // Process each Notion page
    for (const page of notionPages) {
      try {
        const mappedData = mapNotionToBuilding(page);
        const existing = existingByNotionId.get(page.id);
        
        if (existing) {
          // Check if Notion has newer data OR if force mode is enabled
          const notionUpdatedAt = new Date(page.last_edited_time);
          const localNotionUpdatedAt = existing.notion_updated_at ? new Date(existing.notion_updated_at) : new Date(0);
          
          const shouldUpdate = forceUpdate || (notionUpdatedAt > localNotionUpdatedAt);
          
          if (shouldUpdate) {
            // Notion is newer OR force update, update local
            const { error: updateError } = await supabase
              .from('buildings')
              .update({
                ...mappedData,
                notion_last_synced_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
            
            if (updateError) {
              errors.push({ type: 'update', pageId: page.id, error: updateError.message });
            } else {
              updated++;
              console.log(`[SYNC-NOTION] ✅ Updated: ${mappedData.nome}${forceUpdate ? ' (forced)' : ''}`);
            }
          } else if (existing.local_updated_at && existing.notion_last_synced_at) {
            // Check if local has changes to sync back to Notion
            const localUpdatedAt = new Date(existing.local_updated_at);
            const lastSyncedAt = new Date(existing.notion_last_synced_at);
            
            if (localUpdatedAt > lastSyncedAt) {
              // Local changes need to be synced to Notion
              // Only sync specific fields (status changes)
              const notionProperties: Record<string, any> = {};
              
              // Map local status back to Notion status if changed
              if (existing.status !== mappedData.status) {
                notionProperties['Status'] = {
                  status: { name: existing.notion_status || existing.status }
                };
              }
              
              if (Object.keys(notionProperties).length > 0) {
                const success = await updateNotionPage(notionApiKey, page.id, notionProperties);
                if (success) {
                  syncedToNotion++;
                  console.log(`[SYNC-NOTION] ⬆️ Synced to Notion: ${existing.nome}`);
                  
                  // Update sync timestamp
                  await supabase
                    .from('buildings')
                    .update({ notion_last_synced_at: new Date().toISOString() })
                    .eq('id', existing.id);
                }
              }
            }
          }
        } else {
          // New building from Notion
          const { error: insertError } = await supabase
            .from('buildings')
            .insert({
              ...mappedData,
              notion_last_synced_at: new Date().toISOString(),
            });
          
          if (insertError) {
            // Check if it's a duplicate name or address
            if (insertError.code === '23505') {
              console.log(`[SYNC-NOTION] ⚠️ Duplicate building skipped: ${mappedData.nome}`);
            } else {
              errors.push({ type: 'insert', pageId: page.id, error: insertError.message });
            }
          } else {
            created++;
            console.log(`[SYNC-NOTION] ➕ Created: ${mappedData.nome}`);
          }
        }
      } catch (pageError: any) {
        errors.push({ type: 'process', pageId: page.id, error: pageError.message });
      }
    }

    const durationMs = Date.now() - startTime;

    // Update sync log
    if (logId) {
      await supabase
        .from('notion_sync_logs')
        .update({
          status: errors.length > 0 ? 'partial' : 'success',
          sync_completed_at: new Date().toISOString(),
          buildings_created: created,
          buildings_updated: updated,
          buildings_synced_to_notion: syncedToNotion,
          errors: errors.length > 0 ? errors : [],
          duration_ms: durationMs,
          details: {
            total_notion_pages: notionPages.length,
            existing_buildings: existingBuildings?.length || 0,
          }
        })
        .eq('id', logId);
    }

    console.log(`[SYNC-NOTION] ✅ Sync completed in ${durationMs}ms`);
    console.log(`[SYNC-NOTION] 📊 Created: ${created}, Updated: ${updated}, Synced to Notion: ${syncedToNotion}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          created,
          updated,
          syncedToNotion,
          errors: errors.length,
          durationMs,
          totalNotionPages: notionPages.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SYNC-NOTION] ❌ Sync failed:', error.message);
    
    // Update sync log with error
    if (logId) {
      await supabase
        .from('notion_sync_logs')
        .update({
          status: 'error',
          sync_completed_at: new Date().toISOString(),
          errors: [{ type: 'fatal', error: error.message }],
          duration_ms: Date.now() - startTime,
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
