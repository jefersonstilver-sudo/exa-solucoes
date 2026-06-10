import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Palavras masculinas para concordância de gênero
const MASCULINOS = ['compromisso', 'aviso', 'lembrete', 'evento'];

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

async function resolveEventType(supabase: any, tipoEvento: string): Promise<{ emoji: string; label: string }> {
  // Buscar no banco de dados
  const { data: eventType } = await supabase
    .from('event_types')
    .select('label, icon')
    .eq('name', tipoEvento)
    .eq('active', true)
    .maybeSingle();

  if (eventType) {
    return { emoji: eventType.icon || '📋', label: eventType.label || 'Tarefa' };
  }

  // Fallback básico
  return { emoji: '📋', label: tipoEvento || 'Tarefa' };
}

function buildRichMessage(params: {
  titulo: string;
  tipo_evento?: string;
  data?: string;
  horario?: string;
  horario_inicio?: string;
  criador_nome?: string;
  descricao?: string;
  local_evento?: string;
  building_name?: string;
  responsaveis_nomes?: string[];
  subtipo_reuniao?: string;
  link_reuniao?: string;
  prioridade?: string;
  lead_nome?: string;
  lead_empresa?: string;
  lead_telefone?: string;
  propostas_info?: string[];
  emoji: string;
  label: string;
}): string {
  const label = params.label;
  const labelLower = label.toLowerCase();
  const isMasc = MASCULINOS.some(m => labelLower.includes(m));
  
  let message = `${params.emoji} *Nov${isMasc ? 'o' : 'a'} ${label} agendad${isMasc ? 'o' : 'a'}*\n\n`;
  message += `*${params.titulo}*\n`;
  
  // Prioridade (quando alta, emergencia ou urgente)
  if (params.prioridade && ['alta', 'emergencia', 'urgente'].includes(params.prioridade.toLowerCase())) {
    const prioLabels: Record<string, string> = {
      emergencia: '🔴 Prioridade: EMERGÊNCIA',
      urgente: '🔴 Prioridade: URGENTE',
      alta: '🟠 Prioridade: ALTA',
    };
    message += `${prioLabels[params.prioridade.toLowerCase()] || `⚠️ Prioridade: ${params.prioridade.toUpperCase()}`}\n`;
  }
  
  // Data e horário
  if (params.data && params.data !== 'Sem data') {
    message += `📅 Data: ${fmtDateBR(params.data)}`;
    // Show horario_inicio separate from horario (limite)
    if (params.horario_inicio && params.horario) {
      message += `\n🕐 Início: ${params.horario_inicio} | Limite: ${params.horario}`;
    } else if (params.horario_inicio) {
      message += ` às ${params.horario_inicio}`;
    } else if (params.horario && params.horario !== 'Sem horário') {
      message += ` às ${params.horario}`;
    }
    message += '\n';
  }
  
  // Local (para reuniões)
  if (params.local_evento) {
    message += `📍 Local: ${params.local_evento}\n`;
    const mapsLink = params.local_evento === 'Escritório EXA MÍDIA'
      ? 'https://maps.app.goo.gl/g5zDXfK66siRq6W76'
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.local_evento)}`;
    message += `🗺️ Ver no Maps: ${mapsLink}\n`;
  }
  
  // Prédio (para instalação/manutenção/vistoria)
  if (params.building_name) {
    message += `🏢 Prédio: ${params.building_name}\n`;
  }
  
  // Link da reunião
  if (params.link_reuniao) {
    message += `🔗 Link: ${params.link_reuniao}\n`;
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
  
  // Lead/Contato vinculado
  if (params.lead_nome) {
    let contactLine = `🤝 Contato: ${params.lead_nome}`;
    if (params.lead_empresa) contactLine += ` - ${params.lead_empresa}`;
    message += `${contactLine}\n`;
    if (params.lead_telefone) {
      message += `📱 Tel: ${params.lead_telefone}\n`;
    }
  }
  
  // Propostas vinculadas
  if (params.propostas_info && params.propostas_info.length > 0) {
    message += `📄 Propostas: ${params.propostas_info.join(', ')}\n`;
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
      responsaveis_nomes, subtipo_reuniao,
      link_reuniao, prioridade, horario_inicio,
      lead_nome, lead_empresa, lead_telefone, propostas_info
    } = await req.json();

    if (!task_id || !titulo) {
      return new Response(JSON.stringify({ error: 'task_id and titulo required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[TASK-NOTIFY] 📤 Notifying contacts about new task:', titulo, '| tipo:', tipo_evento, '| task_id:', task_id);

    // Resolve event type dynamically from DB
    const { emoji, label } = await resolveEventType(supabase, tipo_evento || 'tarefa');
    console.log('[TASK-NOTIFY] 🏷️ Resolved type:', { emoji, label, tipo_evento });

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

    // Build rich message with resolved emoji/label
    const message = buildRichMessage({
      titulo,
      tipo_evento,
      data: data || 'Sem data',
      horario: horario || undefined,
      horario_inicio: horario_inicio || undefined,
      criador_nome: criador_nome || 'Sistema',
      descricao,
      local_evento,
      building_name,
      responsaveis_nomes,
      subtipo_reuniao,
      link_reuniao,
      prioridade,
      lead_nome,
      lead_empresa,
      lead_telefone,
      propostas_info,
      emoji,
      label,
    });

    let sent = 0;
    for (const contact of contacts) {
      if (!contact.telefone) continue;

      const formattedPhone = contact.telefone.startsWith('55')
        ? contact.telefone
        : `55${contact.telefone}`;

      try {
        // Route through zapi-send-message shim → Evolution API (Notificações EXA)
        // zapi-send-message converte `buttons` em texto numerado automaticamente.
        const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
          body: {
            agentKey: 'exa_alert',
            phone: formattedPhone,
            message,
            skipSplit: true,
            buttons: [
              { id: 'task_confirm', label: '✅ Confirmar' },
              { id: 'task_reschedule', label: '🔄 Remarcar' },
              { id: 'task_cancel', label: '❌ Cancelar' },
            ],
            footer: 'Responda com o número (1, 2 ou 3).',
          },
        });

        if (sendError) {
          console.error(`[TASK-NOTIFY] ❌ Failed to send to ${contact.nome}:`, sendError);
        } else {
          sent++;
          console.log(`[TASK-NOTIFY] ✅ Sent to ${contact.nome} via Evolution`);

          await supabase.from('task_read_receipts').insert({
            task_id: task_id,
            contact_phone: formattedPhone,
            contact_name: contact.nome,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(`[TASK-NOTIFY] ❌ Error sending to ${contact.nome}:`, err);
      }
    }

    // Criar entrada na fila de respostas para que o usuário possa responder
    // com 1/2/3/SIM/NAO e o task-follow-up-response saber qual tarefa é.
    try {
      const { data: existingQueue } = await supabase
        .from('task_notification_queue')
        .select('id')
        .eq('task_id', task_id)
        .neq('status', 'resolved')
        .maybeSingle();

      if (!existingQueue) {
        // Resolver criador da tarefa (para vincular `criado_por` na fila)
        const { data: taskRow } = await supabase
          .from('tasks')
          .select('created_by')
          .eq('id', task_id)
          .maybeSingle();

        await supabase.from('task_notification_queue').insert({
          task_id,
          criado_por: taskRow?.created_by || null,
          status: 'sent_to_creator',
          sent_at: new Date().toISOString(),
        });
        console.log('[TASK-NOTIFY] 🗂️ task_notification_queue criado para task:', task_id);
      } else {
        console.log('[TASK-NOTIFY] ℹ️ task_notification_queue já existia para task:', task_id);
      }
    } catch (queueErr) {
      console.error('[TASK-NOTIFY] ⚠️ Falha ao criar task_notification_queue:', queueErr);
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
