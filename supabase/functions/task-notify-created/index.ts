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

    const { task_id, titulo, data, horario, criador_nome, specific_contacts } = await req.json();

    if (!task_id || !titulo) {
      return new Response(JSON.stringify({ error: 'task_id and titulo required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[TASK-NOTIFY] 📤 Notifying contacts about new task:', titulo);

    let contacts: { nome: string; telefone: string }[] = [];

    if (specific_contacts && Array.isArray(specific_contacts) && specific_contacts.length > 0) {
      // Use specific contacts passed from frontend
      contacts = specific_contacts.filter((c: any) => c.telefone);
      console.log(`[TASK-NOTIFY] 📋 Using ${contacts.length} specific contacts`);
    } else {
      // Fallback: fetch all active alert contacts
      const { data: dbContacts, error: contactsError } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, telefone')
        .eq('ativo', true);

      if (contactsError || !dbContacts || dbContacts.length === 0) {
        console.log('[TASK-NOTIFY] ⚠️ No active contacts found');
        return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no_contacts' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      contacts = dbContacts;
    }

    if (contacts.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no_contacts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const dataFormatada = data || 'Sem data';
    const horarioFormatado = horario || 'Sem horário';

    const message = `📋 *Nova tarefa agendada*\n\n` +
      `*${titulo}*\n` +
      `📅 Data: ${dataFormatada}${horarioFormatado !== 'Sem horário' ? ` às ${horarioFormatado}` : ''}\n` +
      `👤 Criado por: ${criador_nome || 'Sistema'}\n\n` +
      `Você será notificado sobre o status.`;

    let sent = 0;
    for (const contact of contacts) {
      if (!contact.telefone) continue;

      try {
        const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
          body: {
            agentKey: 'exa_alert',
            phone: contact.telefone,
            message,
            skipSplit: true
          }
        });

        if (sendError) {
          console.error(`[TASK-NOTIFY] ❌ Failed to send to ${contact.nome}:`, sendError);
        } else {
          sent++;
          console.log(`[TASK-NOTIFY] ✅ Sent to ${contact.nome}`);
        }
      } catch (err) {
        console.error(`[TASK-NOTIFY] ❌ Error sending to ${contact.nome}:`, err);
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'exa_alert',
      event_type: 'task_creation_notified',
      metadata: {
        task_id,
        titulo,
        contacts_notified: sent,
        total_contacts: contacts.length,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`[TASK-NOTIFY] ✅ Done: ${sent}/${contacts.length} contacts notified`);

    return new Response(JSON.stringify({ success: true, sent, total: contacts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TASK-NOTIFY] 💥 ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
