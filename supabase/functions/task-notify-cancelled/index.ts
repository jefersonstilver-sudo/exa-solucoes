import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function fmtDateBR(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/').map(Number);
    const dt = new Date(y, m - 1, d);
    return `${DIAS_SEMANA[dt.getDay()]}, ${dateStr}`;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${DIAS_SEMANA[dt.getDay()]}, ${dd}/${mm}/${y}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const {
      task_id, titulo, tipo_evento, data, horario_inicio,
      criador_nome, descricao, local_evento, link_reuniao
    } = await req.json();

    if (!task_id || !titulo) {
      return new Response(JSON.stringify({ error: 'task_id and titulo required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[TASK-CANCEL] 📤 Notifying cancellation:', titulo, '| task_id:', task_id);

    // Buscar contatos APENAS de task_read_receipts (notificados anteriormente para esta tarefa)
    const { data: receipts } = await supabase
      .from('task_read_receipts')
      .select('contact_phone, contact_name')
      .eq('task_id', task_id);

    // Usar APENAS task_read_receipts — sem merge com exa_alerts_directors
    const seen = new Set<string>();
    let contacts: { nome: string; telefone: string }[] = [];

    if (receipts) {
      for (const r of receipts) {
        if (!r.contact_phone || seen.has(r.contact_phone)) continue;
        seen.add(r.contact_phone);
        contacts.push({ nome: r.contact_name || 'Contato', telefone: r.contact_phone });
      }
    }

    console.log(`[TASK-CANCEL] 📋 Recipients from task_read_receipts only: ${contacts.length}`);

    if (contacts.length === 0) {
      console.log('[TASK-CANCEL] ⚠️ No contacts to notify');
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no_contacts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build cancellation message
    let message = `❌ *Compromisso cancelado*\n\n`;
    message += `*${titulo}*\n\n`;

    if (data) {
      message += `📅 ${fmtDateBR(data)}\n`;
    }
    if (horario_inicio) {
      message += `🕐 ${horario_inicio}\n`;
    }
    if (criador_nome) {
      message += `👤 Cancelado por: ${criador_nome}\n`;
    }
    if (local_evento) {
      message += `📍 Local: ${local_evento}\n`;
    }
    if (link_reuniao) {
      message += `🔗 Link: ${link_reuniao}\n`;
    }
    if (descricao) {
      message += `📝 ${descricao}\n`;
    }
    message += `\nEste evento foi cancelado.`;

    // Get Z-API config
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'exa_alert')
      .single();

    const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    let sent = 0;
    for (const contact of contacts) {
      if (!contact.telefone) continue;

      const formattedPhone = contact.telefone.startsWith('55')
        ? contact.telefone
        : `55${contact.telefone}`;

      try {
        if (zapiConfig?.instance_id && zapiConfig?.token) {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (zapiClientToken) headers['Client-Token'] = zapiClientToken;

          const textUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
          const textResponse = await fetch(textUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone: formattedPhone, message })
          });

          if (textResponse.ok) {
            sent++;
            console.log(`[TASK-CANCEL] ✅ Sent to ${contact.nome}`);
          } else {
            console.error(`[TASK-CANCEL] ❌ Failed for ${contact.nome}`);
          }
        } else {
          const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
            body: {
              agentKey: 'exa_alert',
              phone: contact.telefone,
              message,
              skipSplit: true
            }
          });

          if (sendError) {
            console.error(`[TASK-CANCEL] ❌ Failed for ${contact.nome}:`, sendError);
          } else {
            sent++;
            console.log(`[TASK-CANCEL] ✅ Sent to ${contact.nome}`);
          }
        }
      } catch (err) {
        console.error(`[TASK-CANCEL] ❌ Error for ${contact.nome}:`, err);
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'exa_alert',
      event_type: 'task_cancellation_notified',
      metadata: {
        task_id,
        titulo,
        tipo_evento: tipo_evento || 'tarefa',
        contacts_notified: sent,
        total_contacts: contacts.length,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`[TASK-CANCEL] ✅ Done: ${sent}/${contacts.length} notified`);

    return new Response(JSON.stringify({ success: true, sent, total: contacts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TASK-CANCEL] 💥 ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
