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

    const { phone, message, sender_name } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'phone and message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const msgTrimmed = message.trim().toUpperCase();
    console.log(`[TASK-RESPONSE] 📥 From ${phone} (name=${sender_name || '-'}): "${msgTrimmed}"`);

    const phoneDigits = phone.replace(/\D/g, '');
    const phoneTail = phoneDigits.slice(-8);
    const phoneVariants = Array.from(new Set([
      phoneDigits,
      phoneDigits.startsWith('55') ? phoneDigits.slice(2) : `55${phoneDigits}`,
      phone,
    ].filter(Boolean)));

    // Find active notification for this phone
    let activeNotif: any = null;
    let matchedReceipt: any = null;

    // 0. PRIORIDADE: procurar via task_read_receipts (telefone que recebeu a tarefa)
    try {
      const orFilter = phoneVariants.map(p => `contact_phone.ilike.%${p.slice(-8)}%`).join(',');
      const { data: receipts } = await supabase
        .from('task_read_receipts')
        .select('id, task_id, contact_phone, contact_name, status, sent_at')
        .or(orFilter)
        .order('sent_at', { ascending: false })
        .limit(5);

      if (receipts && receipts.length > 0) {
        matchedReceipt = receipts[0];
        const taskIds = receipts.map((r: any) => r.task_id).filter(Boolean);
        if (taskIds.length > 0) {
          const { data: notif } = await supabase
            .from('task_notification_queue')
            .select('*')
            .in('task_id', taskIds)
            .neq('status', 'resolved')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (notif) activeNotif = notif;
        }
      }
    } catch (recErr) {
      console.warn('[TASK-RESPONSE] ⚠️ Receipts lookup failed:', (recErr as Error).message);
    }

    // 0b. Fallback: procurar receipts por nome (quando webhook veio com @lid e mapeou pelo nome)
    if (!matchedReceipt && sender_name) {
      const { data: byName } = await supabase
        .from('task_read_receipts')
        .select('id, task_id, contact_phone, contact_name, status, sent_at')
        .ilike('contact_name', `%${sender_name}%`)
        .order('sent_at', { ascending: false })
        .limit(5);
      if (byName && byName.length > 0) {
        matchedReceipt = byName[0];
        if (!activeNotif) {
          const taskIds = byName.map((r: any) => r.task_id).filter(Boolean);
          const { data: notif } = await supabase
            .from('task_notification_queue')
            .select('*')
            .in('task_id', taskIds)
            .neq('status', 'resolved')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (notif) activeNotif = notif;
        }
      }
    }


    // 1. Fallback: por criador (telefone do usuário)
    const { data: creatorUser } = await supabase
      .from('users')
      .select('id, telefone, nome')
      .ilike('telefone', `%${phoneTail}%`)
      .maybeSingle();

    if (!activeNotif && creatorUser) {
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

    // 2. Fallback: por responsável
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

    if (!activeNotif) {
      console.log('[TASK-RESPONSE] ⚠️ No active notification found for phone:', phone);

      // Se a pessoa respondeu 1/2/3/SIM/NAO, devolver uma resposta clara
      const isMenu = ['1', '2', '3', 'SIM', 'S', 'NAO', 'NÃO', 'N'].includes(msgTrimmed);
      if (isMenu) {
        try {
          await supabase.functions.invoke('zapi-send-message', {
            body: {
              agentKey: 'exa_alert',
              phone,
              message: `ℹ️ Não encontrei uma tarefa pendente vinculada a este número.\n\nSe você acabou de receber uma nova tarefa, aguarde alguns segundos e responda novamente.`,
              skipSplit: true,
            },
          });
        } catch (_e) {
          // silencioso
        }
      }

      return new Response(JSON.stringify({ handled: false, reason: 'no_active_notification' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }


    // ========== M-03: LOCK CHECK ==========
    // For menu choices (1/2/3), check concurrency lock before processing
    const isMenuChoice = ['1', '2', '3'].includes(msgTrimmed);
    if (isMenuChoice && activeNotif.locked_by && activeNotif.locked_by !== phone) {
      const lockedAt = activeNotif.locked_at ? new Date(activeNotif.locked_at).getTime() : 0;
      const lockedMinutesAgo = Math.floor((Date.now() - lockedAt) / 60000);
      if (lockedMinutesAgo < 10) {
        const sendReplyLock = async (replyMsg: string) => {
          await supabase.functions.invoke('zapi-send-message', {
            body: { agentKey: 'exa_alert', phone, message: replyMsg, skipSplit: true }
          });
        };
        await sendReplyLock(`⏳ Outra pessoa já está respondendo a esta tarefa. Aguarde alguns instantes.`);
        return new Response(JSON.stringify({ handled: true, action: 'locked_by_other' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get task info
    const { data: task } = await supabase
      .from('tasks')
      .select('id, titulo, data_prevista, created_by, status, descricao, local_evento, link_reuniao, horario_inicio, horario_limite')
      .eq('id', activeNotif.task_id)
      .single();

    if (!task) {
      return new Response(JSON.stringify({ handled: false, reason: 'task_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Resolve respondent user
    const respondentUser = creatorUser;
    const respondentName = respondentUser?.nome || phone;

    const sendReply = async (replyMsg: string) => {
      await supabase.functions.invoke('zapi-send-message', {
        body: { agentKey: 'exa_alert', phone, message: replyMsg, skipSplit: true }
      });
    };

    // Helper: notify creator when a responsável takes action
    const notifyCreatorOfAction = async (actionDesc: string, respondentPhone: string) => {
      if (!task.created_by) return;
      const { data: creator } = await supabase
        .from('users')
        .select('telefone, nome')
        .eq('id', task.created_by)
        .single();
      
      if (!creator?.telefone) return;
      const creatorPhoneClean = creator.telefone.replace(/\D/g, '');
      const respondentClean = respondentPhone.replace(/\D/g, '');
      if (creatorPhoneClean.includes(respondentClean.slice(-8))) return;

      const { data: respondent } = await supabase
        .from('users')
        .select('nome')
        .ilike('telefone', `%${respondentPhone.slice(-8)}%`)
        .maybeSingle();
      const rName = respondent?.nome || respondentPhone;

      await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey: 'exa_alert',
          phone: creator.telefone,
          message: `📋 *Atualização de Tarefa*\n\n${actionDesc}\n\n📋 *"${task.titulo}"*\n👤 Respondido por: ${rName}`,
          skipSplit: true
        }
      });
    };

    // Helper: insert task_status_log
    const logStatusChange = async (statusAnterior: string, statusNovo: string, motivo: string) => {
      await supabase.from('task_status_log').insert({
        task_id: task.id,
        status_anterior: statusAnterior,
        status_novo: statusNovo,
        motivo,
        alterado_por: respondentUser?.id || null,
      });
    };

    // Helper: format date dd/mm/yyyy
    const formatDateBR = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    // ========== HANDLE CONFIRMATION (SIM/NAO) ==========
    if (activeNotif.awaiting_confirmation) {
      if (msgTrimmed === 'SIM' || msgTrimmed === 'S') {
        const action = activeNotif.pending_action;

        if (action === 'concluir') {
          // M-01: Update task with concluida_por
          await supabase.from('tasks').update({
            status: 'concluida',
            data_conclusao: new Date().toISOString(),
            concluida_por: respondentUser?.id || null,
          }).eq('id', task.id);

          await supabase.from('task_notification_queue').update({
            status: 'resolved',
            action: 'concluir',
            resposta_de: phone,
            resolved_at: new Date().toISOString(),
            awaiting_confirmation: false,
            locked_by: null,
            locked_at: null,
          }).eq('id', activeNotif.id);

          // M-01/M-07: Register in task_status_log
          await logStatusChange(task.status || 'pendente', 'concluida', `Concluída via WhatsApp por ${respondentName}`);

          await sendReply(`✅ *Tarefa concluída!*\n\n"${task.titulo}" foi marcada como concluída com sucesso.`);
          await notifyCreatorOfAction('✅ Tarefa marcada como *concluída*.', phone);

          // Notify only task_read_receipts contacts (not all directors)
          const { data: taskReceipts } = await supabase
            .from('task_read_receipts')
            .select('contact_phone, contact_name')
            .eq('task_id', task.id);

          if (taskReceipts) {
            for (const c of taskReceipts) {
              if (!c.contact_phone || c.contact_phone.replace(/\D/g, '').includes(phone.slice(-8))) continue;
              await supabase.functions.invoke('zapi-send-message', {
                body: {
                  agentKey: 'exa_alert',
                  phone: c.contact_phone,
                  message: `✅ A tarefa *"${task.titulo}"* foi marcada como *concluída*.`,
                  skipSplit: true
                }
              });
            }
          }

        } else if (action === 'reagendar') {
          const newDate = activeNotif.nova_data;
          const newHour = activeNotif.nova_hora;
          if (newDate) {
            const updatePayload: any = {
              data_prevista: newDate,
              status: 'pendente'
            };
            if (newHour) {
              updatePayload.horario_inicio = newHour;
              updatePayload.horario_limite = newHour;
            }
            await supabase.from('tasks').update(updatePayload).eq('id', task.id);

            // Reset fired_at on all task_reminders for this task
            await supabase.from('task_reminders').update({ fired_at: null }).eq('task_id', task.id);

            await supabase.from('task_notification_queue').update({
              status: 'resolved',
              action: 'reagendar',
              resposta_de: phone,
              resolved_at: new Date().toISOString(),
              awaiting_confirmation: false,
              locked_by: null,
              locked_at: null,
            }).eq('id', activeNotif.id);

            const dateFormatted = formatDateBR(newDate);
            const timeStr = newHour ? ` às ${newHour.slice(0,5)}` : '';

            // M-07: Register in task_status_log
            await logStatusChange(task.status || 'pendente', 'pendente', `Reagendado via WhatsApp para ${dateFormatted}${timeStr} por ${respondentName}`);

            // Build rich reschedule message
            let rescheduleMsg = `📅 *Tarefa reagendada!*\n\n*${task.titulo}*\n\n📅 Nova data: *${dateFormatted}${timeStr}*`;
            if (task.local_evento) rescheduleMsg += `\n📍 ${task.local_evento}`;
            if (task.link_reuniao) rescheduleMsg += `\n🔗 ${task.link_reuniao}`;
            if (task.descricao) rescheduleMsg += `\n📝 ${task.descricao}`;

            await sendReply(rescheduleMsg);
            await notifyCreatorOfAction(`📅 Tarefa *reagendada* para ${dateFormatted}${timeStr}.`, phone);

            // Notify only task_read_receipts contacts
            const { data: reschReceipts } = await supabase
              .from('task_read_receipts')
              .select('contact_phone, contact_name')
              .eq('task_id', task.id);

            if (reschReceipts) {
              for (const c of reschReceipts) {
                if (!c.contact_phone || c.contact_phone.replace(/\D/g, '').includes(phone.slice(-8))) continue;
                let dirMsg = `📅 A tarefa *"${task.titulo}"* foi *reagendada* para ${dateFormatted}${timeStr}.`;
                if (task.local_evento) dirMsg += `\n📍 ${task.local_evento}`;
                if (task.link_reuniao) dirMsg += `\n🔗 ${task.link_reuniao}`;
                await supabase.functions.invoke('zapi-send-message', {
                  body: {
                    agentKey: 'exa_alert',
                    phone: c.contact_phone,
                    message: dirMsg,
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
            awaiting_confirmation: false,
            locked_by: null,
            locked_at: null,
          }).eq('id', activeNotif.id);

          // M-07: Register in task_status_log
          await logStatusChange(task.status || 'pendente', 'cancelada', `Cancelado via WhatsApp por ${respondentName}. Motivo: ${justificativa}`);

          await sendReply(`❌ *Compromisso cancelado!*\n\n"${task.titulo}" foi cancelado.\nJustificativa enviada ao gestor.`);
          await notifyCreatorOfAction(`❌ Compromisso *cancelado*.\n📝 Justificativa: ${justificativa}`, phone);

          // Notify only task_read_receipts contacts (no CEO fallback, no directors broadcast)
          const { data: cancelReceipts } = await supabase
            .from('task_read_receipts')
            .select('contact_phone, contact_name')
            .eq('task_id', task.id);

          if (cancelReceipts) {
            for (const c of cancelReceipts) {
              if (!c.contact_phone || c.contact_phone.replace(/\D/g, '').includes(phone.slice(-8))) continue;
              await supabase.functions.invoke('zapi-send-message', {
                body: {
                  agentKey: 'exa_alert',
                  phone: c.contact_phone,
                  message: `❌ A tarefa *"${task.titulo}"* foi *cancelada*.\n📝 Justificativa: ${justificativa}`,
                  skipSplit: true
                }
              });
            }
          }
        }

        // Log
        await supabase.from('agent_logs').insert({
          agent_key: 'exa_alert',
          event_type: `task_${activeNotif.pending_action}_confirmed`,
          metadata: {
            task_id: task.id,
            titulo: task.titulo,
            confirmed_by: phone,
            confirmed_by_name: respondentName,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(JSON.stringify({ handled: true, action: activeNotif.pending_action, confirmed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else if (msgTrimmed === 'NAO' || msgTrimmed === 'NÃO' || msgTrimmed === 'N') {
        await supabase.from('task_notification_queue').update({
          awaiting_confirmation: false,
          pending_action: null,
          locked_by: null,
          locked_at: null,
        }).eq('id', activeNotif.id);

        await sendReply(`↩️ Ação cancelada. Responda:\n*1* - Concluir\n*2* - Reagendar\n*3* - Cancelar`);

        return new Response(JSON.stringify({ handled: true, action: 'cancelled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== M-02: HANDLE TIME INPUT (for reschedule awaiting hour) ==========
    if (activeNotif.pending_action === 'reagendar_aguardando_horario' && !activeNotif.awaiting_confirmation) {
      const timeMatch = msgTrimmed.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          const dateFormatted = activeNotif.nova_data ? formatDateBR(activeNotif.nova_data) : '';

          await supabase.from('task_notification_queue').update({
            nova_hora: formattedTime,
            awaiting_confirmation: true,
            pending_action: 'reagendar',
          }).eq('id', activeNotif.id);

          await sendReply(`📅 Confirma reagendar *"${task.titulo}"* para *${dateFormatted}* às *${formattedTime}*?\n\nResponda *SIM* para confirmar ou *NAO* para cancelar.`);

          return new Response(JSON.stringify({ handled: true, action: 'time_received' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      // Invalid time format
      await sendReply(`⚠️ Horário inválido. Informe no formato *HH:MM* (ex: 14:30)`);
      return new Response(JSON.stringify({ handled: true, action: 'invalid_time' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========== HANDLE DATE INPUT (for reschedule) — M-02 expanded ==========
    if (activeNotif.pending_action === 'reagendar' && !activeNotif.awaiting_confirmation) {
      const dateMatch = msgTrimmed.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = new Date().getFullYear();
        const newDate = `${year}-${month}-${day}`;

        await supabase.from('task_notification_queue').update({
          nova_data: newDate,
          pending_action: 'reagendar_aguardando_horario',
        }).eq('id', activeNotif.id);

        await sendReply(`📅 Data recebida: *${day}/${month}/${year}*.\n\nAgora informe o novo horário no formato *HH:MM* (ex: 14:30)`);

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

    // ========== HANDLE MENU CHOICES (1, 2, 3) — with M-03 lock ==========
    // 1 = ✅ Confirmar (visualização do compromisso). Marca receipt como 'read'
    //     e atualiza a tela de Confirmações na UI. NÃO conclui a tarefa.
    if (msgTrimmed === '1') {
      // Marca o recibo deste contato como lido
      let updatedReceiptId: string | null = null;
      try {
        let receiptQuery = supabase
          .from('task_read_receipts')
          .select('id, contact_phone, contact_name, status')
          .eq('task_id', task.id)
          .order('sent_at', { ascending: false });

        const orFilter = phoneVariants.map(p => `contact_phone.ilike.%${p.slice(-8)}%`).join(',');
        const { data: candidates } = await receiptQuery.or(orFilter).limit(5);

        let chosen = (candidates || [])[0];
        if (!chosen && matchedReceipt && matchedReceipt.task_id === task.id) {
          chosen = matchedReceipt;
        }
        if (!chosen) {
          // último recurso: por nome do remetente, se vier
          const { data: byName } = await supabase
            .from('task_read_receipts')
            .select('id, contact_phone, contact_name, status')
            .eq('task_id', task.id)
            .ilike('contact_name', `%${respondentName}%`)
            .limit(1)
            .maybeSingle();
          if (byName) chosen = byName;
        }

        if (chosen) {
          await supabase
            .from('task_read_receipts')
            .update({ status: 'read', read_at: new Date().toISOString() })
            .eq('id', chosen.id);
          updatedReceiptId = chosen.id;
        }
      } catch (e) {
        console.warn('[TASK-RESPONSE] confirm receipt update failed:', (e as Error).message);
      }

      // Mantém a fila ativa (não resolve) para permitir 2/3 depois,
      // mas limpa qualquer ação pendente residual.
      await supabase.from('task_notification_queue').update({
        pending_action: null,
        awaiting_confirmation: false,
        locked_by: null,
        locked_at: null,
      }).eq('id', activeNotif.id);

      await supabase.from('agent_logs').insert({
        agent_key: 'exa_alert',
        event_type: 'task_visualization_confirmed',
        metadata: {
          task_id: task.id,
          titulo: task.titulo,
          confirmed_by: phone,
          confirmed_by_name: respondentName,
          receipt_id: updatedReceiptId,
          timestamp: new Date().toISOString(),
        },
      });

      const nowBr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      await sendReply(
        `✅ *Confirmação registrada*\n\n📋 *${task.titulo}*\n👤 ${respondentName}\n⏰ ${nowBr}\n\n_Se precisar, ainda pode responder *2* para remarcar ou *3* para cancelar._`,
      );

      return new Response(JSON.stringify({ handled: true, action: 'visualization_confirmed', receipt_id: updatedReceiptId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }


    if (msgTrimmed === '2') {
      await supabase.from('task_notification_queue').update({
        pending_action: 'reagendar',
        locked_by: phone,
        locked_at: new Date().toISOString(),
      }).eq('id', activeNotif.id);

      await sendReply(`📅 Para qual data deseja reagendar *"${task.titulo}"*?\n\nResponda no formato: *dd/mm* (ex: 25/02)`);

      return new Response(JSON.stringify({ handled: true, action: 'reagendar_requested' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (msgTrimmed === '3') {
      await supabase.from('task_notification_queue').update({
        pending_action: 'cancelar',
        locked_by: phone,
        locked_at: new Date().toISOString(),
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
