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

    const { phone, message } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'phone and message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const msgTrimmed = message.trim().toUpperCase();
    console.log(`[TASK-RESPONSE] 📥 From ${phone}: "${msgTrimmed}"`);

    // Find active notification for this phone
    // 1. Check by creator phone
    const { data: creatorUser } = await supabase
      .from('users')
      .select('id, telefone')
      .ilike('telefone', `%${phone.slice(-8)}%`)
      .maybeSingle();

    let activeNotif = null;

    if (creatorUser) {
      const { data: notif } = await supabase
        .from('task_notification_queue')
        .select('*')
        .eq('criado_por', creatorUser.id)
        .in('status', ['sent_to_creator', 'escalated'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (notif) activeNotif = notif;
    }

    // 2. Check by responsável — if this user is a responsável for a task with active notification
    if (!activeNotif && creatorUser) {
      const { data: responsavelTasks } = await supabase
        .from('task_responsaveis')
        .select('task_id')
        .eq('user_id', creatorUser.id);

      if (responsavelTasks && responsavelTasks.length > 0) {
        const taskIds = responsavelTasks.map(r => r.task_id);
        const { data: notif } = await supabase
          .from('task_notification_queue')
          .select('*')
          .in('task_id', taskIds)
          .in('status', ['sent_to_creator', 'escalated'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (notif) activeNotif = notif;
      }
    }

    // 3. Fallback: check escalation contacts (any active notification)
    if (!activeNotif) {
      const { data: notifs } = await supabase
        .from('task_notification_queue')
        .select('*')
        .in('status', ['sent_to_creator', 'escalated'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (notifs) activeNotif = notifs;
    }

    if (!activeNotif) {
      console.log('[TASK-RESPONSE] ⚠️ No active notification found for phone:', phone);
      return new Response(JSON.stringify({ handled: false, reason: 'no_active_notification' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get task info
    const { data: task } = await supabase
      .from('tasks')
      .select('id, titulo, data_prevista, criada_por')
      .eq('id', activeNotif.task_id)
      .single();

    if (!task) {
      return new Response(JSON.stringify({ handled: false, reason: 'task_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sendReply = async (replyMsg: string) => {
      await supabase.functions.invoke('zapi-send-message', {
        body: { agentKey: 'exa_alert', phone, message: replyMsg, skipSplit: true }
      });
    };

    // Helper: notify creator when a responsável takes action
    const notifyCreatorOfAction = async (actionDesc: string, respondentPhone: string) => {
      // Only notify if the responder is not the creator
      if (!task.criada_por) return;
      const { data: creator } = await supabase
        .from('users')
        .select('telefone, nome')
        .eq('id', task.criada_por)
        .single();
      
      if (!creator?.telefone) return;
      const creatorPhoneClean = creator.telefone.replace(/\D/g, '');
      const respondentClean = respondentPhone.replace(/\D/g, '');
      if (creatorPhoneClean.includes(respondentClean.slice(-8))) return; // same person

      // Find respondent name
      const { data: respondent } = await supabase
        .from('users')
        .select('nome')
        .ilike('telefone', `%${respondentPhone.slice(-8)}%`)
        .maybeSingle();
      const respondentName = respondent?.nome || respondentPhone;

      await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey: 'exa_alert',
          phone: creator.telefone,
          message: `📋 *Atualização de Tarefa*\n\n${actionDesc}\n\n📋 *"${task.titulo}"*\n👤 Respondido por: ${respondentName}`,
          skipSplit: true
        }
      });
    };

    // ========== HANDLE CONFIRMATION (SIM/NAO) ==========
    if (activeNotif.awaiting_confirmation) {
      if (msgTrimmed === 'SIM' || msgTrimmed === 'S') {
        const action = activeNotif.pending_action;

        if (action === 'concluir') {
          await supabase.from('tasks').update({
            status: 'concluida',
            data_conclusao: new Date().toISOString(),
          }).eq('id', task.id);

          await supabase.from('task_notification_queue').update({
            status: 'resolved',
            action: 'concluir',
            resposta_de: phone,
            resolved_at: new Date().toISOString(),
            awaiting_confirmation: false
          }).eq('id', activeNotif.id);

          await sendReply(`✅ *Tarefa concluída!*\n\n"${task.titulo}" foi marcada como concluída com sucesso.`);
          await notifyCreatorOfAction('✅ Tarefa marcada como *concluída*.', phone);

          // Notify all contacts
          const { data: contacts } = await supabase
            .from('exa_alerts_directors')
            .select('telefone')
            .eq('ativo', true);

          if (contacts) {
            for (const c of contacts) {
              if (!c.telefone || c.telefone.replace(/\D/g, '').includes(phone.slice(-8))) continue;
              await supabase.functions.invoke('zapi-send-message', {
                body: {
                  agentKey: 'exa_alert',
                  phone: c.telefone,
                  message: `✅ A tarefa *"${task.titulo}"* foi marcada como *concluída*.`,
                  skipSplit: true
                }
              });
            }
          }

        } else if (action === 'reagendar') {
          const newDate = activeNotif.nova_data;
          if (newDate) {
            await supabase.from('tasks').update({
              data_prevista: newDate,
              status: 'pendente'
            }).eq('id', task.id);

            await supabase.from('task_notification_queue').update({
              status: 'resolved',
              action: 'reagendar',
              resposta_de: phone,
              resolved_at: new Date().toISOString(),
              awaiting_confirmation: false
            }).eq('id', activeNotif.id);

            await sendReply(`📅 *Tarefa reagendada!*\n\n"${task.titulo}" foi reagendada para ${newDate}.`);
            await notifyCreatorOfAction(`📅 Tarefa *reagendada* para ${newDate}.`, phone);

            const { data: contacts } = await supabase
              .from('exa_alerts_directors')
              .select('telefone')
              .eq('ativo', true);

            if (contacts) {
              for (const c of contacts) {
                if (!c.telefone || c.telefone.replace(/\D/g, '').includes(phone.slice(-8))) continue;
                await supabase.functions.invoke('zapi-send-message', {
                  body: {
                    agentKey: 'exa_alert',
                    phone: c.telefone,
                    message: `📅 A tarefa *"${task.titulo}"* foi *reagendada* para ${newDate}.`,
                    skipSplit: true
                  }
                });
              }
            }
          }

        } else if (action === 'cancelar') {
          const justificativa = activeNotif.justificativa || 'Sem justificativa';

          await supabase.from('tasks').update({
            status: 'cancelada'
          }).eq('id', task.id);

          await supabase.from('task_notification_queue').update({
            status: 'resolved',
            action: 'cancelar',
            resposta_de: phone,
            resolved_at: new Date().toISOString(),
            awaiting_confirmation: false
          }).eq('id', activeNotif.id);

          await sendReply(`❌ *Compromisso cancelado!*\n\n"${task.titulo}" foi cancelado.\nJustificativa enviada ao gestor.`);
          await notifyCreatorOfAction(`❌ Compromisso *cancelado*.\n📝 Justificativa: ${justificativa}`, phone);

          // Send justification to CEO
          const { data: ceoUsers } = await supabase
            .from('users')
            .select('telefone')
            .eq('role', 'ceo');

          if (ceoUsers) {
            for (const ceo of ceoUsers) {
              if (!ceo.telefone) continue;
              await supabase.functions.invoke('zapi-send-message', {
                body: {
                  agentKey: 'exa_alert',
                  phone: ceo.telefone,
                  message: `⚠️ *Compromisso cancelado*\n\n📋 "${task.titulo}"\n📝 Justificativa: ${justificativa}\n👤 Cancelado por: ${phone}`,
                  skipSplit: true
                }
              });
            }
          }

          const { data: contacts } = await supabase
            .from('exa_alerts_directors')
            .select('telefone')
            .eq('ativo', true);

          if (contacts) {
            for (const c of contacts) {
              if (!c.telefone || c.telefone.replace(/\D/g, '').includes(phone.slice(-8))) continue;
              await supabase.functions.invoke('zapi-send-message', {
                body: {
                  agentKey: 'exa_alert',
                  phone: c.telefone,
                  message: `❌ A tarefa *"${task.titulo}"* foi *cancelada*.`,
                  skipSplit: true
                }
              });
            }
          }
        }

        // Log
        await supabase.from('agent_logs').insert({
          agent_key: 'exa_alert',
          event_type: `task_${action}_confirmed`,
          metadata: {
            task_id: task.id,
            titulo: task.titulo,
            confirmed_by: phone,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(JSON.stringify({ handled: true, action, confirmed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else if (msgTrimmed === 'NAO' || msgTrimmed === 'NÃO' || msgTrimmed === 'N') {
        await supabase.from('task_notification_queue').update({
          awaiting_confirmation: false,
          pending_action: null
        }).eq('id', activeNotif.id);

        await sendReply(`↩️ Ação cancelada. Responda:\n*1* - Concluir\n*2* - Reagendar\n*3* - Cancelar`);

        return new Response(JSON.stringify({ handled: true, action: 'cancelled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== HANDLE DATE INPUT (for reschedule) ==========
    if (activeNotif.pending_action === 'reagendar' && !activeNotif.awaiting_confirmation) {
      const dateMatch = msgTrimmed.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = new Date().getFullYear();
        const newDate = `${year}-${month}-${day}`;

        await supabase.from('task_notification_queue').update({
          nova_data: newDate,
          awaiting_confirmation: true
        }).eq('id', activeNotif.id);

        await sendReply(`📅 Confirma reagendar *"${task.titulo}"* para *${day}/${month}/${year}*?\n\nResponda *SIM* para confirmar ou *NAO* para cancelar.`);

        return new Response(JSON.stringify({ handled: true, action: 'date_received' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== HANDLE JUSTIFICATION (for cancel) ==========
    if (activeNotif.pending_action === 'cancelar' && !activeNotif.awaiting_confirmation) {
      await supabase.from('task_notification_queue').update({
        justificativa: message.trim(),
        awaiting_confirmation: true
      }).eq('id', activeNotif.id);

      await sendReply(`Confirma cancelar *"${task.titulo}"*?\n\n📝 Justificativa: "${message.trim()}"\n⚠️ A justificativa será enviada ao gestor.\n\nResponda *SIM* para confirmar ou *NAO* para cancelar.`);

      return new Response(JSON.stringify({ handled: true, action: 'justification_received' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== HANDLE MENU CHOICES (1, 2, 3) ==========
    if (msgTrimmed === '1') {
      await supabase.from('task_notification_queue').update({
        pending_action: 'concluir',
        awaiting_confirmation: true
      }).eq('id', activeNotif.id);

      await sendReply(`Tem certeza que a tarefa *"${task.titulo}"* foi concluída?\n\nResponda *SIM* para confirmar.`);

      return new Response(JSON.stringify({ handled: true, action: 'concluir_requested' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (msgTrimmed === '2') {
      await supabase.from('task_notification_queue').update({
        pending_action: 'reagendar'
      }).eq('id', activeNotif.id);

      await sendReply(`📅 Para qual data deseja reagendar *"${task.titulo}"*?\n\nResponda no formato: *dd/mm* (ex: 25/02)`);

      return new Response(JSON.stringify({ handled: true, action: 'reagendar_requested' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (msgTrimmed === '3') {
      await supabase.from('task_notification_queue').update({
        pending_action: 'cancelar'
      }).eq('id', activeNotif.id);

      await sendReply(`❌ Qual a justificativa para cancelar *"${task.titulo}"*?\n\n⚠️ A justificativa será enviada ao gestor.`);

      return new Response(JSON.stringify({ handled: true, action: 'cancelar_requested' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Not a recognized response
    return new Response(JSON.stringify({ handled: false, reason: 'unrecognized_input' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[TASK-RESPONSE] 💥 ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
