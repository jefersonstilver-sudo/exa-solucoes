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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // BRT time
    const now = new Date();
    const brasilOffset = -3 * 60 * 60 * 1000;
    const brasilNow = new Date(now.getTime() + brasilOffset + now.getTimezoneOffset() * 60 * 1000);
    const currentDate = brasilNow.toISOString().split('T')[0];
    const currentHours = brasilNow.getHours();
    const currentMinutes = brasilNow.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    console.log(`[task-reminder] Running at ${currentDate} ${currentHours}:${currentMinutes.toString().padStart(2, '0')} BRT`);

    // Read dynamic config
    const { data: configRow } = await supabase
      .from('exa_alerts_config')
      .select('config_value')
      .eq('config_key', 'agenda_lembrete_pre_evento')
      .maybeSingle();

    const config = configRow?.config_value
      ? (typeof configRow.config_value === 'string' ? JSON.parse(configRow.config_value) : configRow.config_value)
      : { ativo: true, minutos_antes: 60 };

    if (!config.ativo) {
      console.log('[task-reminder] Disabled by config');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const minutesBefore = config.minutos_antes || 60;

    // Fetch today's tasks from `tasks` table (NOT notion_tasks)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, titulo, data_prevista, horario_inicio, horario_limite, tipo_evento, status, prioridade, descricao, local_evento, link_reuniao')
      .eq('data_prevista', currentDate)
      .not('horario_inicio', 'is', null)
      .in('status', ['pendente', 'em_andamento'])
      .order('horario_inicio', { ascending: true });

    if (tasksError) {
      console.error('[task-reminder] Error fetching tasks:', tasksError);
      throw tasksError;
    }

    if (!tasks || tasks.length === 0) {
      console.log('[task-reminder] No tasks for today');
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[task-reminder] Found ${tasks.length} tasks to check`);

    // Get event_types for icons
    const { data: eventTypes } = await supabase
      .from('event_types')
      .select('value, icon, label');
    const typeMap: Record<string, { icon: string; label: string }> = {};
    for (const et of eventTypes || []) {
      typeMap[et.value] = { icon: et.icon || '📋', label: et.label };
    }

    // Get alert contacts
    const { data: alertContacts } = await supabase
      .from('exa_alerts_directors')
      .select('id, nome, telefone')
      .eq('ativo', true);

    let alertsSent = 0;
    const processedAlerts: any[] = [];

    for (const task of tasks) {
      const [taskH, taskM] = (task.horario_inicio || '00:00').split(':').map(Number);
      const taskTotalMinutes = taskH * 60 + taskM;
      const minutesUntilTask = taskTotalMinutes - currentTotalMinutes;

      // Check if it's time for the reminder (exact minute match)
      if (minutesUntilTask !== minutesBefore) continue;

      console.log(`[task-reminder] Task "${task.titulo}" is ${minutesBefore} min away — sending reminder`);

      // Check duplicate
      const { data: existingAlert } = await supabase
        .from('task_alert_logs')
        .select('id')
        .eq('task_id', task.id)
        .eq('alert_type', `lembrete_${minutesBefore}min`)
        .gte('sent_at', new Date(now.getTime() - 120000).toISOString())
        .maybeSingle();

      if (existingAlert) {
        console.log(`[task-reminder] Already sent for "${task.titulo}"`);
        continue;
      }

      // Get task-specific recipients (from task_read_receipts or responsaveis)
      const { data: receipts } = await supabase
        .from('task_read_receipts')
        .select('recipient_phone, recipient_name')
        .eq('task_id', task.id);

      // Build recipients list: receipts first, fallback to alert contacts
      let recipients: { nome: string; telefone: string }[] = [];
      if (receipts && receipts.length > 0) {
        recipients = receipts
          .filter(r => r.recipient_phone)
          .map(r => ({ nome: r.recipient_name || 'Contato', telefone: r.recipient_phone }));
      }
      if (recipients.length === 0 && alertContacts) {
        recipients = alertContacts.filter(c => c.telefone).map(c => ({ nome: c.nome, telefone: c.telefone }));
      }

      if (recipients.length === 0) continue;

      // Build message
      const eventIcon = typeMap[task.tipo_evento || '']?.icon || '📋';
      const eventLabel = typeMap[task.tipo_evento || '']?.label || 'Evento';
      let message = `⏰ *Lembrete — ${minutesBefore} minutos*\n\n`;
      message += `${eventIcon} *${task.titulo}*\n`;
      message += `📅 ${task.data_prevista} às ${task.horario_inicio}\n`;
      message += `📁 ${eventLabel}\n`;
      if (task.local_evento) message += `📍 ${task.local_evento}\n`;
      if (task.link_reuniao) message += `🔗 ${task.link_reuniao}\n`;
      if (task.descricao) message += `\n📝 ${task.descricao}\n`;
      if (task.prioridade) {
        const prioEmoji = task.prioridade === 'emergencia' ? '🔴' : task.prioridade === 'alta' ? '🟠' : task.prioridade === 'media' ? '🟡' : '🟢';
        message += `\n${prioEmoji} Prioridade: ${task.prioridade}`;
      }

      const sentTo: any[] = [];
      const errors: any[] = [];

      for (const recipient of recipients) {
        try {
          const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
            body: {
              agentKey: 'exa_alert',
              phone: recipient.telefone,
              message,
              skipSplit: true,
            },
          });
          if (!sendError) {
            sentTo.push({ nome: recipient.nome, telefone: recipient.telefone });
            alertsSent++;
            console.log(`[task-reminder] ✅ Sent to ${recipient.nome}`);
          } else {
            errors.push({ nome: recipient.nome, error: sendError.message });
          }
        } catch (err: any) {
          errors.push({ nome: recipient.nome, error: err.message });
          console.error(`[task-reminder] ❌ Error for ${recipient.nome}:`, err.message);
        }
      }

      // Log
      await supabase.from('task_alert_logs').insert({
        task_id: task.id,
        alert_type: `lembrete_${minutesBefore}min`,
        recipients: sentTo,
        status: sentTo.length > 0 ? 'sent' : 'failed',
        error_message: errors.length > 0 ? JSON.stringify(errors) : null,
      });

      processedAlerts.push({ task: task.titulo, sentTo: sentTo.length, errors: errors.length });
    }

    console.log(`[task-reminder] Done. ${alertsSent} alerts sent.`);

    return new Response(JSON.stringify({
      success: true,
      alertsSent,
      minutesBefore,
      processedAlerts,
      timestamp: brasilNow.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[task-reminder] ERROR:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
