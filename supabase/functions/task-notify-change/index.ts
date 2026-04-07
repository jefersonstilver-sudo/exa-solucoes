import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const {
      task_id,
      titulo,
      tipo_evento,
      changes,
      criador_nome,
      descricao,
      local_evento,
      link_reuniao,
    } = await req.json();

    if (!task_id || !titulo) {
      return new Response(JSON.stringify({ error: 'task_id and titulo required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[TASK-CHANGE] 🔄 Notifying change for task:', titulo, '| task_id:', task_id);

    // Fetch full task data for fallback info
    const { data: taskData } = await supabase
      .from('tasks')
      .select('descricao, local_evento, link_reuniao, data_prevista, horario_inicio, horario_limite')
      .eq('id', task_id)
      .maybeSingle();

    // Use caller-provided values or fallback to DB
    const finalDescricao = descricao || taskData?.descricao || '';
    const finalLocal = local_evento || taskData?.local_evento || '';
    const finalLink = link_reuniao || taskData?.link_reuniao || '';

    // Resolve event type
    const { data: eventType } = await supabase
      .from('event_types')
      .select('label, icon')
      .eq('name', tipo_evento || 'tarefa')
      .eq('active', true)
      .maybeSingle();

    const emoji = eventType?.icon || '📋';
    const label = eventType?.label || 'Tarefa';

    // Helper: format time to HH:MM (strip seconds)
    const fmtTime = (t: string | null | undefined): string => {
      if (!t) return '';
      return t.length >= 5 ? t.slice(0, 5) : t;
    };

    // Get contacts ONLY from task_read_receipts (previously notified for this specific task)
    const { data: receipts } = await supabase
      .from('task_read_receipts')
      .select('contact_phone, contact_name')
      .eq('task_id', task_id);

    // Use ONLY task_read_receipts — no merge with exa_alerts_directors
    const seen = new Set<string>();
    let contacts: { nome: string; telefone: string }[] = [];

    if (receipts) {
      for (const r of receipts) {
        if (!r.contact_phone || seen.has(r.contact_phone)) continue;
        seen.add(r.contact_phone);
        contacts.push({ nome: r.contact_name || r.contact_phone, telefone: r.contact_phone });
      }
    }

    console.log(`[TASK-CHANGE] 📋 Recipients from task_read_receipts only: ${contacts.length}`);

    if (contacts.length === 0) {
      console.log('[TASK-CHANGE] ⚠️ No contacts to notify');
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no_contacts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build change message
    const genderSuffix = ['compromisso', 'aviso', 'lembrete', 'evento'].some(m => label.toLowerCase().includes(m)) ? 'o' : 'a';
    let message = `🔄 *${label} reagendad${genderSuffix}*\n\n`;
    message += `*${titulo}*\n\n`;

    // Always show the current/new date
    const newDate = changes?.data_nova || taskData?.data_prevista || '';
    const oldDate = changes?.data_anterior || '';
    if (oldDate && newDate && oldDate !== newDate) {
      message += `📅 Data: ~${fmtDateBR(oldDate)}~ → *${fmtDateBR(newDate)}*\n`;
    } else if (newDate) {
      message += `📅 Data: *${fmtDateBR(newDate)}*\n`;
    }

    // Always show BOTH start and end times for full context
    const inicioChanged = changes?.horario_inicio_anterior !== undefined && changes?.horario_inicio_novo !== undefined && changes.horario_inicio_anterior !== changes.horario_inicio_novo;
    const limiteChanged = changes?.horario_limite_anterior !== undefined && changes?.horario_limite_novo !== undefined && changes.horario_limite_anterior !== changes.horario_limite_novo;

    // Resolve current values for start and end
    const currentInicio = fmtTime(changes?.horario_inicio_novo || taskData?.horario_inicio);
    const currentTermino = fmtTime(changes?.horario_limite_novo || taskData?.horario_limite);

    if (inicioChanged || limiteChanged || currentInicio || currentTermino) {
      // Show Início
      if (currentInicio || inicioChanged) {
        if (inicioChanged) {
          message += `🕐 Início: ~${fmtTime(changes.horario_inicio_anterior) || 'Sem horário'}~ → *${fmtTime(changes.horario_inicio_novo) || 'Sem horário'}*\n`;
        } else if (currentInicio) {
          message += `🕐 Início: ${currentInicio}\n`;
        }
      }
      // Show Término
      if (currentTermino || limiteChanged) {
        if (limiteChanged) {
          message += `⏰ Término: ~${fmtTime(changes.horario_limite_anterior) || 'Sem horário'}~ → *${fmtTime(changes.horario_limite_novo) || 'Sem horário'}*\n`;
        } else if (currentTermino) {
          message += `⏰ Término: ${currentTermino}\n`;
        }
      }
    }

    if (criador_nome) {
      message += `\n👤 Alterado por: ${criador_nome}\n`;
    }

    // Append extra info
    if (finalLocal) message += `\n📍 ${finalLocal}`;
    if (finalLink) message += `\n🔗 ${finalLink}`;
    if (finalDescricao) message += `\n📝 ${finalDescricao}`;

    message += `\n\n⚠️ Por favor, atualize sua agenda.`;

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
      const formattedPhone = contact.telefone.startsWith('55') ? contact.telefone : `55${contact.telefone}`;

      try {
        if (zapiConfig?.instance_id && zapiConfig?.token) {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (zapiClientToken) headers['Client-Token'] = zapiClientToken;

          const textUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
          const resp = await fetch(textUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone: formattedPhone, message })
          });

          if (resp.ok) {
            sent++;
            console.log(`[TASK-CHANGE] ✅ Sent to ${contact.nome}`);
          } else {
            console.error(`[TASK-CHANGE] ❌ Failed for ${contact.nome}`);
          }
        } else {
          const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
            body: { agentKey: 'exa_alert', phone: contact.telefone, message, skipSplit: true }
          });
          if (!sendError) {
            sent++;
            console.log(`[TASK-CHANGE] ✅ Sent to ${contact.nome}`);
          }
        }
      } catch (err) {
        console.error(`[TASK-CHANGE] ❌ Error for ${contact.nome}:`, err);
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'exa_alert',
      event_type: 'task_change_notified',
      metadata: {
        task_id,
        titulo,
        tipo_evento: tipo_evento || 'tarefa',
        changes,
        contacts_notified: sent,
        total_contacts: contacts.length,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`[TASK-CHANGE] ✅ Done: ${sent}/${contacts.length} contacts notified`);

    return new Response(JSON.stringify({ success: true, sent, total: contacts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TASK-CHANGE] 💥 ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
