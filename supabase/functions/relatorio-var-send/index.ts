import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendRequest {
  relatorio_data: any;
  formato: 'whatsapp' | 'email';
  diretores_ids: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: SendRequest = await req.json();
    const { relatorio_data, formato, diretores_ids } = body;

    console.log(`[VAR-SEND] Enviando relatório via ${formato} para ${diretores_ids.length} diretores`);

    // ========== BUSCAR DIRETORES ==========
    const { data: directors, error: dirError } = await supabase
      .from('exa_alerts_directors')
      .select('*')
      .in('id', diretores_ids);

    if (dirError) throw dirError;
    if (!directors || directors.length === 0) {
      throw new Error('Nenhum diretor encontrado');
    }

    const sentTo: string[] = [];

    // ========== FORMATAR MENSAGEM ==========
    const formatarMensagem = (data: any): string => {
      return `📊 *RELATÓRIO VAR — EXA*

📅 *Período:* ${new Date(data.periodo.inicio).toLocaleDateString('pt-BR')} - ${new Date(data.periodo.fim).toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━
📈 *KPIs PRINCIPAIS*
━━━━━━━━━━━━━━━━━━━━━

💬 *Total de Conversas:* ${data.total_conversas}
✅ *Resolvidas:* ${data.conversas_resolvidas}
⏳ *Pendentes:* ${data.conversas_pendentes}
📊 *Taxa Resolução:* ${data.taxa_resolucao}%

⏱️ *TMA Geral:* ${data.tma_geral}
⚡ *TMA 1º Contato:* ${data.tma_primeiro_contato}

━━━━━━━━━━━━━━━━━━━━━
😊 *SENTIMENTO*
━━━━━━━━━━━━━━━━━━━━━

✅ Positivo: ${data.sentimento_positivo}%
😐 Neutro: ${data.sentimento_neutro}%
❌ Negativo: ${data.sentimento_negativo}%

━━━━━━━━━━━━━━━━━━━━━
🤖 *INSIGHTS DA IA*
━━━━━━━━━━━━━━━━━━━━━

${data.ia_insights.resumo_executivo}

📊 *Score de Qualidade:* ${data.ia_insights.score_qualidade}/100

*Padrões Detectados:*
${data.ia_insights.padroes_detectados.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

*Recomendações:*
${data.ia_insights.recomendacoes.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━
🔥 *HOT LEADS (${data.hot_leads.length})*
━━━━━━━━━━━━━━━━━━━━━

${data.hot_leads.slice(0, 3).map((lead: any, i: number) => 
  `${i + 1}. ${lead.nome} - Score: ${lead.score}/100`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━

_Gerado em: ${new Date(data.gerado_em).toLocaleString('pt-BR')}_`;
    };

    const mensagem = formatarMensagem(relatorio_data);

    // ========== ENVIAR PARA CADA DIRETOR ==========
    for (const director of directors) {
      try {
        if (formato === 'whatsapp') {
          // Enviar via ZAPI
          const { error: zapiError } = await supabase.functions.invoke('zapi-send-message', {
            body: {
              agentKey: 'eduardo',
              phone: director.telefone,
              message: mensagem
            }
          });

          if (zapiError) {
            console.error(`[VAR-SEND] Erro ao enviar para ${director.nome}:`, zapiError);
          } else {
            sentTo.push(`${director.nome} (${director.telefone})`);
            console.log(`[VAR-SEND] ✓ Enviado para ${director.nome}`);
          }
        } else if (formato === 'email') {
          // TODO: Implementar envio via email quando necessário
          console.log(`[VAR-SEND] Email não implementado ainda para ${director.nome}`);
        }

        // Pequeno delay entre envios
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (sendError) {
        console.error(`[VAR-SEND] Erro no envio para ${director.nome}:`, sendError);
      }
    }

    // ========== REGISTRAR ENVIO ==========
    const { error: logError } = await supabase
      .from('daily_reports')
      .insert({
        report_type: 'var_conversas',
        period_start: relatorio_data.periodo.inicio,
        period_end: relatorio_data.periodo.fim,
        data: relatorio_data,
        sent_via: formato,
        sent_to: sentTo,
        generated_at: relatorio_data.gerado_em
      });

    if (logError) {
      console.error('[VAR-SEND] Erro ao registrar log:', logError);
    }

    console.log(`[VAR-SEND] Relatório enviado para ${sentTo.length} diretores`);

    return new Response(
      JSON.stringify({
        success: true,
        sent_to: sentTo,
        total_sent: sentTo.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[VAR-SEND] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
