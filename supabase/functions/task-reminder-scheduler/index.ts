import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const UNIDADE_TO_MINUTES: Record<string, number> = {
  minutos: 1,
  horas: 60,
  dias: 1440,
  semanas: 10080,
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

    // Fetch today's pending tasks with horario_inicio
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

    // Also check future-date tasks that have reminders in days/weeks range
    const { data: futureReminders } = await supabase
      .from('task_reminders')
      .select('id, task_id, tipo, unidade, valor, ativo, fired_at')
      .eq('ativo', true)
      .is('fired_at', null)
      .in('unidade', ['dias', 'semanas']);

    // Get event_types for icons
    const { data: eventTypes } = await supabase
      .from('event_types')
      .select('value, icon, label');
    const typeMap: Record<string, { icon: string; label: string }> = {};
    for (const et of eventTypes || []) {
      typeMap[et.value] = { icon: et.icon || '📋', label: et.label };
    }

    // Get alert contacts (fallback)
    const { data: alertContacts } = await supabase
      .from('exa_alerts_directors')
      .select('id, nome, telefone')
      .eq('ativo', true);

    // Read global config as fallback
    const { data: configRow } = await supabase
      .from('exa_alerts_config')
      .select('config_value')
      .eq('config_key', 'agenda_lembrete_pre_evento')
      .maybeSingle();

    const globalConfig = configRow?.config_value
      ? (typeof configRow.config_value === 'string' ? JSON.parse(configRow.config_value) : configRow.config_value)
      : { ativo: true, minutos_antes: 60 };

    const globalMinutesBefore = globalConfig.minutos_antes || 60;

    let alertsSent = 0;
    const processedAlerts: any[] = [];

    // Collect all task IDs to batch-fetch their reminders
    const taskIds = tasks.map(t => t.id);
    const { data: allReminders } = await supabase
      .from('task_reminders')
      .select('id, task_id, tipo, unidade, valor, ativo, fired_at')
      .in('task_id', taskIds)
      .eq('ativo', true)
      .is('fired_at', null);

    // Group reminders by task_id
    const remindersByTask: Record<string, any[]> = {};
    for (const r of allReminders || []) {
      if (!remindersByTask[r.task_id]) remindersByTask[r.task_id] = [];
      remindersByTask[r.task_id].push(r);
    }

    // Also handle future-date tasks with days/weeks reminders
    const futureTaskIds = new Set<string>();
    for (const r of futureReminders || []) {
      if (!taskIds.includes(r.task_id)) {
        futureTaskIds.add(r.task_id);
      }
    }

    let futureTasks: any[] = [];
    if (futureTaskIds.size > 0) {
      const { data: ft } = await supabase
        .from('tasks')
        .select('id, titulo, data_prevista, horario_inicio, horario_limite, tipo_evento, status, prioridade, descricao, local_evento, link_reuniao')
        .in('id', Array.from(futureTaskIds))
        .not('horario_inicio', 'is', null)
        .in('status', ['pendente', 'em_andamento']);
      futureTasks = ft || [];

      // Group future reminders
      for (const r of futureReminders || []) {
        if (futureTaskIds.has(r.task_id)) {
          if (!remindersByTask[r.task_id]) remindersByTask[r.task_id] = [];
          remindersByTask[r.task_id].push(r);
        }
      }
    }

    const allTasksToProcess = [...tasks, ...futureTasks];

    for (const task of allTasksToProcess) {
      const [taskH, taskM] = (task.horario_inicio || '00:00').split(':').map(Number);

      // Calculate task datetime in total minutes from epoch-ish reference for days/weeks comparison
      const taskDate = new Date(`${task.data_prevista}T${task.horario_inicio || '00:00'}:00`);
      const taskDateBrt = new Date(taskDate.getTime()); // Already in local format from string
      
      // For same-day tasks: use simple total minutes
      const taskTotalMinutes = taskH * 60 + taskM;
      
      // Calculate minutes from now until task (considering date difference for future tasks)
      const taskDateObj = new Date(`${task.data_prevista}T00:00:00`);
      const currentDateObj = new Date(`${currentDate}T00:00:00`);
      const daysDiff = Math.round((taskDateObj.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24));
      const minutesUntilTask = (daysDiff * 1440) + taskTotalMinutes - currentTotalMinutes;

      const taskReminders = remindersByTask[task.id];

      if (taskReminders && taskReminders.length > 0) {
        // === USE PER-TASK REMINDERS ===
        for (const reminder of taskReminders) {
          const multiplier = UNIDADE_TO_MINUTES[reminder.unidade] || 1;
          const reminderMinutes = reminder.valor * multiplier;

          // Check if it's time (5-minute tolerance window)
          if (minutesUntilTask < (reminderMinutes - 1) || minutesUntilTask > (reminderMinutes + 4)) continue;

          const alertType = `lembrete_custom_${reminder.valor}${reminder.unidade}`;

          console.log(`[task-reminder] Task "${task.titulo}" matches reminder ${reminder.valor} ${reminder.unidade} (${reminderMinutes}min) — sending`);

          // Check duplicate
          const { data: existingAlert } = await supabase
            .from('task_alert_logs')
            .select('id')
            .eq('task_id', task.id)
            .eq('alert_type', alertType)
            .gte('sent_at', new Date(now.getTime() - 120000).toISOString())
            .maybeSingle();

          if (existingAlert) {
            console.log(`[task-reminder] Already sent ${alertType} for "${task.titulo}"`);
            continue;
          }

          // Get recipients
          const recipients = await getRecipients(supabase, task.id, alertContacts);
          if (recipients.length === 0) continue;

          // Build and send message
          const message = buildMessage(task, reminderMinutes, typeMap);
          const { sentTo, errors } = await sendToRecipients(supabase, recipients, message);
          alertsSent += sentTo.length;

          // Log alert
          await supabase.from('task_alert_logs').insert({
            task_id: task.id,
            alert_type: alertType,
            recipients: sentTo,
            status: sentTo.length > 0 ? 'sent' : 'failed',
            error_message: errors.length > 0 ? JSON.stringify(errors) : null,
          });

          // Mark reminder as fired
          await supabase
            .from('task_reminders')
            .update({ fired_at: new Date().toISOString() })
            .eq('id', reminder.id);

          processedAlerts.push({ task: task.titulo, alertType, sentTo: sentTo.length, errors: errors.length });
        }
      } else if (task.data_prevista === currentDate && globalConfig.ativo) {
        // === FALLBACK: use global config (only for today's tasks without custom reminders) ===
        if (minutesUntilTask !== globalMinutesBefore) continue;

        const alertType = `lembrete_${globalMinutesBefore}min`;

        console.log(`[task-reminder] Task "${task.titulo}" matches global ${globalMinutesBefore}min — sending (fallback)`);

        const { data: existingAlert } = await supabase
          .from('task_alert_logs')
          .select('id')
          .eq('task_id', task.id)
          .eq('alert_type', alertType)
          .gte('sent_at', new Date(now.getTime() - 120000).toISOString())
          .maybeSingle();

        if (existingAlert) {
          console.log(`[task-reminder] Already sent fallback for "${task.titulo}"`);
          continue;
        }

        const recipients = await getRecipients(supabase, task.id, alertContacts);
        if (recipients.length === 0) continue;

        const message = buildMessage(task, globalMinutesBefore, typeMap);
        const { sentTo, errors } = await sendToRecipients(supabase, recipients, message);
        alertsSent += sentTo.length;

        await supabase.from('task_alert_logs').insert({
          task_id: task.id,
          alert_type: alertType,
          recipients: sentTo,
          status: sentTo.length > 0 ? 'sent' : 'failed',
          error_message: errors.length > 0 ? JSON.stringify(errors) : null,
        });

        processedAlerts.push({ task: task.titulo, alertType, sentTo: sentTo.length, errors: errors.length });
      }
    }

    console.log(`[task-reminder] Done. ${alertsSent} alerts sent.`);

    return new Response(JSON.stringify({
      success: true,
      alertsSent,
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

// === Helper Functions ===

async function getRecipients(supabase: any, taskId: string, alertContacts: any[] | null) {
  const { data: receipts } = await supabase
    .from('task_read_receipts')
    .select('recipient_phone, recipient_name')
    .eq('task_id', taskId);

  let recipients: { nome: string; telefone: string }[] = [];
  if (receipts && receipts.length > 0) {
    recipients = receipts
      .filter((r: any) => r.recipient_phone)
      .map((r: any) => ({ nome: r.recipient_name || 'Contato', telefone: r.recipient_phone }));
  }
  if (recipients.length === 0 && alertContacts) {
    recipients = alertContacts.filter(c => c.telefone).map(c => ({ nome: c.nome, telefone: c.telefone }));
  }
  return recipients;
}

function buildMessage(task: any, minutesBefore: number, typeMap: Record<string, { icon: string; label: string }>) {
  const eventIcon = typeMap[task.tipo_evento || '']?.icon || '📋';
  const eventLabel = typeMap[task.tipo_evento || '']?.label || 'Evento';

  // Human-readable time description
  let timeDesc: string;
  if (minutesBefore >= 10080) {
    const weeks = Math.round(minutesBefore / 10080);
    timeDesc = `${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else if (minutesBefore >= 1440) {
    const days = Math.round(minutesBefore / 1440);
    timeDesc = `${days} dia${days > 1 ? 's' : ''}`;
  } else if (minutesBefore >= 60) {
    const hours = Math.round(minutesBefore / 60);
    timeDesc = `${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    timeDesc = `${minutesBefore} minuto${minutesBefore > 1 ? 's' : ''}`;
  }

  let message = `⏰ *Lembrete — ${timeDesc}*\n\n`;
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
  return message;
}

async function sendToRecipients(supabase: any, recipients: { nome: string; telefone: string }[], message: string) {
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
        console.log(`[task-reminder] ✅ Sent to ${recipient.nome}`);
      } else {
        errors.push({ nome: recipient.nome, error: sendError.message });
      }
    } catch (err: any) {
      errors.push({ nome: recipient.nome, error: err.message });
      console.error(`[task-reminder] ❌ Error for ${recipient.nome}:`, err.message);
    }
  }

  return { sentTo, errors };
}
