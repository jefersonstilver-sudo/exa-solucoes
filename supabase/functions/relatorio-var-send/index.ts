// ============================================
// EDGE FUNCTION: relatorio-var-send
// Salva relatório VAR e envia via WhatsApp com link curto
// Last updated: 2025-11-28T04:35:00Z - Force redeploy with skipSplit
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
        period_start: report_data.periodo_inicio,
        period_end: report_data.periodo_fim,
        contact_types: [],
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (saveError) throw saveError;

    console.log('💾 [VAR SEND] Relatório salvo:', savedReport.id);

    // 2. GERAR LINK CURTO
    const reportLink = `https://examidia.com.br/r/${savedReport.id}`;

    // 3. BUSCAR DADOS DOS DIRETORES
    const { data: directors, error: dirError } = await supabase
      .from('exa_alerts_directors')
      .select('*')
      .in('id', director_ids);

    if (dirError) throw dirError;

    // 4. FORMATAR MENSAGEM BASEADO NO TIPO DE ENVIO
    let message = '';

    if (send_type === 'link') {
      // MENSAGEM CURTA COM LINK - SIMPLIFICADA
      message = `📊 *Relatório VAR Disponível*

Olá {nome_diretor}!

Período: {data_inicio} - {data_fim}

*Resumo Rápido:*
• ${report_data.total_conversas} conversas
• ${report_data.taxa_resolucao.toFixed(1)}% resolução
• ${report_data.tma_formatado} TMA

🔗 Ver relatório completo:
${reportLink}

_Válido 30 dias • Protegido_`;

    } else {
      // MENSAGEM COMPLETA (send_type === 'complete')
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
📈 Taxa de Resolução: *${report_data.taxa_resolucao.toFixed(1)}%*
⏱️ TMA Médio: *${report_data.tma_formatado}*

😊 *SENTIMENTO*
━━━━━━━━━━━━━━━━━━━━━━━━━━
😀 Positivo: ${report_data.sentimento_positivo.toFixed(1)}%
😐 Neutro: ${report_data.sentimento_neutro.toFixed(1)}%
😔 Negativo: ${report_data.sentimento_negativo.toFixed(1)}%

🔥 *HOT LEADS*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Hot Leads (score ≥ 70): *${report_data.hot_leads}*

🤖 *ANÁLISE IA*
━━━━━━━━━━━━━━━━━━━━━━━━━━
${report_data.ia_resumo_executivo}

💡 *PADRÕES DETECTADOS:*
${report_data.ia_padroes_detectados.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

🎯 *RECOMENDAÇÕES:*
${report_data.ia_recomendacoes.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

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
            .replace('{data_inicio}', new Date(report_data.periodo_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
            .replace('{data_fim}', new Date(report_data.periodo_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));

          // Formatar telefone com DDI brasileiro
          const formatPhone = (phone: string): string => {
            const clean = phone.replace(/\D/g, '');
            return clean.startsWith('55') ? clean : `55${clean}`;
          };

          // Enviar via WhatsApp usando ZAPI
      const { error: zapiError } = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey: 'exa_alert',
          phone: formatPhone(director.telefone),
          message: personalizedMessage,
          skipSplit: true // Não quebrar mensagem de relatório - preservar link completo
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
