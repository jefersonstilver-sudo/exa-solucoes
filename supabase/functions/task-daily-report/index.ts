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

    // Get BRT time
    const now = new Date();
    const brasilOffset = -3 * 60 * 60 * 1000;
    const brasilNow = new Date(now.getTime() + brasilOffset + now.getTimezoneOffset() * 60 * 1000);
    const currentHH = brasilNow.getHours().toString().padStart(2, '0');
    const currentMM = brasilNow.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHH}:${currentMM}`;
    const currentDate = brasilNow.toISOString().split('T')[0];
    
    // Yesterday
    const yesterday = new Date(brasilNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    console.log(`[task-daily-report] Check at ${currentDate} ${currentTime} BRT`);

    // Read configs from exa_alerts_config
    const { data: configRows } = await supabase
      .from('exa_alerts_config')
      .select('config_key, config_value')
      .in('config_key', ['agenda_relatorio_noturno', 'agenda_relatorio_matinal']);

    const configs: Record<string, any> = {};
    for (const row of configRows || []) {
      configs[row.config_key] = typeof row.config_value === 'string'
        ? JSON.parse(row.config_value)
        : row.config_value;
    }

    const noturno = configs['agenda_relatorio_noturno'] || { ativo: true, horario: '19:00' };
    const matinal = configs['agenda_relatorio_matinal'] || { ativo: true, horario: '08:00' };

    let reportType: 'evening' | 'morning' | null = null;

    if (noturno.ativo && noturno.horario === currentTime) {
      reportType = 'evening';
    } else if (matinal.ativo && matinal.horario === currentTime) {
      reportType = 'morning';
    }

    // Also accept direct invocation with body
    if (!reportType) {
      try {
        const body = await req.json();
        if (body?.report_type) reportType = body.report_type;
      } catch { /* no body */ }
    }

    if (!reportType) {
      return new Response(JSON.stringify({ success: true, skipped: true, time: currentTime }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[task-daily-report] Generating ${reportType} report`);

    // Get active contacts
    const { data: contacts } = await supabase
      .from('exa_alerts_directors')
      .select('id, nome, telefone')
      .eq('ativo', true);

    if (!contacts || contacts.length === 0) {
      console.log('[task-daily-report] No active contacts');
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'no_contacts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get event_types for icons
    const { data: eventTypes } = await supabase
      .from('event_types')
      .select('value, icon, label');
    const typeMap: Record<string, { icon: string; label: string }> = {};
    for (const et of eventTypes || []) {
      typeMap[et.value] = { icon: et.icon || '📋', label: et.label };
    }

    let message = '';

    if (reportType === 'evening') {
      // Events created today
      const { data: createdToday } = await supabase
        .from('tasks')
        .select('id, titulo, horario_inicio, tipo_evento, status, prioridade')
        .gte('created_at', `${currentDate}T00:00:00`)
        .lte('created_at', `${currentDate}T23:59:59`)
        .order('horario_inicio', { ascending: true });

      // Pending events (today or earlier, not concluded)
      const { data: pending } = await supabase
        .from('tasks')
        .select('id, titulo, data_prevista, horario_inicio, tipo_evento, status, prioridade')
        .in('status', ['pendente', 'em_andamento'])
        .lte('data_prevista', currentDate)
        .order('data_prevista', { ascending: true });

      const dateFormatted = brasilNow.toLocaleDateString('pt-BR');
      message = `📊 *Relatório do Dia — ${dateFormatted}*\n\n`;

      if (createdToday && createdToday.length > 0) {
        message += `📝 *Eventos registrados hoje:*\n`;
        createdToday.forEach((t, i) => {
          const icon = typeMap[t.tipo_evento || '']?.icon || '📋';
          const hora = t.horario_inicio || '--:--';
          message += `${i + 1}. ${icon} ${t.titulo} — ${hora}\n`;
        });
        message += '\n';
      } else {
        message += `📝 _Nenhum evento registrado hoje._\n\n`;
      }

      if (pending && pending.length > 0) {
        message += `⚠️ *Eventos pendentes (não concluídos):*\n`;
        pending.forEach((t, i) => {
          const icon = typeMap[t.tipo_evento || '']?.icon || '📋';
          const hora = t.horario_inicio || '--:--';
          const data = t.data_prevista || '';
          message += `${i + 1}. ${icon} ${t.titulo} — ${data} ${hora}\n`;
        });
        message += `\nResponda com:\n*C1* — Concluir evento 1\n*R1* — Reagendar evento 1\n*X1* — Cancelar evento 1`;
      } else {
        message += `✅ _Nenhum evento pendente._`;
      }

    } else {
      // Morning report
      // Yesterday's pending
      const { data: yesterdayPending } = await supabase
        .from('tasks')
        .select('id, titulo, data_prevista, horario_inicio, tipo_evento, status')
        .in('status', ['pendente', 'em_andamento'])
        .lte('data_prevista', yesterdayDate)
        .order('data_prevista', { ascending: true });

      // Today's events
      const { data: todayEvents } = await supabase
        .from('tasks')
        .select('id, titulo, horario_inicio, tipo_evento, status, prioridade')
        .eq('data_prevista', currentDate)
        .order('horario_inicio', { ascending: true });

      const dateFormatted = brasilNow.toLocaleDateString('pt-BR');
      message = `☀️ *Bom dia! Relatório Matinal — ${dateFormatted}*\n\n`;

      if (yesterdayPending && yesterdayPending.length > 0) {
        message += `⚠️ *Pendentes de dias anteriores:*\n`;
        yesterdayPending.forEach((t, i) => {
          const icon = typeMap[t.tipo_evento || '']?.icon || '📋';
          message += `${i + 1}. ${icon} ${t.titulo} — ${t.data_prevista} ${t.horario_inicio || ''}\n`;
        });
        message += `\nResponda com:\n*C1* — Concluir\n*R1* — Reagendar\n*X1* — Cancelar\n\n`;
      } else {
        message += `✅ _Nenhum evento pendente de dias anteriores._\n\n`;
      }

      if (todayEvents && todayEvents.length > 0) {
        message += `📅 *Agenda de hoje:*\n`;
        todayEvents.forEach((t, i) => {
          const icon = typeMap[t.tipo_evento || '']?.icon || '📋';
          const hora = t.horario_inicio || '--:--';
          const statusIcon = t.status === 'concluida' ? '✅' : t.status === 'cancelada' ? '❌' : '⏳';
          message += `${statusIcon} ${icon} ${t.titulo} — ${hora}\n`;
        });
      } else {
        message += `📅 _Nenhum evento agendado para hoje._`;
      }
    }

    // Send to all contacts
    let sent = 0;
    const errors: any[] = [];

    for (const contact of contacts) {
      if (!contact.telefone) continue;
      try {
        const { error: sendError } = await supabase.functions.invoke('zapi-send-message', {
          body: {
            agentKey: 'exa_alert',
            phone: contact.telefone,
            message,
            skipSplit: true,
          },
        });
        if (!sendError) {
          sent++;
          console.log(`[task-daily-report] ✅ Sent to ${contact.nome}`);
        } else {
          errors.push({ contact: contact.nome, error: sendError.message });
        }
      } catch (err: any) {
        errors.push({ contact: contact.nome, error: err.message });
        console.error(`[task-daily-report] ❌ Error for ${contact.nome}:`, err.message);
      }
    }

    // Log
    await supabase.from('agent_logs').insert({
      agent_key: 'exa_alert',
      event_type: `task_daily_report_${reportType}`,
      metadata: {
        report_type: reportType,
        contacts_sent: sent,
        errors: errors.length,
        timestamp: brasilNow.toISOString(),
      },
    });

    console.log(`[task-daily-report] Done: ${sent} sent, ${errors.length} errors`);

    return new Response(JSON.stringify({ success: true, reportType, sent, errors: errors.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[task-daily-report] ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
