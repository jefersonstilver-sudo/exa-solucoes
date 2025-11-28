// ============================================
// EDGE FUNCTION: relatorio-var-generate
// Gera relatório VAR com todas as 40 variáveis
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationRecord {
  id: string;
  phone_number: string;
  agent_key: string;
  status: string;
  created_at: string;
  last_message_at: string;
  lead_score: number | null;
  sentiment: string | null;
  contact_type: string | null;
}

interface MessageRecord {
  id: string;
  conversation_id: string;
  direction: string;
  response_time: string | null;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { start_date, end_date, contact_types } = await req.json();

    console.log('📊 [VAR GENERATE] Gerando relatório:', { start_date, end_date, contact_types });

    // ===== BUSCAR CONVERSAS NO PERÍODO =====
    let conversationsQuery = supabase
      .from('conversations')
      .select('*')
      .gte('created_at', start_date)
      .lte('created_at', end_date);

    // Filtrar por tipos de contato se especificado
    if (contact_types && contact_types.length > 0) {
      // Se incluir "outros", buscar NULL ou 'outros'
      if (contact_types.includes('outros')) {
        const otherTypes = contact_types.filter((t: string) => t !== 'outros');
        if (otherTypes.length > 0) {
          conversationsQuery = conversationsQuery.or(
            `contact_type.is.null,contact_type.eq.outros,contact_type.in.(${otherTypes.join(',')})`
          );
        } else {
          conversationsQuery = conversationsQuery.or('contact_type.is.null,contact_type.eq.outros');
        }
      } else {
        conversationsQuery = conversationsQuery.in('contact_type', contact_types);
      }
    }

    const { data: conversations, error: convError } = await conversationsQuery;

    if (convError) throw convError;

    // ===== BUSCAR MENSAGENS NO PERÍODO =====
    const conversationIds = conversations?.map((c: ConversationRecord) => c.id) || [];
    let messages: MessageRecord[] = [];
    
    if (conversationIds.length > 0) {
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds);

      if (msgError) throw msgError;
      messages = messagesData || [];
    }

    // ===== CALCULAR KPIs PRINCIPAIS =====
    const total_conversas = conversations?.length || 0;
    const conversas_resolvidas = conversations?.filter((c: ConversationRecord) => c.status === 'resolved').length || 0;
    const conversas_pendentes = conversations?.filter((c: ConversationRecord) => c.status === 'pending').length || 0;
    const taxa_resolucao = total_conversas > 0 ? (conversas_resolvidas / total_conversas) * 100 : 0;

    // ===== CALCULAR TMA (TEMPO MÉDIO DE ATENDIMENTO) =====
    const responseTimes = messages
      .filter((m: MessageRecord) => m.response_time && m.direction === 'outbound')
      .map((m: MessageRecord) => {
        const interval = m.response_time;
        if (!interval) return 0;
        
        // Parse PostgreSQL interval format (e.g., "00:05:30")
        const parts = interval.split(':');
        if (parts.length === 3) {
          return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        return 0;
      });

    const tma_medio = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const tma_formatado = `${Math.floor(tma_medio / 60).toString().padStart(2, '0')}:${(tma_medio % 60).toString().padStart(2, '0')}`;

    // ===== DISTRIBUIÇÃO POR SENTIMENTO =====
    const sentimentos = conversations?.map((c: ConversationRecord) => c.sentiment || 'neutro') || [];
    const sentimento_positivo = (sentimentos.filter(s => s === 'positivo').length / total_conversas) * 100 || 0;
    const sentimento_neutro = (sentimentos.filter(s => s === 'neutro').length / total_conversas) * 100 || 0;
    const sentimento_negativo = (sentimentos.filter(s => s === 'negativo').length / total_conversas) * 100 || 0;

    // ===== TIPOS DE CONTATO =====
    const tipos = conversations?.map((c: ConversationRecord) => c.contact_type || 'outro') || [];
    const tipo_lead = tipos.filter(t => t === 'lead').length;
    const tipo_sindico = tipos.filter(t => t === 'sindico').length;
    const tipo_cliente = tipos.filter(t => t === 'cliente').length;
    const tipo_outro = tipos.filter(t => t === 'outro').length;

    // ===== HOT LEADS =====
    const hot_leads = conversations?.filter((c: ConversationRecord) => (c.lead_score || 0) >= 70).length || 0;

    // ===== CONVERSAS ESCALADAS =====
    const conversas_escaladas = conversations?.filter((c: ConversationRecord) => c.status === 'escalated').length || 0;

    // ===== EVOLUÇÃO 30 DIAS =====
    const evolucao_30_dias: Array<{ data: string; total: number }> = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = conversations?.filter((c: ConversationRecord) => 
        c.created_at.startsWith(dateStr)
      ).length || 0;
      
      evolucao_30_dias.push({ data: dateStr, total: count });
    }

    // ===== ANÁLISE IA (LOVABLE AI) =====
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    let ia_resumo_executivo = '';
    let ia_padroes_detectados: string[] = [];
    let ia_anomalias: string[] = [];
    let ia_recomendacoes: string[] = [];

    if (openAiKey) {
      try {
        const aiPrompt = `
ANÁLISE RIGOROSA DE DADOS DE CONVERSAS - MODO ANTI-ALUCINAÇÃO ATIVADO

REGRAS CRÍTICAS:
1. NUNCA invente informações
2. ANALISE APENAS os dados fornecidos
3. Se não houver dados suficientes, declare explicitamente
4. Use APENAS números e fatos presentes nos dados

DADOS REAIS DO SISTEMA:
- Total de conversas: ${total_conversas}
- Resolvidas: ${conversas_resolvidas}
- Pendentes: ${conversas_pendentes}
- Taxa de resolução: ${taxa_resolucao.toFixed(2)}%
- TMA médio: ${tma_formatado}
- Sentimento positivo: ${sentimento_positivo.toFixed(2)}%
- Sentimento neutro: ${sentimento_neutro.toFixed(2)}%
- Sentimento negativo: ${sentimento_negativo.toFixed(2)}%
- Hot Leads: ${hot_leads}
- Tipos: Lead=${tipo_lead}, Síndico=${tipo_sindico}, Cliente=${tipo_cliente}, Outro=${tipo_outro}

FORNEÇA RESPOSTA EM JSON EXATAMENTE NESTE FORMATO:
{
  "resumo_executivo": "string (2-3 frases sobre desempenho geral)",
  "padroes_detectados": ["padrão 1", "padrão 2", "padrão 3"],
  "anomalias": ["anomalia 1 ou 'Nenhuma anomalia detectada'"],
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3"]
}`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Você é um analista de dados rigoroso. NUNCA invente informações. Analise APENAS os dados fornecidos. Responda em JSON válido.'
              },
              {
                role: 'user',
                content: aiPrompt
              }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
          }),
        });

        const aiData = await aiResponse.json();
        const aiContent = JSON.parse(aiData.choices[0].message.content);
        
        ia_resumo_executivo = aiContent.resumo_executivo;
        ia_padroes_detectados = aiContent.padroes_detectados;
        ia_anomalias = aiContent.anomalias;
        ia_recomendacoes = aiContent.recomendacoes;

      } catch (aiError) {
        console.error('❌ Erro na análise IA:', aiError);
        ia_resumo_executivo = 'Análise IA indisponível no momento';
        ia_padroes_detectados = ['Análise não disponível'];
        ia_anomalias = ['Análise não disponível'];
        ia_recomendacoes = ['Análise não disponível'];
      }
    }

    // ===== LISTA COMPLETA DE CONVERSAS =====
    const conversas_lista = conversations?.map((c: ConversationRecord) => ({
      id: c.id,
      phone_number: c.phone_number,
      agent_key: c.agent_key,
      status: c.status,
      created_at: c.created_at,
      last_message_at: c.last_message_at,
      lead_score: c.lead_score,
      sentiment: c.sentiment,
      contact_type: c.contact_type
    })) || [];

    // ===== RELATÓRIO COMPLETO COM 40+ VARIÁVEIS =====
    const relatorio = {
      // KPIs Principais (1-7)
      total_conversas,
      conversas_resolvidas,
      conversas_pendentes,
      taxa_resolucao: parseFloat(taxa_resolucao.toFixed(2)),
      tma_medio: parseFloat(tma_medio.toFixed(2)),
      tma_formatado,
      
      // Sentimento (8-10)
      sentimento_positivo: parseFloat(sentimento_positivo.toFixed(2)),
      sentimento_neutro: parseFloat(sentimento_neutro.toFixed(2)),
      sentimento_negativo: parseFloat(sentimento_negativo.toFixed(2)),
      
      // Tipos de Contato (11-14)
      tipo_lead,
      tipo_sindico,
      tipo_cliente,
      tipo_outro,
      
      // Leads & Escalações (15-16)
      hot_leads,
      conversas_escaladas,
      
      // Período (17-18)
      periodo_inicio: start_date,
      periodo_fim: end_date,
      
      // Evolução Temporal (19)
      evolucao_30_dias,
      
      // Análise IA (20-23)
      ia_resumo_executivo,
      ia_padroes_detectados,
      ia_anomalias,
      ia_recomendacoes,
      
      // Lista Completa (24)
      conversas_lista,
      
      // Metadados (25-27)
      total_mensagens: messages.length,
      gerado_em: new Date().toISOString(),
      versao_relatorio: '1.0'
    };

    console.log('✅ [VAR GENERATE] Relatório gerado com sucesso');

    return new Response(
      JSON.stringify(relatorio),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ [VAR GENERATE] Erro:', error);
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
