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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lead, priority, reason } = await req.json();

    console.log(`[NOTIFY-EDUARDO] Sending ${priority} priority notification`);

    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');
    
    // Buscar configuração do Eduardo
    const { data: eduardo } = await supabase
      .from('agents')
      .select('whatsapp_number, manychat_config')
      .eq('key', 'eduardo')
      .single();

    if (!eduardo?.whatsapp_number) {
      console.warn('[NOTIFY-EDUARDO] Eduardo phone number not configured');
      
      // Log interno
      await supabase.from('agent_logs').insert({
        agent_key: 'eduardo',
        event_type: 'notification_pending',
        metadata: { 
          lead, 
          priority, 
          reason: 'Phone number not configured',
          timestamp: new Date().toISOString() 
        }
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Eduardo not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Montar mensagem
    const priorityEmoji = priority === 'critical' ? '🔥🔥🔥' : priority === 'high' ? '🔥' : '⚠️';
    const reasonText = reason === 'hot_lead' 
      ? 'LEAD MUITO QUENTE' 
      : reason === 'risk_of_loss' 
      ? '⚠️ RISCO DE PERDA - CONDIÇÃO ESPECIAL NECESSÁRIA' 
      : 'LEAD QUALIFICADO';
    
    let message = `${priorityEmoji} ${reasonText}\n\n`;
    message += `📊 Score: ${lead.score}\n`;
    message += `👤 Contato: ${lead.contact_name || lead.contact_number}\n`;
    message += `📱 Telefone: ${lead.contact_number}\n`;
    
    if (lead.interest_areas && lead.interest_areas.length > 0) {
      message += `🎯 Interesses: ${lead.interest_areas.join(', ')}\n`;
    }
    
    if (lead.profile_type) {
      message += `🏢 Perfil: ${lead.profile_type}\n`;
    }
    
    message += `📈 Classificação: ${lead.classification}\n`;
    
    if (lead.budget_range) {
      message += `💰 Orçamento: ${lead.budget_range}\n`;
    }
    
    if (lead.timeline) {
      message += `⏰ Timeline: ${lead.timeline}\n`;
    }
    
    if (lead.notes) {
      message += `\n📝 Observações:\n${lead.notes}\n`;
    }
    
    if (reason === 'risk_of_loss' && lead.reason_for_risk) {
      message += `\n⚠️ MOTIVO DO RISCO:\n${lead.reason_for_risk}\n`;
      message += `\n💡 AÇÃO SUGERIDA: Entrar em contato IMEDIATAMENTE com condição especial para reverter situação.`;
    }

    // Enviar via ManyChat (se configurado)
    if (MANYCHAT_API_KEY) {
      try {
        const manychatResponse = await fetch('https://api.manychat.com/fb/sending/sendContent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: eduardo.whatsapp_number,
            data: {
              version: 'v2',
              content: {
                messages: [{
                  type: 'text',
                  text: message
                }]
              }
            }
          })
        });

        if (!manychatResponse.ok) {
          const error = await manychatResponse.text();
          console.error('[NOTIFY-EDUARDO] ManyChat error:', error);
        } else {
          console.log('[NOTIFY-EDUARDO] Notification sent via ManyChat');
        }
      } catch (error) {
        console.error('[NOTIFY-EDUARDO] ManyChat send error:', error);
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'eduardo',
      event_type: 'lead_notification',
      metadata: { 
        lead, 
        priority, 
        reason,
        sent_at: new Date().toISOString(),
        via_manychat: !!MANYCHAT_API_KEY
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTIFY-EDUARDO] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
