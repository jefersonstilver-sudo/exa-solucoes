import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!manychatApiKey) {
      return new Response(
        JSON.stringify({ error: 'MANYCHAT_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[MANYCHAT-SYNC] Starting conversation sync...');

    // Buscar agente Eduardo
    const { data: eduardo } = await supabase
      .from('agents')
      .select('*')
      .eq('key', 'eduardo')
      .single();

    if (!eduardo) {
      return new Response(
        JSON.stringify({ error: 'Eduardo agent not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const eduardoNumber = eduardo.whatsapp_number; // +5545991415856

    // Buscar conversas do ManyChat
    // Nota: A API do ManyChat não tem endpoint direto para listar conversas
    // Precisamos buscar subscribers e depois suas mensagens
    const subscribersResponse = await fetch('https://api.manychat.com/fb/subscriber/findBySystemFields', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${manychatApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: eduardoNumber
      })
    });

    const subscribersData = await subscribersResponse.json();
    const responseTime = Date.now() - startTime;

    // Log da requisição
    await supabase.from('api_logs').insert({
      api_name: 'ManyChat API',
      endpoint: 'https://api.manychat.com/fb/subscriber/findBySystemFields',
      status_code: subscribersResponse.status,
      response_time_ms: responseTime,
      success: subscribersResponse.ok,
      request_payload: { phone: eduardoNumber },
      response_data: subscribersData
    });

    if (!subscribersResponse.ok || subscribersData.status !== 'success') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch subscribers from ManyChat',
          details: subscribersData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const subscribers = subscribersData.data || [];
    let syncedConversations = 0;
    let newLeads = 0;
    let newSyndics = 0;

    // Processar cada subscriber
    for (const subscriber of subscribers) {
      const subscriberId = subscriber.id;
      
      // Buscar ou criar conversa
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('external_id', subscriberId)
        .single();

      let conversationId;

      if (!existingConv) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            external_id: subscriberId,
            contact_phone: subscriber.phone || eduardoNumber,
            contact_name: subscriber.name || 'Desconhecido',
            contact_type: 'manychat_subscriber',
            status: 'active',
            first_message_at: subscriber.subscribed_at || new Date().toISOString(),
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single();

        conversationId = newConv?.id;
        syncedConversations++;

        // Análise automática de lead/síndico
        const tags = subscriber.tags || [];
        const customFields = subscriber.custom_fields || {};
        
        const isSyndic = tags.some((t: string) => 
          t.toLowerCase().includes('síndico') || 
          t.toLowerCase().includes('sindico')
        );
        
        const isLead = tags.some((t: string) => 
          t.toLowerCase().includes('lead') || 
          t.toLowerCase().includes('interessado')
        );

        // Registrar análise
        if (conversationId) {
          await supabase.from('analyses').insert({
            conversation_id: conversationId,
            intent: isSyndic ? 'sindico_contact' : (isLead ? 'lead_qualification' : 'general'),
            opportunity: isLead || isSyndic,
            summary: `Subscriber: ${subscriber.name || 'N/A'}. Tags: ${tags.join(', ')}`,
            raw_payload: {
              subscriber,
              manychat_data: customFields
            }
          });

          if (isSyndic) newSyndics++;
          if (isLead) newLeads++;
        }
      } else {
        conversationId = existingConv.id;
        
        // Atualizar last_message_at
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    }

    const totalTime = Date.now() - startTime;

    console.log(`[MANYCHAT-SYNC] Synced ${syncedConversations} conversations, ${newLeads} leads, ${newSyndics} syndics`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conversations synced successfully',
        stats: {
          totalSubscribers: subscribers.length,
          syncedConversations,
          newLeads,
          newSyndics,
          responseTime: totalTime
        },
        eduardoPhone: eduardoNumber,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[MANYCHAT-SYNC] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});