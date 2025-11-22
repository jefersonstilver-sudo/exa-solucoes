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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[FOLLOW-UP] 🔄 Starting follow-up check...');

    // Buscar conversas ativas sem resposta há 3+ minutos
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    const { data: staleConversations } = await supabase
      .from('conversations')
      .select('id, contact_phone, agent_key, last_message_at, metadata')
      .eq('status', 'active')
      .eq('awaiting_response', true)
      .lt('last_message_at', threeMinutesAgo)
      .limit(20);

    if (!staleConversations || staleConversations.length === 0) {
      console.log('[FOLLOW-UP] ✅ No conversations need follow-up');
      return new Response(
        JSON.stringify({ success: true, followUpsSent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FOLLOW-UP] 📊 Found ${staleConversations.length} conversations needing follow-up`);

    let followUpsSent = 0;

    for (const conv of staleConversations) {
      const timeSinceLastMsg = Date.now() - new Date(conv.last_message_at).getTime();
      const minutesAgo = Math.floor(timeSinceLastMsg / 60000);

      // Verificar contexto da conversa para personalizar follow-up
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('body')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(3);

      const lastMessages = recentMessages?.map(m => m.body.toLowerCase()).join(' ') || '';
      const mentionedBuilding = lastMessages.match(/edifício|prédio|pietro|provence|vila|miró/i);

      let followUpMessage = '';
      
      // 30+ minutos - Disponibilidade geral
      if (minutesAgo >= 30) {
        followUpMessage = 'Estou por aqui se precisar! Qualquer coisa é só me chamar 😊';
      } 
      // 10-30 minutos - Facilidade da plataforma (mencionar prédio se foi discutido)
      else if (minutesAgo >= 10) {
        if (mentionedBuilding) {
          followUpMessage = `Qualquer dúvida sobre o ${mentionedBuilding[0]} é só chamar! A gente facilita tudo pra você 😊`;
        } else {
          followUpMessage = 'Qualquer dúvida é só chamar! A gente facilita tudo pra você ter o painel funcionando rapidinho 😊';
        }
      } 
      // 3-10 minutos - Checagem de dúvida
      else if (minutesAgo >= 3) {
        followUpMessage = 'Ficou com alguma dúvida? 🤔';
      }

      if (followUpMessage) {
        console.log(`[FOLLOW-UP] 📤 Sending to ${conv.contact_phone} (${minutesAgo}min inactive)`);

        const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
          body: {
            agentKey: conv.agent_key,
            phone: conv.contact_phone,
            message: followUpMessage
          }
        });

        if (sendError) {
          console.error(`[FOLLOW-UP] ❌ Failed to send to ${conv.contact_phone}:`, sendError);
          continue;
        }

        await supabase.from('agent_logs').insert({
          agent_key: conv.agent_key,
          conversation_id: conv.id,
          event_type: 'follow_up_sent',
          metadata: {
            minutesInactive: minutesAgo,
            followUpType: minutesAgo >= 30 ? 'availability' : minutesAgo >= 10 ? 'platform_ease' : 'doubt_check',
            message: followUpMessage,
            timestamp: new Date().toISOString()
          }
        });

        followUpsSent++;
      }
    }

    console.log(`[FOLLOW-UP] ✅ Sent ${followUpsSent} follow-ups`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        followUpsSent,
        conversationsChecked: staleConversations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FOLLOW-UP] 💥 ERROR:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
