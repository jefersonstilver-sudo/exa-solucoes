import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotionTask {
  id: string;
  nome: string;
  data: string;
  hora: string;
  descricao?: string;
  prioridade?: string;
  categoria?: string;
  status: string;
  responsaveis_ids?: string[];
  alarme_padrao: boolean;
  alarme_insistente: boolean;
  silenciado: boolean;
}

interface AdminUser {
  id: string;
  nome: string;
  telefone: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter data/hora atual (Brasil - UTC-3)
    const now = new Date();
    const brasilOffset = -3 * 60 * 60 * 1000;
    const brasilNow = new Date(now.getTime() + brasilOffset + now.getTimezoneOffset() * 60 * 1000);
    
    const currentDate = brasilNow.toISOString().split('T')[0];
    const currentHours = brasilNow.getHours();
    const currentMinutes = brasilNow.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    console.log(`[task-reminder] Executando às ${currentDate} ${currentHours}:${currentMinutes.toString().padStart(2, '0')}`);

    // Buscar tarefas do dia com data e hora definidos
    const { data: tasks, error: tasksError } = await supabase
      .from('notion_tasks')
      .select('*')
      .eq('data', currentDate)
      .not('hora', 'is', null)
      .not('status', 'eq', 'Concluído')
      .eq('silenciado', false);

    if (tasksError) {
      console.error('[task-reminder] Erro ao buscar tarefas:', tasksError);
      throw tasksError;
    }

    if (!tasks || tasks.length === 0) {
      console.log('[task-reminder] Nenhuma tarefa encontrada para hoje');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma tarefa para processar', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[task-reminder] Encontradas ${tasks.length} tarefas para processar`);

    // Buscar todos os usuários admin com telefone
    const { data: allAdminUsers, error: usersError } = await supabase
      .from('users')
      .select('id, nome, telefone')
      .in('role', ['super_admin', 'admin', 'admin_financeiro', 'admin_marketing'])
      .not('telefone', 'is', null);

    if (usersError) {
      console.error('[task-reminder] Erro ao buscar usuários:', usersError);
    }

    const adminUsers = (allAdminUsers || []) as AdminUser[];
    console.log(`[task-reminder] ${adminUsers.length} usuários admin com telefone disponíveis`);

    let alertsSent = 0;
    const processedAlerts: any[] = [];

    for (const task of tasks as NotionTask[]) {
      // Converter hora da tarefa para minutos
      const [taskHours, taskMinutes] = task.hora.split(':').map(Number);
      const taskTotalMinutes = taskHours * 60 + taskMinutes;
      const minutesUntilTask = taskTotalMinutes - currentTotalMinutes;

      console.log(`[task-reminder] Tarefa "${task.nome}": ${minutesUntilTask} minutos restantes`);

      // Determinar quais alertas enviar
      const alertsToSend: string[] = [];

      // Alarme Padrão: 1h antes e 30min antes
      if (task.alarme_padrao) {
        if (minutesUntilTask === 60) alertsToSend.push('padrao_1h');
        if (minutesUntilTask === 30) alertsToSend.push('padrao_30min');
      }

      // Alarme Super Insistente: a cada 5 minutos nos últimos 30 minutos
      if (task.alarme_insistente) {
        if (minutesUntilTask <= 30 && minutesUntilTask >= 0 && minutesUntilTask % 5 === 0) {
          alertsToSend.push(`insistente_${minutesUntilTask}min`);
        }
      }

      if (alertsToSend.length === 0) {
        continue;
      }

      // Determinar destinatários
      let recipients: AdminUser[] = [];
      if (task.responsaveis_ids && task.responsaveis_ids.length > 0) {
        recipients = adminUsers.filter(u => task.responsaveis_ids!.includes(u.id));
      } else {
        // Se não há responsáveis específicos, enviar para todos
        recipients = adminUsers;
      }

      if (recipients.length === 0) {
        console.log(`[task-reminder] Nenhum destinatário para tarefa "${task.nome}"`);
        continue;
      }

      for (const alertType of alertsToSend) {
        // Verificar se já enviamos este alerta
        const { data: existingAlert } = await supabase
          .from('task_alert_logs')
          .select('id')
          .eq('task_id', task.id)
          .eq('alert_type', alertType)
          .gte('sent_at', new Date(brasilNow.getTime() - 60000).toISOString()) // último minuto
          .single();

        if (existingAlert) {
          console.log(`[task-reminder] Alerta ${alertType} já enviado para "${task.nome}"`);
          continue;
        }

        // Construir mensagem
        const message = buildAlertMessage(task, alertType, minutesUntilTask);

        // Enviar para cada destinatário
        const sentTo: any[] = [];
        const errors: any[] = [];

        for (const recipient of recipients) {
          try {
            if (zapiInstanceId && zapiToken && recipient.telefone) {
              await sendWhatsAppMessage(zapiInstanceId, zapiToken, recipient.telefone, message);
              sentTo.push({ id: recipient.id, nome: recipient.nome, telefone: recipient.telefone });
              alertsSent++;
              console.log(`[task-reminder] ✅ Alerta enviado para ${recipient.nome}`);
            } else {
              console.log(`[task-reminder] ⚠️ Z-API não configurado ou telefone ausente para ${recipient.nome}`);
            }
          } catch (err: any) {
            console.error(`[task-reminder] Erro ao enviar para ${recipient.nome}:`, err.message);
            errors.push({ recipient: recipient.nome, error: err.message });
          }
        }

        // Registrar log do alerta
        const { error: logError } = await supabase
          .from('task_alert_logs')
          .insert({
            task_id: task.id,
            alert_type: alertType,
            recipients: sentTo,
            status: sentTo.length > 0 ? 'sent' : 'failed',
            error_message: errors.length > 0 ? JSON.stringify(errors) : null
          });

        if (logError) {
          console.error('[task-reminder] Erro ao registrar log:', logError);
        }

        processedAlerts.push({
          task: task.nome,
          alertType,
          sentTo: sentTo.length,
          errors: errors.length
        });
      }
    }

    console.log(`[task-reminder] Concluído. ${alertsSent} alertas enviados.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsSent,
        processedAlerts,
        timestamp: brasilNow.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[task-reminder] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAlertMessage(task: NotionTask, alertType: string, minutesUntilTask: number): string {
  const prioridadeEmoji = task.prioridade === 'Alta' ? '🔴' : task.prioridade === 'Média' ? '🟡' : '🟢';
  const categoriaText = task.categoria ? `\n📁 ${task.categoria}` : '';
  
  let timeText = '';
  if (alertType === 'padrao_1h') {
    timeText = '⏰ *Falta 1 hora!*';
  } else if (alertType === 'padrao_30min') {
    timeText = '⏰ *Falta 30 minutos!*';
  } else if (alertType.startsWith('insistente_')) {
    const mins = parseInt(alertType.replace('insistente_', '').replace('min', ''));
    if (mins === 0) {
      timeText = '🚨 *É AGORA!*';
    } else {
      timeText = `⚡ *Faltam ${mins} minutos!*`;
    }
  }

  let message = `📋 *LEMBRETE DE TAREFA*\n\n`;
  message += `📌 *${task.nome}*\n`;
  message += `📅 ${task.data} às ${task.hora}`;
  message += categoriaText;
  
  if (task.prioridade) {
    message += `\n${prioridadeEmoji} Prioridade: ${task.prioridade}`;
  }
  
  if (task.descricao) {
    message += `\n\n📝 ${task.descricao}`;
  }
  
  message += `\n\n${timeText}`;
  
  if (alertType.startsWith('insistente_')) {
    message += `\n\n_Responda "OK" para confirmar recebimento._`;
  }

  return message;
}

async function sendWhatsAppMessage(instanceId: string, token: string, phone: string, message: string): Promise<void> {
  // Limpar número de telefone
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  const response = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: formattedPhone,
      message
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z-API error: ${response.status} - ${errorText}`);
  }
}
