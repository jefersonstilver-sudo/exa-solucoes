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
  checkbox?: boolean;
  url?: string;
  files?: { name: string; file?: { url: string }; external?: { url: string } }[];
  date?: { start: string };
  last_edited_time?: string;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
  last_edited_time: string;
}

function extractPropertyValue(prop: NotionProperty): any {
  if (!prop) return null;
  
  switch (prop.type) {
    case 'title':
      return prop.title?.map(t => t.plain_text).join('') || null;
    case 'rich_text':
      return prop.rich_text?.map(t => t.plain_text).join('') || null;
    case 'number':
      return prop.number ?? null;
    case 'select':
      return prop.select?.name || null;
    case 'checkbox':
      return prop.checkbox ?? false;
    case 'url':
      return prop.url || null;
    case 'files':
      return prop.files?.map(f => f.file?.url || f.external?.url).filter(Boolean) || [];
    case 'date':
      return prop.date?.start || null;
    case 'last_edited_time':
      return prop.last_edited_time || null;
    default:
      return null;
  }
}

function mapNotionToBuilding(page: NotionPage): Record<string, any> {
  const props = page.properties;
  
  // Extract all properties
  const nome = extractPropertyValue(props['Nome'] || props['nome']);
  const endereco = extractPropertyValue(props['Endereço'] || props['endereco']);
  const unidades = extractPropertyValue(props['Unidades'] || props['unidades']);
  const notionId = extractPropertyValue(props['ID'] || props['id']);
  const publicoAprox = extractPropertyValue(props['Público Aprox.'] || props['publico_aprox']);
  const status = extractPropertyValue(props['Status'] || props['status']);
  const tipo = extractPropertyValue(props['Tipo'] || props['tipo']);
  const oti = extractPropertyValue(props['O.T.I'] || props['oti']);
  const portaria = extractPropertyValue(props['Portaria'] || props['portaria']);
  const fotos = extractPropertyValue(props['Fotos'] || props['fotos']);
  const contrato = props['Contrato'] || props['contrato'];
  const contratoUrl = contrato?.files?.[0]?.file?.url || contrato?.files?.[0]?.external?.url || null;
  const whatsapp = extractPropertyValue(props['Whatsapp'] || props['whatsapp']);
  const outDate = extractPropertyValue(props['Out'] || props['out']);
  
  return {
    notion_page_id: page.id,
    notion_updated_at: page.last_edited_time,
    notion_properties: props, // Store all properties as JSONB
    
    // Mapped fields
    nome: nome || 'Sem nome',
    endereco: endereco || '',
    numero_unidades: unidades,
    publico_estimado: publicoAprox,
    notion_status: status,
    notion_tipo: tipo,
    notion_oti: oti,
    notion_portaria: portaria,
    notion_fotos: fotos || [],
    notion_contrato_url: contratoUrl,
    notion_whatsapp_url: whatsapp,
    notion_internal_id: notionId,
    notion_out_date: outDate,
    
    // Required fields with defaults
    bairro: '', // Will be extracted from endereco if needed
    status: 'lead', // Default status for new buildings
    location_type: 'Residencial',
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
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const notionApiKey = Deno.env.get('NOTION_API_KEY');
  const notionDatabaseId = Deno.env.get('NOTION_DATABASE_ID');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('[SYNC-NOTION] 🚀 Starting Notion sync...');
    
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
          // Check if Notion has newer data
          const notionUpdatedAt = new Date(page.last_edited_time);
          const localNotionUpdatedAt = existing.notion_updated_at ? new Date(existing.notion_updated_at) : new Date(0);
          
          if (notionUpdatedAt > localNotionUpdatedAt) {
            // Notion is newer, update local
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
              console.log(`[SYNC-NOTION] ✅ Updated: ${mappedData.nome}`);
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
                  select: { name: existing.notion_status || existing.status }
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
