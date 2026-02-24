import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de tipo_evento para emoji e label
const EVENT_TYPE_MAP: Record<string, { emoji: string; label: string }> = {
  reuniao: { emoji: '🤝', label: 'Reunião' },
  tarefa: { emoji: '📋', label: 'Tarefa' },
  instalacao: { emoji: '🔧', label: 'Instalação' },
  manutencao: { emoji: '🔧', label: 'Manutenção' },
  aviso: { emoji: '⚠️', label: 'Aviso' },
  compromisso: { emoji: '📌', label: 'Compromisso' },
  vistoria: { emoji: '🔍', label: 'Vistoria' },
  visita: { emoji: '🏠', label: 'Visita' },
};

function buildRichMessage(params: {
  titulo: string;
  tipo_evento?: string;
  data?: string;
  horario?: string;
  criador_nome?: string;
  descricao?: string;
  local_evento?: string;
  building_name?: string;
  responsaveis_nomes?: string[];
  subtipo_reuniao?: string;
}): string {
  const tipo = params.tipo_evento || 'tarefa';
  const config = EVENT_TYPE_MAP[tipo] || EVENT_TYPE_MAP['tarefa'];
  
  let message = `${config.emoji} *Nov${tipo === 'aviso' ? 'o' : 'a'} ${config.label} agendad${tipo === 'aviso' ? 'o' : 'a'}*\n\n`;
  message += `*${params.titulo}*\n`;
  
  // Data e horário
  if (params.data && params.data !== 'Sem data') {
    message += `📅 Data: ${params.data}`;
    if (params.horario && params.horario !== 'Sem horário') {
      message += ` às ${params.horario}`;
    }
    message += '\n';
  }
  
  // Local (para reuniões)
  if (params.local_evento) {
    message += `📍 Local: ${params.local_evento}\n`;
  }
  
  // Prédio (para instalação/manutenção/vistoria)
  if (params.building_name) {
    message += `🏢 Prédio: ${params.building_name}\n`;
  }
  
  // Criado por
  if (params.criador_nome) {
    message += `👤 Criado por: ${params.criador_nome}\n`;
  }
  
  // Responsáveis
  if (params.responsaveis_nomes && params.responsaveis_nomes.length > 0) {
    message += `👥 Responsáveis: ${params.responsaveis_nomes.join(', ')}\n`;
  }
  
  // Subtipo reunião
  if (params.subtipo_reuniao) {
    const subtipoLabels: Record<string, string> = {
      lead: 'Com Lead/Cliente',
      interna: 'Interna',
      externa: 'Externa',
      fornecedor: 'Com Fornecedor',
    };
    message += `📎 Tipo: ${subtipoLabels[params.subtipo_reuniao] || params.subtipo_reuniao}\n`;
  }
  
  // Descrição
  if (params.descricao) {
    message += `📝 ${params.descricao}\n`;
  }
  
  return message.trim();
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
      task_id, titulo, data, horario, criador_nome, specific_contacts,
      tipo_evento, descricao, local_evento, building_name, 
      responsaveis_nomes, subtipo_reuniao 
    } = await req.json();

    if (!task_id || !titulo) {
      return new Response(JSON.stringify({ error: 'task_id and titulo required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[TASK-NOTIFY] 📤 Notifying contacts about new task:', titulo, '| tipo:', tipo_evento);

    let contacts: { nome: string; telefone: string }[] = [];

    if (specific_contacts && Array.isArray(specific_contacts) && specific_contacts.length > 0) {
      contacts = specific_contacts.filter((c: any) => c.telefone);
      console.log(`[TASK-NOTIFY] 📋 Using ${contacts.length} specific contacts`);
    } else {
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

    // Build rich message
    const message = buildRichMessage({
      titulo,
      tipo_evento,
      data: data || 'Sem data',
      horario: horario || undefined,
      criador_nome: criador_nome || 'Sistema',
      descricao,
      local_evento,
      building_name,
      responsaveis_nomes,
      subtipo_reuniao,
    });

    // Get Z-API config for exa_alert agent
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
        // Try sending with button first (for confirmation)
        if (zapiConfig?.instance_id && zapiConfig?.token) {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (zapiClientToken) headers['Client-Token'] = zapiClientToken;

          // Step 1: Send text message first (guaranteed)
          const textUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
          const textResponse = await fetch(textUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone: formattedPhone, message })
          });

          if (textResponse.ok) {
            sent++;
            console.log(`[TASK-NOTIFY] ✅ Text sent to ${contact.nome}`);

            // Step 2: Try sending confirmation button (bonus, may fail)
            try {
              const buttonUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-button-actions`;
              const buttonId = `task_ack:${task_id}:${formattedPhone}`;
              
              await fetch(buttonUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  phone: formattedPhone,
                  message: "👆 Confirme o recebimento:",
                  buttonActions: [
                    { id: buttonId, type: 'REPLY', label: '✅ Confirmar recebimento' }
                  ],
                  footer: 'Clique para confirmar'
                })
              });
              console.log(`[TASK-NOTIFY] ✅ Button also sent to ${contact.nome}`);
            } catch (btnErr) {
              console.log(`[TASK-NOTIFY] ⚠️ Button failed for ${contact.nome}, text was sent`);
            }
          } else {
            console.error(`[TASK-NOTIFY] ❌ Failed to send text to ${contact.nome}`);
          }

          // Register receipt
          await supabase.from('task_read_receipts').insert({
            task_id: task_id === 'batch' ? null : task_id,
            contact_phone: formattedPhone,
            contact_name: contact.nome,
            status: 'sent',
            sent_at: new Date().toISOString()
          });

        } else {
          // Fallback: use zapi-send-message function
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

            // Register receipt
            await supabase.from('task_read_receipts').insert({
              task_id: task_id === 'batch' ? null : task_id,
              contact_phone: contact.telefone.startsWith('55') ? contact.telefone : `55${contact.telefone}`,
              contact_name: contact.nome,
              status: 'sent',
              sent_at: new Date().toISOString()
            });
          }
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
        tipo_evento: tipo_evento || 'tarefa',
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
