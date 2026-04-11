import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleIntent {
  title: string;
  date: string;
  time?: string;
  description?: string;
}

interface ConversationState {
  state: 'pending_confirmation' | 'pending_recipients' | 'pending_names' | 'completed';
  intent: ScheduleIntent;
  selectedRecipients?: string[];
  createdBy: string;
  createdByName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, phone, conversationId, intent, buttonResponse, selectedName } = await req.json();

    console.log('[SCHEDULE-INTENT] 📅 Processing:', { action, phone, intent, buttonResponse });

    // Get Z-API config from sofia agent
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'sofia')
      .single();

    const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiConfig?.instance_id || !zapiConfig?.token || !zapiClientToken) {
      console.error('[SCHEDULE-INTENT] ❌ Z-API not configured');
      return new Response(JSON.stringify({ error: 'Z-API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}`;

    // Helper to send text message
    const sendMessage = async (text: string) => {
      await fetch(`${zapiUrl}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': zapiClientToken
        },
        body: JSON.stringify({ phone, message: text })
      });
    };

    // Helper to send button message
    const sendButtons = async (text: string, buttons: { id: string; label: string }[]) => {
      await fetch(`${zapiUrl}/send-button-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': zapiClientToken
        },
        body: JSON.stringify({
          phone,
          message: text,
          buttonList: {
            buttons: buttons.map(b => ({
              id: b.id,
              label: b.label
            }))
          }
        })
      });
    };

    // Get contact info by phone
    const { data: contactInfo } = await supabase
      .from('exa_alerts_directors')
      .select('id, nome, pode_agendar')
      .eq('telefone', phone.replace(/\D/g, ''))
      .eq('ativo', true)
      .maybeSingle();

    if (!contactInfo) {
      console.log('[SCHEDULE-INTENT] ❌ Contact not found or not authorized:', phone);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Contact not authorized' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!contactInfo.pode_agendar) {
      await sendMessage('❌ Você não tem permissão para agendar lembretes. Entre em contato com o administrador.');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Contact cannot schedule' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle different actions
    switch (action) {
      case 'new_intent': {
        // New scheduling intent detected
        const parsedIntent = intent as ScheduleIntent;
        
        // Format date for display
        const dateObj = new Date(parsedIntent.date);
        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        // Save state in agent_context
        const stateKey = `schedule_state_${conversationId}`;
        await supabase.from('agent_context').upsert({
          key: stateKey,
          value: {
            state: 'pending_confirmation',
            intent: parsedIntent,
            createdBy: phone,
            createdByName: contactInfo.nome
          } as ConversationState
        });

        // Send confirmation message with buttons
        const confirmMsg = `📋 *Entendi! Você quer criar um lembrete:*

📝 *Tarefa:* ${parsedIntent.title}
📅 *Data:* ${formattedDate}
🕐 *Horário:* ${parsedIntent.time || '09:00'}
${parsedIntent.description ? `📄 *Detalhes:* ${parsedIntent.description}` : ''}

✅ *Está correto?*`;

        await sendButtons(confirmMsg, [
          { id: `schedule_confirm_yes_${conversationId}`, label: '✅ Sim, criar' },
          { id: `schedule_confirm_edit_${conversationId}`, label: '✏️ Editar' },
          { id: `schedule_confirm_cancel_${conversationId}`, label: '❌ Cancelar' }
        ]);

        return new Response(JSON.stringify({ 
          success: true, 
          state: 'pending_confirmation' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'confirm_yes': {
        // User confirmed, ask about recipients
        const stateKey = `schedule_state_${conversationId}`;
        const { data: stateData } = await supabase
          .from('agent_context')
          .select('value')
          .eq('key', stateKey)
          .single();

        if (!stateData) {
          await sendMessage('❌ Sessão expirada. Por favor, tente novamente.');
          return new Response(JSON.stringify({ error: 'State not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const currentState = stateData.value as ConversationState;
        currentState.state = 'pending_recipients';

        await supabase.from('agent_context').update({
          value: currentState
        }).eq('key', stateKey);

        await sendButtons('🔔 *Quem deve receber o alerta?*', [
          { id: `schedule_recipients_all_${conversationId}`, label: '👥 Todos' },
          { id: `schedule_recipients_specific_${conversationId}`, label: '👤 Pessoas específicas' },
          { id: `schedule_recipients_me_${conversationId}`, label: '🙋 Só eu' }
        ]);

        return new Response(JSON.stringify({ 
          success: true, 
          state: 'pending_recipients' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'recipients_all': 
      case 'recipients_me': {
        // Create task for all or just sender
        const stateKey = `schedule_state_${conversationId}`;
        const { data: stateData } = await supabase
          .from('agent_context')
          .select('value')
          .eq('key', stateKey)
          .single();

        if (!stateData) {
          await sendMessage('❌ Sessão expirada. Por favor, tente novamente.');
          return new Response(JSON.stringify({ error: 'State not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const currentState = stateData.value as ConversationState;
        const taskIntent = currentState.intent;

        // Get recipients
        let responsaveisIds: string[] = [];
        if (action === 'recipients_all') {
          const { data: allContacts } = await supabase
            .from('exa_alerts_directors')
            .select('id')
            .eq('ativo', true);
          responsaveisIds = allContacts?.map(c => c.id) || [];
        } else {
          responsaveisIds = [contactInfo.id];
        }

        // Create task in notion_tasks
        const { data: newTask, error: taskError } = await supabase
          .from('notion_tasks')
          .insert({
            nome: taskIntent.title,
            data: taskIntent.date,
            hora: taskIntent.time || '09:00',
            status: 'NÃO REALIZADO',
            prioridade: 'Alta',
            categoria: 'Lembrete',
            responsaveis_ids: responsaveisIds,
            alarme_padrao: true,
            descricao: taskIntent.description || `Criado via WhatsApp por ${currentState.createdByName}`
          })
          .select()
          .single();

        if (taskError) {
          console.error('[SCHEDULE-INTENT] ❌ Error creating task:', taskError);
          await sendMessage('❌ Erro ao criar lembrete. Tente novamente.');
          return new Response(JSON.stringify({ error: taskError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Clean up state
        await supabase.from('agent_context').delete().eq('key', stateKey);

        // Calculate alert time (1 hour before)
        const taskDate = new Date(`${taskIntent.date}T${taskIntent.time || '09:00'}:00`);
        const alertDate = new Date(taskDate.getTime() - 60 * 60 * 1000); // 1 hour before
        const alertTime = alertDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const recipientText = action === 'recipients_all' 
          ? `👥 Todos os contatos (${responsaveisIds.length} pessoas)`
          : '🙋 Só você';

        await sendMessage(`✅ *Lembrete criado com sucesso!*

📝 *${taskIntent.title}*
📅 ${new Date(taskIntent.date).toLocaleDateString('pt-BR')} às ${taskIntent.time || '09:00'}
🔔 Alerta: ${alertTime}
📣 ${recipientText}

O sistema enviará um alerta 1 hora antes no WhatsApp! 📱`);

        // Log the action
        await supabase.from('agent_logs').insert({
          agent_key: 'sofia',
          conversation_id: conversationId,
          event_type: 'schedule_created_via_whatsapp',
          metadata: {
            task_id: newTask.id,
            task_name: taskIntent.title,
            created_by: contactInfo.nome,
            recipients_count: responsaveisIds.length,
            recipients_type: action === 'recipients_all' ? 'all' : 'self',
            timestamp: new Date().toISOString()
          }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          state: 'completed',
          task_id: newTask.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'recipients_specific': {
        // Show list of contacts to choose from
        const stateKey = `schedule_state_${conversationId}`;
        const { data: stateData } = await supabase
          .from('agent_context')
          .select('value')
          .eq('key', stateKey)
          .single();

        if (!stateData) {
          await sendMessage('❌ Sessão expirada.');
          return new Response(JSON.stringify({ error: 'State not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const currentState = stateData.value as ConversationState;
        currentState.state = 'pending_names';
        currentState.selectedRecipients = [];

        await supabase.from('agent_context').update({
          value: currentState
        }).eq('key', stateKey);

        // Get all active contacts
        const { data: allContacts } = await supabase
          .from('exa_alerts_directors')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');

        if (!allContacts || allContacts.length === 0) {
          await sendMessage('❌ Nenhum contato disponível. Use "Todos" ou "Só eu".');
          return new Response(JSON.stringify({ error: 'No contacts' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create buttons for each contact (max 3 due to WhatsApp limits)
        const buttons = allContacts.slice(0, 3).map(c => ({
          id: `schedule_select_${c.id}_${conversationId}`,
          label: c.nome
        }));

        await sendButtons('👤 *Escolha quem deve receber:*\n\n(Selecione um por vez, depois confirme)', buttons);

        return new Response(JSON.stringify({ 
          success: true, 
          state: 'pending_names',
          available_contacts: allContacts.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'select_contact': {
        // Add contact to recipients
        const stateKey = `schedule_state_${conversationId}`;
        const { data: stateData } = await supabase
          .from('agent_context')
          .select('value')
          .eq('key', stateKey)
          .single();

        if (!stateData) {
          await sendMessage('❌ Sessão expirada.');
          return new Response(JSON.stringify({ error: 'State not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const currentState = stateData.value as ConversationState;
        const contactId = selectedName; // This is actually the contact ID

        // Get contact name
        const { data: selectedContact } = await supabase
          .from('exa_alerts_directors')
          .select('nome')
          .eq('id', contactId)
          .single();

        if (!currentState.selectedRecipients) {
          currentState.selectedRecipients = [];
        }

        if (!currentState.selectedRecipients.includes(contactId)) {
          currentState.selectedRecipients.push(contactId);
        }

        await supabase.from('agent_context').update({
          value: currentState
        }).eq('key', stateKey);

        // Get names of selected contacts
        const { data: selectedContacts } = await supabase
          .from('exa_alerts_directors')
          .select('nome')
          .in('id', currentState.selectedRecipients);

        const selectedNames = selectedContacts?.map(c => c.nome).join(', ') || '';

        await sendButtons(`✅ *${selectedContact?.nome}* adicionado!\n\n📋 Selecionados: ${selectedNames}\n\nDeseja adicionar mais alguém?`, [
          { id: `schedule_more_contacts_${conversationId}`, label: '➕ Adicionar mais' },
          { id: `schedule_finish_selection_${conversationId}`, label: '✅ Confirmar e criar' }
        ]);

        return new Response(JSON.stringify({ 
          success: true, 
          selected: currentState.selectedRecipients.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'finish_selection': {
        // Create task with selected recipients
        const stateKey = `schedule_state_${conversationId}`;
        const { data: stateData } = await supabase
          .from('agent_context')
          .select('value')
          .eq('key', stateKey)
          .single();

        if (!stateData) {
          await sendMessage('❌ Sessão expirada.');
          return new Response(JSON.stringify({ error: 'State not found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const currentState = stateData.value as ConversationState;
        const taskIntent = currentState.intent;
        const responsaveisIds = currentState.selectedRecipients || [];

        if (responsaveisIds.length === 0) {
          await sendMessage('❌ Nenhum contato selecionado. Tente novamente.');
          return new Response(JSON.stringify({ error: 'No recipients' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create task
        const { data: newTask, error: taskError } = await supabase
          .from('notion_tasks')
          .insert({
            nome: taskIntent.title,
            data: taskIntent.date,
            hora: taskIntent.time || '09:00',
            status: 'NÃO REALIZADO',
            prioridade: 'Alta',
            categoria: 'Lembrete',
            responsaveis_ids: responsaveisIds,
            alarme_padrao: true,
            descricao: taskIntent.description || `Criado via WhatsApp por ${currentState.createdByName}`
          })
          .select()
          .single();

        if (taskError) {
          console.error('[SCHEDULE-INTENT] ❌ Error creating task:', taskError);
          await sendMessage('❌ Erro ao criar lembrete.');
          return new Response(JSON.stringify({ error: taskError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get selected names
        const { data: selectedContacts } = await supabase
          .from('exa_alerts_directors')
          .select('nome')
          .in('id', responsaveisIds);

        const selectedNames = selectedContacts?.map(c => c.nome).join(', ') || '';

        // Clean up
        await supabase.from('agent_context').delete().eq('key', stateKey);

        await sendMessage(`✅ *Lembrete criado com sucesso!*

📝 *${taskIntent.title}*
📅 ${new Date(taskIntent.date).toLocaleDateString('pt-BR')} às ${taskIntent.time || '09:00'}
📣 Destinatários: ${selectedNames}

O sistema enviará alertas 1 hora antes! 📱`);

        await supabase.from('agent_logs').insert({
          agent_key: 'sofia',
          conversation_id: conversationId,
          event_type: 'schedule_created_via_whatsapp',
          metadata: {
            task_id: newTask.id,
            task_name: taskIntent.title,
            created_by: contactInfo.nome,
            recipients: selectedNames,
            recipients_count: responsaveisIds.length
          }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          state: 'completed',
          task_id: newTask.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'cancel': {
        const stateKey = `schedule_state_${conversationId}`;
        await supabase.from('agent_context').delete().eq('key', stateKey);
        await sendMessage('❌ Agendamento cancelado.');
        return new Response(JSON.stringify({ success: true, state: 'cancelled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('[SCHEDULE-INTENT] ❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
