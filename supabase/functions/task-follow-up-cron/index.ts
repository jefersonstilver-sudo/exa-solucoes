import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// M-05: Helper to format date as dd/mm/yyyy
const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
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

    // Read dynamic config for follow-up minutes
    const { data: configRow } = await supabase
      .from('exa_alerts_config')
      .select('config_value')
      .eq('config_key', 'agenda_followup_pos_evento')
      .maybeSingle();

    // M-04: Default changed to 30 minutes
    const followupConfig = configRow?.config_value
      ? (typeof configRow.config_value === 'string' ? JSON.parse(configRow.config_value) : configRow.config_value)
      : { ativo: true, minutos_apos: 30 };

    if (!followupConfig.ativo) {
      console.log('[TASK-FOLLOWUP] Disabled by config');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // M-04: Default fallback changed to 30
    const followupMinutes = followupConfig.minutos_apos || 30;

    const now = new Date();
    const followupDelay = followupMinutes * 60 * 1000;
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // ========== PHASE 1: Send to creator (X min after task time) ==========
    const { data: dueTasks, error: dueError } = await supabase
      .from('tasks')
      .select('id, titulo, data_prevista, horario_limite, horario_inicio, criada_por, auto_followup, status')
      .in('status', ['pendente', 'em_andamento'])
      .eq('auto_followup', true)
      .not('data_prevista', 'is', null);

    if (dueError) {
      console.error('[TASK-FOLLOWUP] ❌ Error fetching tasks:', dueError);
      throw dueError;
    }

    let sentToCreator = 0;
    let sentToResponsaveis = 0;
    let escalated = 0;

    // M-05: Professional template with personalized greeting
    const buildFollowUpMessage = (task: any, taskTime: string, recipientName?: string) => {
      const greeting = recipientName ? `Olá, *${recipientName}*!\n\n` : '';
      
      return `${greeting}` +
        `📋 *Acompanhamento de Compromisso*\n\n` +
        `A atividade abaixo foi encerrada há ${followupMinutes} minutos:\n\n` +
        `*${task.titulo}*\n` +
        `📅 ${formatDate(task.data_prevista)} às ${taskTime}\n\n` +
        `Como foi? Escolha uma opção:\n\n` +
        `*1* ✅  Concluído\n` +
        `*2* 📅  Reagendar\n` +
        `*3* ❌  Cancelar\n\n` +
        `_Responda apenas com o número da opção._`;
    };

    if (dueTasks && dueTasks.length > 0) {
      for (const task of dueTasks) {
        const taskDate = task.data_prevista;
        const taskTime = task.horario_limite || task.horario_inicio || '23:59';
        const taskDateTime = new Date(`${taskDate}T${taskTime}:00-03:00`);

        // Skip if task time + followupDelay hasn't passed yet
        if (taskDateTime.getTime() + followupDelay > now.getTime()) continue;

        // Check if already has active notification
        const { data: existingNotif } = await supabase
          .from('task_notification_queue')
          .select('id, status')
          .eq('task_id', task.id)
          .neq('status', 'resolved')
          .maybeSingle();

        if (existingNotif) continue;

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

        // M-05: Pass creator name to template
        const message = buildFollowUpMessage(task, taskTime, creator.nome);

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

            // M-07: Log follow-up sent in task_status_log
            await supabase.from('task_status_log').insert({
              task_id: task.id,
              status_anterior: task.status || 'pendente',
              status_novo: task.status || 'pendente',
              motivo: `Follow-up automático enviado via WhatsApp para ${creator.nome || 'criador'} às ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
              alterado_por: null,
            });

            sentToCreator++;
            console.log(`[TASK-FOLLOWUP] ✅ Phase 1: Sent follow-up to creator for: ${task.titulo}`);
          }
        } catch (err) {
          console.error(`[TASK-FOLLOWUP] ❌ Failed to send for: ${task.titulo}`, err);
        }

        // ========== PHASE 1.5: Send to task_responsaveis ==========
        try {
          const { data: responsaveis } = await supabase
            .from('task_responsaveis')
            .select('user_id')
            .eq('task_id', task.id);

          if (responsaveis && responsaveis.length > 0) {
            const responsavelIds = responsaveis
              .map(r => r.user_id)
              .filter(uid => uid !== task.criada_por);

            if (responsavelIds.length > 0) {
              const { data: responsavelUsers } = await supabase
                .from('users')
                .select('id, telefone, nome')
                .in('id', responsavelIds);

              for (const user of responsavelUsers || []) {
                if (!user.telefone) continue;

                // M-05: Pass responsável name to template
                const respMessage = buildFollowUpMessage(task, taskTime, user.nome);

                try {
                  const { error: sendErr } = await supabase.functions.invoke('zapi-send-message', {
                    body: {
                      agentKey: 'exa_alert',
                      phone: user.telefone,
                      message: respMessage,
                      skipSplit: true
                    }
                  });

                  if (!sendErr) {
                    sentToResponsaveis++;
                    console.log(`[TASK-FOLLOWUP] ✅ Phase 1.5: Sent to responsável ${user.nome} for: ${task.titulo}`);
                  }
                } catch (sendErr) {
                  console.error(`[TASK-FOLLOWUP] ❌ Phase 1.5 error for ${user.nome}:`, sendErr);
                }
              }
            }
          }
        } catch (respErr) {
          console.error(`[TASK-FOLLOWUP] ❌ Phase 1.5 error fetching responsáveis:`, respErr);
        }
      }
    }

    // ========== PHASE 2: Escalate (30min without response) ==========
    const { data: staleNotifs } = await supabase
      .from('task_notification_queue')
      .select('id, task_id, criado_por, sent_at, status')
      .in('status', ['sent_to_creator'])
      .lt('sent_at', thirtyMinAgo.toISOString());

    if (staleNotifs && staleNotifs.length > 0) {
      const { data: contacts } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, telefone')
        .eq('ativo', true);

      for (const notif of staleNotifs) {
        const { data: escalTask } = await supabase
          .from('tasks')
          .select('titulo, data_prevista, horario_limite, horario_inicio, status')
          .eq('id', notif.task_id)
          .single();

        if (!escalTask) continue;

        const taskTime = escalTask.horario_limite || escalTask.horario_inicio || '';
        const message = `⚠️ *Escalação - Tarefa sem resposta*\n\n` +
          `A tarefa *"${escalTask.titulo}"* agendada para ${formatDate(escalTask.data_prevista)}${taskTime ? ` às ${taskTime}` : ''} não recebeu confirmação do criador.\n\n` +
          `Responda:\n` +
          `*1* - ✅ Concluir tarefa\n` +
          `*2* - 📅 Reagendar\n` +
          `*3* - ❌ Cancelar compromisso`;

        const { data: creator } = await supabase
          .from('users')
          .select('telefone')
          .eq('id', notif.criado_por)
          .single();

        const creatorPhone = creator?.telefone?.replace(/\D/g, '');

        if (contacts) {
          for (const contact of contacts) {
            if (!contact.telefone) continue;
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

        await supabase
          .from('task_notification_queue')
          .update({ status: 'escalated', escalated_at: now.toISOString() })
          .eq('id', notif.id);

        // M-07: Log escalation in task_status_log
        await supabase.from('task_status_log').insert({
          task_id: notif.task_id,
          status_anterior: escalTask.status || 'pendente',
          status_novo: escalTask.status || 'pendente',
          motivo: `Sem resposta após 30min — escalado para diretores às ${now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
          alterado_por: null,
        });

        escalated++;
        console.log(`[TASK-FOLLOWUP] 📢 Escalated: ${escalTask.titulo}`);
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'exa_alert',
      event_type: 'task_followup_cron',
      metadata: {
        sent_to_creator: sentToCreator,
        sent_to_responsaveis: sentToResponsaveis,
        escalated,
        tasks_checked: dueTasks?.length || 0,
        timestamp: now.toISOString()
      }
    });

    console.log(`[TASK-FOLLOWUP] ✅ Done: ${sentToCreator} to creator, ${sentToResponsaveis} to responsáveis, ${escalated} escalated`);

    return new Response(JSON.stringify({
      success: true,
      sentToCreator,
      sentToResponsaveis,
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
