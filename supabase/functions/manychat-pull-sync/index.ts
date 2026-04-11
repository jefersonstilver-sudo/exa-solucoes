import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [PULL-SYNC] Starting sync process');

    // Validate sync secret
    const syncSecret = req.headers.get('x-sync-secret');
    const expectedSecret = Deno.env.get('MANYCHAT_SYNC_SECRET');
    
    if (!syncSecret || syncSecret !== expectedSecret) {
      console.error('❌ [PULL-SYNC] Invalid sync secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse body for optional 'since' parameter
    let since = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Default: 5 minutes ago
    try {
      const body = await req.json();
      if (body.since) {
        since = body.since;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    console.log(`📅 [PULL-SYNC] Syncing messages since: ${since}`);

    // Fetch messages from ManyChat API
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    if (!manychatApiKey) {
      throw new Error('MANYCHAT_API_KEY not configured');
    }

    // ManyChat API call (placeholder - adjust to actual ManyChat API endpoints)
    // Example: GET https://api.manychat.com/fb/conversations?since=<timestamp>
    const manychatResponse = await fetch(
      `https://api.manychat.com/fb/conversations?since=${encodeURIComponent(since)}`,
      {
        headers: {
          'Authorization': `Bearer ${manychatApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!manychatResponse.ok) {
      const errorText = await manychatResponse.text();
      console.error('❌ [PULL-SYNC] ManyChat API error:', errorText);
      throw new Error(`ManyChat API error: ${manychatResponse.status}`);
    }

    const manychatData = await manychatResponse.json();
    console.log(`📦 [PULL-SYNC] Fetched ${manychatData.data?.length || 0} conversations`);

    let processedCount = 0;
    const errors: any[] = [];

    // Process each conversation and its messages
    for (const conversation of manychatData.data || []) {
      try {
        // Fetch messages for this conversation
        const messagesResponse = await fetch(
          `https://api.manychat.com/fb/conversations/${conversation.id}/messages`,
          {
            headers: {
              'Authorization': `Bearer ${manychatApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!messagesResponse.ok) continue;

        const messagesData = await messagesResponse.json();

        for (const message of messagesData.data || []) {
          // Check for duplicate
          const { data: existing } = await supabase
            .from('messages')
            .select('id')
            .eq('external_message_id', message.id)
            .single();

          if (existing) continue; // Skip duplicate

          // Upsert conversation
          const { data: conv } = await supabase
            .from('conversations')
            .upsert({
              external_id: conversation.id,
              contact_phone: conversation.psid || conversation.phone || 'unknown',
              contact_name: conversation.name || 'Unknown',
              contact_type: 'unknown',
              first_message_at: message.created_time,
              last_message_at: message.created_time,
              status: 'open'
            }, {
              onConflict: 'external_id'
            })
            .select()
            .single();

          if (!conv) continue;

          // Insert message
          const { error: msgError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conv.id,
              external_message_id: message.id,
              from_role: message.from === 'page' ? 'attendant' : 'contact',
              body: message.text || '',
              has_image: message.attachments?.some((a: any) => a.type === 'image') || false,
              has_audio: message.attachments?.some((a: any) => a.type === 'audio') || false,
              raw_payload: message
            });

          if (msgError) {
            errors.push({ message_id: message.id, error: msgError.message });
          } else {
            processedCount++;
            
            // Trigger analysis (async)
            try {
              await analyzeMessageSimple(supabase, conv.id, message.text || '');
            } catch (analysisError) {
              console.error('⚠️ [PULL-SYNC] Analysis error:', analysisError);
            }
          }
        }
      } catch (convError) {
        console.error('⚠️ [PULL-SYNC] Error processing conversation:', convError);
        errors.push({ conversation_id: conversation.id, error: (convError as Error).message });
      }
    }

    // Save sync run log
    await supabase
      .from('sync_runs')
      .insert({
        started_at: since,
        finished_at: new Date().toISOString(),
        processed_count: processedCount,
        errors: errors
      });

    console.log(`✅ [PULL-SYNC] Sync completed. Processed: ${processedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        ok: true,
        processed: processedCount,
        errors: errors,
        since: since
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ [PULL-SYNC] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function analyzeMessageSimple(supabase: any, conversationId: string, text: string) {
  const urgencyKeywords = ['pane', 'parado', 'não funciona', 'offline', 'urgente'];
  const isUrgent = urgencyKeywords.some(kw => text.toLowerCase().includes(kw));

  const opportunityKeywords = ['quero', 'comprar', 'preço', 'orçamento'];
  const isOpportunity = opportunityKeywords.some(kw => text.toLowerCase().includes(kw));

  await supabase
    .from('analyses')
    .insert({
      conversation_id: conversationId,
      summary: text.substring(0, 200),
      intent: isUrgent ? 'urgency' : isOpportunity ? 'opportunity' : 'general',
      opportunity: isOpportunity,
      response_quality_score: 70,
      suggested_reply: 'Análise automatizada via pull-sync'
    });
}
