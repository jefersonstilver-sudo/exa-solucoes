import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RelatorioConfig {
  ativo: boolean;
  time: string;
  selectedDays: string[];
  selectedDirectors: string[];
  sections: {
    tarefas_hoje: boolean;
    tarefas_sem_agendamento: boolean;
    predios_sem_agendamento: boolean;
    propostas: boolean;
    status_paineis: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sendNow } = await req.json().catch(() => ({ sendNow: false }));

    console.log('[relatorio-operacional] Iniciando geração do relatório...');

    // Get config
    const { data: configData, error: configError } = await supabase
      .from('exa_alerts_config')
      .select('config_value')
      .eq('config_key', 'relatorio_operacional')
      .single();

    if (configError && configError.code !== 'PGRST116') {
      console.error('[relatorio-operacional] Error loading config:', configError);
      return new Response(JSON.stringify({ success: false, error: 'Config not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const config = configData?.config_value as RelatorioConfig;
    
    if (!config) {
      return new Response(JSON.stringify({ success: false, error: 'Config not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    if (!config.ativo && !sendNow) {
      console.log('[relatorio-operacional] Relatório desativado');
      return new Response(JSON.stringify({ success: false, error: 'Report disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get directors
    const { data: directors } = await supabase
      .from('exa_alerts_directors')
      .select('*')
      .in('id', config.selectedDirectors)
      .eq('ativo', true);

    if (!directors || directors.length === 0) {
      console.log('[relatorio-operacional] Nenhum destinatário configurado');
      return new Response(JSON.stringify({ success: false, error: 'No recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build report sections
    const sections = config.sections;
    let reportParts: string[] = [];

    // Header
    const now = new Date();
    const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const dateStr = brazilTime.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const timeStr = brazilTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    reportParts.push('━━━━━━━━━━━━━━━━━━━━');
    reportParts.push('📊 *RELATÓRIO OPERACIONAL*');
    reportParts.push(`🗓️ ${dateStr} - ${timeStr}`);
    reportParts.push('━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Tarefas do dia
    if (sections.tarefas_hoje) {
      const today = new Date().toISOString().split('T')[0];
      const { data: tarefasHoje } = await supabase
        .from('notion_tasks')
        .select('*')
        .eq('data', today)
        .neq('status', 'Concluído')
        .order('data', { ascending: true });

      reportParts.push('📋 *TAREFAS DO DIA*');
      if (tarefasHoje && tarefasHoje.length > 0) {
        reportParts.push(`📅 Agendadas para hoje: ${tarefasHoje.length}`);
        tarefasHoje.slice(0, 5).forEach(t => {
          const hora = t.hora ? ` (${t.hora})` : '';
          reportParts.push(`  • ${t.nome}${hora}`);
        });
        if (tarefasHoje.length > 5) {
          reportParts.push(`  _...e mais ${tarefasHoje.length - 5}_`);
        }
      } else {
        reportParts.push('✅ Nenhuma tarefa agendada para hoje');
      }
      reportParts.push('');
    }

    // 2. Tarefas sem agendamento
    if (sections.tarefas_sem_agendamento) {
      const { data: tarefasSemData } = await supabase
        .from('notion_tasks')
        .select('*')
        .is('data', null)
        .neq('status', 'Concluído');

      reportParts.push('⏳ *TAREFAS SEM AGENDAMENTO*');
      if (tarefasSemData && tarefasSemData.length > 0) {
        reportParts.push(`📌 Pendentes sem data: ${tarefasSemData.length}`);
        tarefasSemData.slice(0, 5).forEach(t => {
          reportParts.push(`  • ${t.nome}`);
        });
        if (tarefasSemData.length > 5) {
          reportParts.push(`  _...e mais ${tarefasSemData.length - 5}_`);
        }
      } else {
        reportParts.push('✅ Todas as tarefas têm data definida');
      }
      reportParts.push('');
    }

    // 3. Prédios sem agendamento
    if (sections.predios_sem_agendamento) {
      const statusPendentes = ['instalacao', 'subir_nuc', 'manutencao', 'visita_tecnica', 'troca_painel', 'instalacao_internet'];
      
      const { data: prediosPendentes } = await supabase
        .from('buildings')
        .select('nome, status')
        .in('status', statusPendentes)
        .is('notion_data_trabalho', null);

      reportParts.push('🏢 *PRÉDIOS AGUARDANDO AGENDAMENTO*');
      if (prediosPendentes && prediosPendentes.length > 0) {
        reportParts.push(`📍 ${prediosPendentes.length} prédios sem data definida:`);
        prediosPendentes.slice(0, 5).forEach(p => {
          const statusLabel = p.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          reportParts.push(`  • ${p.nome} (${statusLabel})`);
        });
        if (prediosPendentes.length > 5) {
          reportParts.push(`  _...e mais ${prediosPendentes.length - 5}_`);
        }
      } else {
        reportParts.push('✅ Todos os prédios com data definida');
      }
      reportParts.push('');
    }

    // 4. Propostas
    if (sections.propostas) {
      const { data: propostasPendentes } = await supabase
        .from('proposals')
        .select('*')
        .eq('status', 'pendente');

      const { data: propostasExpiradas } = await supabase
        .from('proposals')
        .select('*')
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'pendente');

      const { data: propostasReaceite } = await supabase
        .from('proposals')
        .select('*')
        .eq('needs_reacceptance', true);

      reportParts.push('📝 *PROPOSTAS*');
      const pendentes = propostasPendentes?.length || 0;
      const expiradas = propostasExpiradas?.length || 0;
      const reaceite = propostasReaceite?.length || 0;

      if (pendentes > 0) reportParts.push(`⏳ ${pendentes} aguardando aceite`);
      if (expiradas > 0) reportParts.push(`⚠️ ${expiradas} expiradas`);
      if (reaceite > 0) reportParts.push(`🔄 ${reaceite} precisa re-aceite`);
      
      if (pendentes === 0 && expiradas === 0 && reaceite === 0) {
        reportParts.push('✅ Nenhuma proposta pendente');
      }
      reportParts.push('');
    }

    // 5. Status dos painéis
    if (sections.status_paineis) {
      const { data: devices } = await supabase
        .from('devices')
        .select('id, name, status, last_online_at, building_id')
        .eq('is_active', true);

      if (devices && devices.length > 0) {
        const now = new Date();
        const online: typeof devices = [];
        const offline: Array<typeof devices[0] & { offlineMinutes: number }> = [];

        devices.forEach(device => {
          const lastOnline = device.last_online_at ? new Date(device.last_online_at) : null;
          const diffMinutes = lastOnline 
            ? Math.floor((now.getTime() - lastOnline.getTime()) / (1000 * 60))
            : 999999;

          if (device.status === 'online' || diffMinutes < 5) {
            online.push(device);
          } else {
            offline.push({ ...device, offlineMinutes: diffMinutes });
          }
        });

        reportParts.push('📡 *STATUS DOS PAINÉIS*');
        reportParts.push(`✅ ${online.length} online`);
        reportParts.push(`❌ ${offline.length} offline`);

        if (offline.length > 0) {
          offline.sort((a, b) => b.offlineMinutes - a.offlineMinutes);
          offline.slice(0, 5).forEach(d => {
            const hours = Math.floor(d.offlineMinutes / 60);
            const minutes = d.offlineMinutes % 60;
            const timeOffline = hours > 0 
              ? `${hours}h${minutes > 0 ? minutes + 'min' : ''}` 
              : `${minutes}min`;
            reportParts.push(`  • ${d.name || d.id.substring(0, 8)} (${timeOffline} offline)`);
          });
          if (offline.length > 5) {
            reportParts.push(`  _...e mais ${offline.length - 5}_`);
          }
        }
      } else {
        reportParts.push('📡 *STATUS DOS PAINÉIS*');
        reportParts.push('ℹ️ Nenhum dispositivo cadastrado');
      }
      reportParts.push('');
    }

    // Footer
    reportParts.push('━━━━━━━━━━━━━━━━━━━━');
    reportParts.push('🤖 EXA Digital - Sistema Automatizado');

    const message = reportParts.join('\n');

    console.log('[relatorio-operacional] Relatório gerado:', message.substring(0, 200) + '...');

    // Send to all directors
    let sentCount = 0;
    let errorCount = 0;

    for (const director of directors) {
      try {
        // Get Z-API config
        const { data: zapiConfig } = await supabase
          .from('exa_alerts_config')
          .select('config_value')
          .eq('config_key', 'zapi_config')
          .single();

        if (!zapiConfig?.config_value) {
          console.error('[relatorio-operacional] Z-API not configured');
          continue;
        }

        const zapi = zapiConfig.config_value as { instance_id: string; token: string };

        // Format phone
        let phone = director.telefone.replace(/\D/g, '');
        if (!phone.startsWith('55')) {
          phone = '55' + phone;
        }

        // Send via Z-API
        const response = await fetch(
          `https://api.z-api.io/instances/${zapi.instance_id}/token/${zapi.token}/send-text`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              message
            })
          }
        );

        if (response.ok) {
          sentCount++;
          console.log(`[relatorio-operacional] Enviado para ${director.nome}`);

          // Log history
          await supabase.from('exa_alerts_history').insert({
            tipo: 'relatorio_operacional',
            destinatario: director.telefone,
            nome_destinatario: director.nome,
            mensagem: message.substring(0, 500),
            status: 'entregue',
            metadata: { sections: Object.keys(sections).filter(k => sections[k as keyof typeof sections]) }
          });
        } else {
          errorCount++;
          const errorText = await response.text();
          console.error(`[relatorio-operacional] Erro ao enviar para ${director.nome}:`, errorText);
        }
      } catch (error) {
        errorCount++;
        console.error(`[relatorio-operacional] Erro ao enviar para ${director.nome}:`, error);
      }
    }

    console.log(`[relatorio-operacional] Finalizado: ${sentCount} enviados, ${errorCount} erros`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: sentCount, 
      errors: errorCount,
      message: `Relatório enviado para ${sentCount} destinatários`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[relatorio-operacional] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
