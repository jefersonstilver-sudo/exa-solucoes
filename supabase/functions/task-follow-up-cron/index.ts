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

    console.log('[TASK-FOLLOWUP] 🔄 Starting follow-up check...');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // ========== PHASE 1: Send to creator (1h after task time) ==========
    // Find tasks that are pending/em_andamento, have auto_followup enabled,
    // and their scheduled time was 1+ hour ago, with no active notification queue entry
    const { data: dueTasks, error: dueError } = await supabase
      .from('tasks')
      .select('id, titulo, data_prevista, horario_limite, horario_inicio, criada_por, auto_followup')
      .in('status', ['pendente', 'em_andamento'])
      .eq('auto_followup', true)
      .not('data_prevista', 'is', null);

    if (dueError) {
      console.error('[TASK-FOLLOWUP] ❌ Error fetching tasks:', dueError);
      throw dueError;
    }

    let sentToCreator = 0;
    let escalated = 0;

    if (dueTasks && dueTasks.length > 0) {
      for (const task of dueTasks) {
        // Calculate task datetime
        const taskDate = task.data_prevista;
        const taskTime = task.horario_limite || task.horario_inicio || '23:59';
        const taskDateTime = new Date(`${taskDate}T${taskTime}:00-03:00`); // BRT

        // Skip if task time + 1h hasn't passed yet
        if (taskDateTime.getTime() + 60 * 60 * 1000 > now.getTime()) continue;

        // Check if already has active notification
        const { data: existingNotif } = await supabase
          .from('task_notification_queue')
          .select('id, status')
          .eq('task_id', task.id)
          .neq('status', 'resolved')
          .maybeSingle();

        if (existingNotif) {
          // Already has notification, skip phase 1
          continue;
        }

        // Get creator's phone
        const { data: creator } = await supabase
          .from('users')
          .select('id, telefone, nome')
          .eq('id', task.criada_por)
          .single();

        if (!creator?.telefone) {
          console.log(`[TASK-FOLLOWUP] ⚠️ Creator has no phone for task: ${task.titulo}`);
          continue;
        }

        const message = `📋 *Follow-up de Tarefa*\n\n` +
          `A tarefa *"${task.titulo}"* agendada para ${taskDate} às ${taskTime} foi concluída?\n\n` +
          `Responda:\n` +
          `*1* - ✅ Concluir tarefa\n` +
          `*2* - 📅 Reagendar\n` +
          `*3* - ❌ Cancelar compromisso`;

        try {
          const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
            body: {
              agentKey: 'exa_alert',
              phone: creator.telefone,
              message,
              skipSplit: true
            }
          });

          if (!sendError) {
            // Create queue entry
            await supabase.from('task_notification_queue').insert({
              task_id: task.id,
              criado_por: task.criada_por,
              status: 'sent_to_creator',
              sent_at: now.toISOString()
            });

            sentToCreator++;
            console.log(`[TASK-FOLLOWUP] ✅ Sent follow-up to creator for: ${task.titulo}`);
          }
        } catch (err) {
          console.error(`[TASK-FOLLOWUP] ❌ Failed to send for: ${task.titulo}`, err);
        }
      }
    }

    // ========== PHASE 2: Escalate (30min without response) ==========
    const { data: staleNotifs } = await supabase
      .from('task_notification_queue')
      .select('id, task_id, criado_por, sent_at')
      .eq('status', 'sent_to_creator')
      .lt('sent_at', thirtyMinAgo.toISOString());

    if (staleNotifs && staleNotifs.length > 0) {
      // Get alert contacts
      const { data: contacts } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, telefone')
        .eq('ativo', true);

      for (const notif of staleNotifs) {
        // Get task info
        const { data: task } = await supabase
          .from('tasks')
          .select('titulo, data_prevista, horario_limite, horario_inicio')
          .eq('id', notif.task_id)
          .single();

        if (!task) continue;

        const taskTime = task.horario_limite || task.horario_inicio || '';
        const message = `⚠️ *Escalação - Tarefa sem resposta*\n\n` +
          `A tarefa *"${task.titulo}"* agendada para ${task.data_prevista}${taskTime ? ` às ${taskTime}` : ''} não recebeu confirmação do criador.\n\n` +
          `Responda:\n` +
          `*1* - ✅ Concluir tarefa\n` +
          `*2* - 📅 Reagendar\n` +
          `*3* - ❌ Cancelar compromisso`;

        // Get creator's phone to exclude
        const { data: creator } = await supabase
          .from('users')
          .select('telefone')
          .eq('id', notif.criado_por)
          .single();

        const creatorPhone = creator?.telefone?.replace(/\D/g, '');

        if (contacts) {
          for (const contact of contacts) {
            if (!contact.telefone) continue;
            // Skip creator
            if (creatorPhone && contact.telefone.replace(/\D/g, '').includes(creatorPhone.slice(-8))) continue;

            try {
              await supabase.functions.invoke('zapi-send-message', {
                body: {
                  agentKey: 'exa_alert',
                  phone: contact.telefone,
                  message,
                  skipSplit: true
                }
              });
            } catch (err) {
              console.error(`[TASK-FOLLOWUP] ❌ Escalation failed for ${contact.nome}:`, err);
            }
          }
        }

        // Update status
        await supabase
          .from('task_notification_queue')
          .update({ status: 'escalated', escalated_at: now.toISOString() })
          .eq('id', notif.id);

        escalated++;
        console.log(`[TASK-FOLLOWUP] 📢 Escalated: ${task.titulo}`);
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'exa_alert',
      event_type: 'task_followup_cron',
      metadata: {
        sent_to_creator: sentToCreator,
        escalated,
        tasks_checked: dueTasks?.length || 0,
        timestamp: now.toISOString()
      }
    });

    console.log(`[TASK-FOLLOWUP] ✅ Done: ${sentToCreator} sent, ${escalated} escalated`);

    return new Response(JSON.stringify({
      success: true,
      sentToCreator,
      escalated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TASK-FOLLOWUP] 💥 ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
