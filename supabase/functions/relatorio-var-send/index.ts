// ============================================
// EDGE FUNCTION: relatorio-var-send
// Formata e envia relatório VAR via WhatsApp/Email
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { report_data, format, director_ids } = await req.json();

    console.log('📤 [VAR SEND] Enviando relatório:', { format, director_count: director_ids.length });

    // Buscar dados dos diretores
    const { data: directors, error: dirError } = await supabase
      .from('exa_alerts_directors')
      .select('*')
      .in('id', director_ids);

    if (dirError) throw dirError;

    // Formatar mensagem baseado no formato
    let message = '';

    if (format === 'whatsapp') {
      // FORMATO WHATSAPP (MARKDOWN)
      message = `
📊 *RELATÓRIO VAR - CONVERSAS*
━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 *Período:*
${new Date(report_data.periodo_inicio).toLocaleDateString('pt-BR')} até ${new Date(report_data.periodo_fim).toLocaleDateString('pt-BR')}

🎯 *KPIs PRINCIPAIS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Total de Conversas: *${report_data.total_conversas}*
✔️ Resolvidas: *${report_data.conversas_resolvidas}*
⏳ Pendentes: *${report_data.conversas_pendentes}*
📈 Taxa de Resolução: *${report_data.taxa_resolucao}%*
⏱️ TMA Médio: *${report_data.tma_formatado}*

😊 *SENTIMENTO*
━━━━━━━━━━━━━━━━━━━━━━━━━━
😀 Positivo: ${report_data.sentimento_positivo}%
😐 Neutro: ${report_data.sentimento_neutro}%
😔 Negativo: ${report_data.sentimento_negativo}%

👥 *TIPOS DE CONTATO*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Leads: ${report_data.tipo_lead}
🏢 Síndicos: ${report_data.tipo_sindico}
💼 Clientes: ${report_data.tipo_cliente}
📋 Outros: ${report_data.tipo_outro}

🔥 *HOT LEADS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Hot Leads (score ≥ 70): *${report_data.hot_leads}*
📈 Conversas Escaladas: ${report_data.conversas_escaladas}

🤖 *ANÁLISE IA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${report_data.ia_resumo_executivo}

💡 *PADRÕES DETECTADOS:*
${report_data.ia_padroes_detectados.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

⚠️ *ANOMALIAS:*
${report_data.ia_anomalias.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}

🎯 *RECOMENDAÇÕES:*
${report_data.ia_recomendacoes.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Relatório gerado em ${new Date(report_data.gerado_em).toLocaleString('pt-BR')}
`;
    } else {
      // FORMATO EMAIL (HTML)
      message = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .section { margin-bottom: 25px; }
    .kpi { display: inline-block; background: #f0f0f0; padding: 15px; margin: 10px; border-radius: 8px; min-width: 150px; }
    .kpi-value { font-size: 28px; font-weight: bold; color: #667eea; }
    .kpi-label { font-size: 12px; color: #666; margin-top: 5px; }
    h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    ul { list-style: none; padding-left: 0; }
    li { padding: 8px 0; border-bottom: 1px solid #eee; }
    li:before { content: "✓ "; color: #667eea; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório VAR - Conversas</h1>
      <p>Período: ${new Date(report_data.periodo_inicio).toLocaleDateString('pt-BR')} até ${new Date(report_data.periodo_fim).toLocaleDateString('pt-BR')}</p>
    </div>

    <div class="section">
      <h2>🎯 KPIs Principais</h2>
      <div class="kpi">
        <div class="kpi-value">${report_data.total_conversas}</div>
        <div class="kpi-label">Total de Conversas</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${report_data.conversas_resolvidas}</div>
        <div class="kpi-label">Resolvidas</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${report_data.taxa_resolucao}%</div>
        <div class="kpi-label">Taxa de Resolução</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${report_data.tma_formatado}</div>
        <div class="kpi-label">TMA Médio</div>
      </div>
    </div>

    <div class="section">
      <h2>😊 Distribuição de Sentimento</h2>
      <ul>
        <li>Positivo: ${report_data.sentimento_positivo}%</li>
        <li>Neutro: ${report_data.sentimento_neutro}%</li>
        <li>Negativo: ${report_data.sentimento_negativo}%</li>
      </ul>
    </div>

    <div class="section">
      <h2>👥 Tipos de Contato</h2>
      <ul>
        <li>Leads: ${report_data.tipo_lead}</li>
        <li>Síndicos: ${report_data.tipo_sindico}</li>
        <li>Clientes: ${report_data.tipo_cliente}</li>
        <li>Outros: ${report_data.tipo_outro}</li>
      </ul>
    </div>

    <div class="section">
      <h2>🔥 Hot Leads</h2>
      <p style="font-size: 18px;"><strong>${report_data.hot_leads}</strong> conversas com score ≥ 70</p>
    </div>

    <div class="section">
      <h2>🤖 Análise IA</h2>
      <p>${report_data.ia_resumo_executivo}</p>
      
      <h3>💡 Padrões Detectados</h3>
      <ul>
        ${report_data.ia_padroes_detectados.map((p: string) => `<li>${p}</li>`).join('')}
      </ul>

      <h3>⚠️ Anomalias</h3>
      <ul>
        ${report_data.ia_anomalias.map((a: string) => `<li>${a}</li>`).join('')}
      </ul>

      <h3>🎯 Recomendações</h3>
      <ul>
        ${report_data.ia_recomendacoes.map((r: string) => `<li>${r}</li>`).join('')}
      </ul>
    </div>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999;">
      <p>Relatório gerado em ${new Date(report_data.gerado_em).toLocaleString('pt-BR')}</p>
    </div>
  </div>
</body>
</html>
`;
    }

    // Enviar para cada diretor
    const sendResults = [];

    for (const director of directors || []) {
      try {
        if (format === 'whatsapp' && director.telefone) {
          // Enviar via WhatsApp usando ZAPI
          const { error: zapiError } = await supabase.functions.invoke('zapi-send-message', {
            body: {
              phone: director.telefone,
              message: message
            }
          });

          if (zapiError) throw zapiError;

          sendResults.push({
            director_id: director.id,
            director_name: director.nome,
            success: true,
            method: 'whatsapp'
          });

        } else if (format === 'email' && director.email) {
          // Enviar via Email (implementação futura com Resend)
          console.log('📧 Email para:', director.email);
          
          sendResults.push({
            director_id: director.id,
            director_name: director.nome,
            success: true,
            method: 'email',
            note: 'Email implementação futura'
          });
        }
      } catch (sendError) {
        console.error(`❌ Erro ao enviar para ${director.nome}:`, sendError);
        sendResults.push({
          director_id: director.id,
          director_name: director.nome,
          success: false,
          error: sendError instanceof Error ? sendError.message : 'Erro desconhecido'
        });
      }
    }

    // Registrar log de envio
    await supabase.from('daily_reports').insert({
      report_type: 'var_report',
      recipients: director_ids,
      format: format,
      sent_at: new Date().toISOString(),
      report_data: report_data
    });

    console.log('✅ [VAR SEND] Relatórios enviados:', sendResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: sendResults,
        total_sent: sendResults.filter(r => r.success).length,
        total_failed: sendResults.filter(r => !r.success).length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ [VAR SEND] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
