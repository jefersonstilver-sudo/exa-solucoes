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
    console.log('🔍 [VAR GENERATE] Buscando conversas e mensagens APENAS do período selecionado');

    // ===== BUSCAR CONVERSAS NO PERÍODO (POR ÚLTIMA ATIVIDADE) =====
    let conversationsQuery = supabase
      .from('conversations')
      .select('*')
      .gte('last_message_at', start_date)
      .lte('last_message_at', end_date);

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

    // ===== BUSCAR MENSAGENS NO PERÍODO (FILTRADAS POR DATA) =====
    const conversationIds = conversations?.map((c: ConversationRecord) => c.id) || [];
    let messages: MessageRecord[] = [];
    
    if (conversationIds.length > 0) {
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .gte('created_at', start_date)
        .lte('created_at', end_date);

      if (msgError) throw msgError;
      messages = messagesData || [];
      
      console.log(`📨 [VAR GENERATE] ${messages.length} mensagens encontradas no período`);
      console.log(`📅 [VAR GENERATE] Período: ${start_date} até ${end_date}`);
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

    const tma_formatado = `${Math.floor(tma_medio / 60).toString().padStart(2, '0')}:${Math.floor(tma_medio % 60).toString().padStart(2, '0')}`;

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

    // ===== EVOLUÇÃO 30 DIAS (POR ÚLTIMA ATIVIDADE) =====
    const evolucao_30_dias: Array<{ data: string; total: number }> = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = conversations?.filter((c: ConversationRecord) => 
        c.last_message_at && c.last_message_at.startsWith(dateStr)
      ).length || 0;
      
      evolucao_30_dias.push({ data: dateStr, total: count });
    }

    // ===== DISTRIBUIÇÃO POR PERÍODO (MANHÃ/TARDE/NOITE) =====
    const distribuicao_periodo = { manha: 0, tarde: 0, noite: 0 };
    messages.forEach((m: MessageRecord) => {
      const hour = new Date(m.created_at).getHours();
      if (hour >= 6 && hour < 12) distribuicao_periodo.manha++;
      else if (hour >= 12 && hour < 18) distribuicao_periodo.tarde++;
      else distribuicao_periodo.noite++;
    });

    // ===== MENSAGENS ENVIADAS VS RECEBIDAS =====
    const mensagens_enviadas = messages.filter((m: MessageRecord) => m.direction === 'outbound').length;
    const mensagens_recebidas = messages.filter((m: MessageRecord) => m.direction === 'inbound').length;

    // ===== BREAKDOWN POR TIPO DE CONTATO =====
    const mensagens_por_tipo: Record<string, { enviadas: number; recebidas: number; conversas: number }> = {};
    
    conversations?.forEach((conv: ConversationRecord) => {
      const tipo = conv.contact_type || 'outro';
      if (!mensagens_por_tipo[tipo]) {
        mensagens_por_tipo[tipo] = { enviadas: 0, recebidas: 0, conversas: 0 };
      }
      mensagens_por_tipo[tipo].conversas++;
    });

    messages.forEach((msg: MessageRecord) => {
      const conv = conversations?.find(c => c.id === msg.conversation_id);
      const tipo = conv?.contact_type || 'outro';
      
      if (!mensagens_por_tipo[tipo]) {
        mensagens_por_tipo[tipo] = { enviadas: 0, recebidas: 0, conversas: 0 };
      }
      
      if (msg.direction === 'outbound') {
        mensagens_por_tipo[tipo].enviadas++;
      } else {
        mensagens_por_tipo[tipo].recebidas++;
      }
    });

    console.log('📊 [VAR GENERATE] Breakdown por tipo:', mensagens_por_tipo);

    // ===== COMPARATIVO COM PERÍODO ANTERIOR =====
    const periodDuration = new Date(end_date).getTime() - new Date(start_date).getTime();
    const previousStart = new Date(new Date(start_date).getTime() - periodDuration).toISOString();
    const previousEnd = start_date;

    // Buscar dados do período anterior
    const { data: previousConversations } = await supabase
      .from('conversations')
      .select('*')
      .gte('last_message_at', previousStart)
      .lte('last_message_at', previousEnd);

    const previousConvIds = previousConversations?.map(c => c.id) || [];
    let previousMessages: MessageRecord[] = [];
    if (previousConvIds.length > 0) {
      const { data: prevMsgs } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', previousConvIds);
      previousMessages = prevMsgs || [];
    }

    const previousResponseTimes = previousMessages
      .filter(m => m.response_time && m.direction === 'outbound')
      .map(m => {
        const interval = m.response_time;
        if (!interval) return 0;
        const parts = interval.split(':');
        if (parts.length === 3) {
          return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        return 0;
      });

    const previousTma = previousResponseTimes.length > 0
      ? previousResponseTimes.reduce((a, b) => a + b, 0) / previousResponseTimes.length
      : 0;

    const previousHotLeads = previousConversations?.filter(c => (c.lead_score || 0) >= 70).length || 0;

    const comparativo_anterior = {
      contatos: { anterior: previousConversations?.length || 0, atual: total_conversas },
      mensagens: { anterior: previousMessages.length, atual: messages.length },
      tma: { anterior: Math.round(previousTma), atual: Math.round(tma_medio) },
      hot_leads: { anterior: previousHotLeads, atual: hot_leads }
    };

    // ===== CONVERSAS MAIS ATIVAS =====
    const messageCountByConversation = messages.reduce((acc, m) => {
      acc[m.conversation_id] = (acc[m.conversation_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conversas_mais_ativas = Object.entries(messageCountByConversation)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([convId, count]) => {
        const conv = conversations?.find(c => c.id === convId);
        return {
          phone: conv?.contact_phone || conv?.phone_number || 'Desconhecido',
          total_msgs: count,
          agent: conv?.agent_key || 'N/A',
          last_activity: conv?.last_message_at || ''
        };
      });

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
      versao_relatorio: '1.0',
      
      // NOVOS CAMPOS (28-33)
      distribuicao_periodo,
      mensagens_enviadas,
      mensagens_recebidas,
      comparativo_anterior,
      conversas_mais_ativas,
      mensagens_por_tipo // NOVO: breakdown por tipo de contato
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
