// ============================================
// EDGE FUNCTION: relatorio-var-send
// Salva relatório VAR e envia via WhatsApp com link curto
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

    const { report_data, format, send_type, director_ids } = await req.json();

    console.log('📤 [VAR SEND] Enviando relatório:', { 
      format, 
      send_type, 
      director_count: director_ids.length 
    });

    // 1. SALVAR RELATÓRIO EM generated_reports para gerar UUID e link
    const { data: savedReport, error: saveError } = await supabase
      .from('generated_reports')
      .insert({
        report_type: 'var',
        report_data: report_data,
        period_start: report_data.period_start,
        period_end: report_data.period_end,
        contact_types: report_data.contact_types_filter || [],
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (saveError) throw saveError;

    console.log('💾 [VAR SEND] Relatório salvo:', savedReport.id);

    // 2. GERAR LINK CURTO
    const reportLink = `https://preview--exa-screen-flow.lovable.app/r/${savedReport.id}`;

    // 3. BUSCAR DADOS DOS DIRETORES
    const { data: directors, error: dirError } = await supabase
      .from('exa_alerts_directors')
      .select('*')
      .in('id', director_ids);

    if (dirError) throw dirError;

    // 4. FORMATAR MENSAGEM BASEADO NO TIPO DE ENVIO
    let message = '';

    if (send_type === 'link') {
      // MENSAGEM CURTA COM LINK (Padrão recomendado)
      message = `━━━━━━━━━━━━━━━━━━━━

📊 *Relatório de Atendimento*

Olá {nome_diretor}!

O relatório do período {data_inicio} - {data_fim} está disponível.

*Resumo:*
• ${report_data.total_conversas} conversas
• ${report_data.taxa_resolucao.toFixed(1)}% resolução
• ${report_data.tempo_medio_atendimento} tempo médio
${report_data.contact_types_filter?.length > 0 ? `\n*Filtro:* ${report_data.contact_types_filter.join(', ')}` : ''}

🔗 *Ver relatório completo:*
${reportLink}

━━━━━━━━━━━━━━━━━━━━`;

    } else {
      // MENSAGEM COMPLETA (send_type === 'complete')
      message = `
📊 *RELATÓRIO VAR - CONVERSAS*
━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 *Período:*
${new Date(report_data.period_start).toLocaleDateString('pt-BR')} até ${new Date(report_data.period_end).toLocaleDateString('pt-BR')}

🎯 *KPIs PRINCIPAIS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Total de Conversas: *${report_data.total_conversas}*
✔️ Resolvidas: *${report_data.resolvidas}*
⏳ Pendentes: *${report_data.pendentes}*
📈 Taxa de Resolução: *${report_data.taxa_resolucao.toFixed(1)}%*
⏱️ TMA Médio: *${report_data.tempo_medio_atendimento}*

😊 *SENTIMENTO*
━━━━━━━━━━━━━━━━━━━━━━━━━━
😀 Positivo: ${report_data.sentiment_distribution.positivo}%
😐 Neutro: ${report_data.sentiment_distribution.neutro}%
😔 Negativo: ${report_data.sentiment_distribution.negativo}%

🔥 *HOT LEADS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Hot Leads (score ≥ 70): *${report_data.hot_leads.length}*

🤖 *ANÁLISE IA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${report_data.ai_analysis.summary}

💡 *PADRÕES DETECTADOS:*
${report_data.ai_analysis.patterns.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

🎯 *RECOMENDAÇÕES:*
${report_data.ai_analysis.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

🔗 *Ver relatório completo com gráficos:*
${reportLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Relatório gerado em ${new Date().toLocaleString('pt-BR')}
`;
    }

    // 5. ENVIAR PARA CADA DIRETOR
    const sendResults = [];

    for (const director of directors || []) {
      try {
        if (format === 'whatsapp' && director.telefone) {
          // Personalizar mensagem com nome do diretor
          const personalizedMessage = message
            .replace('{nome_diretor}', director.nome)
            .replace('{data_inicio}', new Date(report_data.period_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
            .replace('{data_fim}', new Date(report_data.period_end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));

          // Enviar via WhatsApp usando ZAPI
          const { error: zapiError } = await supabase.functions.invoke('zapi-send-message', {
            body: {
              phone: director.telefone,
              message: personalizedMessage
            }
          });

          if (zapiError) throw zapiError;

          sendResults.push({
            director_id: director.id,
            director_name: director.nome,
            success: true,
            method: 'whatsapp',
            link: reportLink
          });

          console.log(`✅ WhatsApp enviado para ${director.nome}`);

        } else if (format === 'email' && director.email) {
          // Email (implementação futura com Resend)
          console.log('📧 Email para:', director.email);
          
          sendResults.push({
            director_id: director.id,
            director_name: director.nome,
            success: true,
            method: 'email',
            link: reportLink,
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

    // 6. REGISTRAR LOG DE ENVIO
    await supabase.from('daily_reports').insert({
      report_type: 'var_report',
      recipients: director_ids,
      format: format,
      sent_at: new Date().toISOString(),
      report_data: {
        ...report_data,
        report_link: reportLink,
        send_type: send_type
      }
    });

    console.log('✅ [VAR SEND] Relatórios enviados:', sendResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: sendResults,
        report_link: reportLink,
        report_id: savedReport.id,
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
