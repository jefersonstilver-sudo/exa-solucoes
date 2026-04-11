// ============================================
// EDGE FUNCTION: relatorio-var-generate
// Gera relatório VAR com todas as 40 variáveis
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationRecord {
  id: string;
  contact_phone: string;
  contact_name: string;
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
  body: string | null;
  has_audio: boolean | null;
  has_image: boolean | null;
}

// Função para normalizar tipos de contato
const normalizeContactType = (type: string | null): string => {
  if (!type || type === 'unknown' || type === '' || type === 'null') return 'outro';
  
  const mapping: Record<string, string> = {
    'lead': 'sindico_lead',
    'sindico_lead': 'sindico_lead',
    'sindico': 'sindico',
    'cliente': 'cliente',
    'cliente_ativo': 'cliente',
    'prestador': 'prestador',
    'ligga_provedor': 'prestador',
    'equipe_hexa': 'equipe_hexa',
    'equipe_exa': 'equipe_hexa',
    'oriente_supervisor': 'equipe_hexa'
  };
  
  return mapping[type.toLowerCase()] || 'outro';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { start_date, end_date, contact_types, agent_key } = await req.json();

    console.log('📊 [VAR GENERATE] Gerando relatório:', { start_date, end_date, contact_types, agent_key });
    console.log('🔍 [VAR GENERATE] Buscando conversas e mensagens APENAS do período selecionado');

    // ===== BUSCAR CONVERSAS NO PERÍODO (POR ÚLTIMA ATIVIDADE) =====
    let conversationsQuery = supabase
      .from('conversations')
      .select('*')
      .gte('last_message_at', start_date)
      .lte('last_message_at', end_date);

    // Filtrar por agent_key se especificado
    if (agent_key) {
      conversationsQuery = conversationsQuery.eq('agent_key', agent_key);
      console.log('🔍 [VAR GENERATE] Filtrando por agent_key:', agent_key);
    }

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
        .select('id, conversation_id, direction, response_time, created_at, body, has_audio, has_image')
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

    // ===== TIPOS DE CONTATO (NORMALIZADOS) =====
    const tipos = conversations?.map((c: ConversationRecord) => normalizeContactType(c.contact_type)) || [];
    const tipo_lead = tipos.filter(t => t === 'sindico_lead').length;
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

    // ===== BREAKDOWN POR TIPO DE CONTATO (NORMALIZADO) =====
    const mensagens_por_tipo: Record<string, { enviadas: number; recebidas: number; conversas: number }> = {};
    
    conversations?.forEach((conv: ConversationRecord) => {
      const tipo = normalizeContactType(conv.contact_type);
      if (!mensagens_por_tipo[tipo]) {
        mensagens_por_tipo[tipo] = { enviadas: 0, recebidas: 0, conversas: 0 };
      }
      mensagens_por_tipo[tipo].conversas++;
    });

    messages.forEach((msg: MessageRecord) => {
      const conv = conversations?.find(c => c.id === msg.conversation_id);
      const tipo = normalizeContactType(conv?.contact_type);
      
      if (!mensagens_por_tipo[tipo]) {
        mensagens_por_tipo[tipo] = { enviadas: 0, recebidas: 0, conversas: 0 };
      }
      
      if (msg.direction === 'outbound') {
        mensagens_por_tipo[tipo].enviadas++;
      } else {
        mensagens_por_tipo[tipo].recebidas++;
      }
    });

    console.log('📊 [VAR GENERATE] Breakdown por tipo (normalizado):', mensagens_por_tipo);

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
          name: conv?.contact_name || 'Sem nome',
          phone: conv?.contact_phone || 'Desconhecido',
          total_msgs: count,
          agent: conv?.agent_key || 'N/A',
          last_activity: conv?.last_message_at || '',
          contact_type: normalizeContactType(conv?.contact_type)
        };
      });

    // ===== EVOLUÇÃO POR HORA (para relatórios de 1 dia) - SEPARADO ENVIADAS/RECEBIDAS =====
    const evolucao_por_hora: Array<{ hora: string; enviadas: number; recebidas: number; total: number }> = [];
    for (let h = 0; h < 24; h++) {
      const horaStr = h.toString().padStart(2, '0') + ':00';
      const enviadas = messages.filter((m: MessageRecord) => {
        const msgHour = new Date(m.created_at).getHours();
        return msgHour === h && m.direction === 'outbound';
      }).length;
      const recebidas = messages.filter((m: MessageRecord) => {
        const msgHour = new Date(m.created_at).getHours();
        return msgHour === h && m.direction === 'inbound';
      }).length;
      evolucao_por_hora.push({ hora: horaStr, enviadas, recebidas, total: enviadas + recebidas });
    }

    // ===== ANÁLISE IA PROFUNDA (LOVABLE AI) =====
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    let ia_resumo_executivo = '';
    let ia_padroes_detectados: string[] = [];
    let ia_anomalias: string[] = [];
    let ia_recomendacoes: string[] = [];
    let ia_primeira_conversa_por_tipo: Array<{tipo: string; contato: string; hora: string; assunto: string}> = [];
    let ia_analise_por_tipo: Record<string, string> = {};
    let ia_trechos_importantes: Array<{contato: string; trecho: string; motivo: string}> = [];

    if (openAiKey) {
      try {
        // ===== AGRUPAR CONVERSAS POR TIPO =====
        const conversasPorTipo: Record<string, Array<{
          contato: string;
          telefone: string;
          hora_inicio: string;
          mensagens: Array<{dir: string; texto: string; hora: string}>;
        }>> = {};

        // Ordenar conversas por created_at (primeira conversa)
        const sortedConversations = [...(conversations || [])]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Agrupar por tipo normalizado
        sortedConversations.forEach((conv: ConversationRecord) => {
          const tipo = normalizeContactType(conv.contact_type);
          if (!conversasPorTipo[tipo]) conversasPorTipo[tipo] = [];

          // Buscar mensagens desta conversa (limitadas e ordenadas)
          const mensagensConv = messages
            .filter(m => m.conversation_id === conv.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(0, 15) // Até 15 mensagens por conversa
            .map(m => ({
              dir: m.direction === 'outbound' ? 'ENV' : 'REC',
              texto: m.body?.substring(0, 200) || (m.has_audio ? '🎤 áudio' : m.has_image ? '📷 imagem' : '(mídia)'),
              hora: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }));

          conversasPorTipo[tipo].push({
            contato: conv.contact_name || conv.contact_phone,
            telefone: conv.contact_phone,
            hora_inicio: new Date(conv.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            mensagens: mensagensConv
          });
        });

        // Limitar conversas por tipo (primeiras 10 de cada)
        Object.keys(conversasPorTipo).forEach(tipo => {
          conversasPorTipo[tipo] = conversasPorTipo[tipo].slice(0, 10);
        });

        // ===== FORMATAR PARA A IA =====
        const conversasFormatadas = Object.entries(conversasPorTipo)
          .map(([tipo, convs]) => {
            const formatTipo: Record<string, string> = {
              'prestador': 'Provedores de Internet',
              'sindico': 'Síndicos',
              'sindico_lead': 'Síndicos Lead',
              'cliente': 'Clientes',
              'equipe_hexa': 'Equipe Interna',
              'outro': 'Outros'
            };
            
            const tipoLabel = formatTipo[tipo] || tipo;
            const convsText = convs.map(c => 
              `\n  📞 ${c.contato} (${c.telefone}) - Início: ${c.hora_inicio}\n` +
              c.mensagens.map(m => `    [${m.hora}] [${m.dir}] ${m.texto}`).join('\n')
            ).join('\n');

            return `\n${tipoLabel} (${convs.length} conversas):\n${convsText}`;
          })
          .join('\n');

        const aiPrompt = `
ANÁLISE DETALHADA DE CONVERSAS DO PERÍODO

DADOS DO SISTEMA:
- Total de conversas: ${total_conversas}
- Resolvidas: ${conversas_resolvidas} (${taxa_resolucao.toFixed(1)}%)
- Pendentes: ${conversas_pendentes}
- TMA médio: ${tma_formatado}
- Sentimentos: ${sentimento_positivo.toFixed(1)}% positivo, ${sentimento_neutro.toFixed(1)}% neutro, ${sentimento_negativo.toFixed(1)}% negativo

CONVERSAS POR TIPO DE CONTATO:
${conversasFormatadas}

ANALISE E FORNEÇA EM JSON:

1. **PRIMEIRA CONVERSA DE CADA TIPO** (com horário):
   - Qual foi a primeira conversa de cada tipo?
   - Que horas começou?
   - Qual o assunto principal?

2. **ANÁLISE POR TIPO DE CONTATO**:
   - Provedores: O que estão solicitando? Há cobranças? Instalações?
   - Síndicos: Há reclamações de painéis? Problemas técnicos?
   - Equipe Interna: Há tensões? Cobranças internas?
   - Clientes: Quais demandas principais?

3. **TRECHOS IMPORTANTES** (cite 3-5 trechos reais das conversas):
   - Mensagens que indicam problemas urgentes
   - Reclamações que precisam atenção
   - Solicitações pendentes
   - Cite o texto EXATO da mensagem

4. **PADRÕES DETECTADOS**:
   - O que mais se repete nas conversas?
   - Quais assuntos dominam?

5. **SUGESTÕES DE MELHORIA**:
   - Baseado no conteúdo real, o que pode melhorar?
   - Há conversas que precisam follow-up?

RESPONDA EM JSON VÁLIDO:
{
  "primeira_conversa_por_tipo": [
    {"tipo": "Provedores de Internet", "contato": "Nome", "hora": "HH:MM", "assunto": "Breve descrição"},
    {"tipo": "Síndicos", "contato": "Nome", "hora": "HH:MM", "assunto": "Breve descrição"}
  ],
  "analise_por_tipo": {
    "provedores": "Análise das conversas com provedores...",
    "sindicos": "Análise das conversas com síndicos...",
    "equipe_interna": "Análise das conversas internas...",
    "clientes": "Análise das conversas com clientes..."
  },
  "trechos_importantes": [
    {"contato": "Nome do contato", "trecho": "Texto EXATO da mensagem", "motivo": "Por que é importante"}
  ],
  "padroes_detectados": ["padrão 1", "padrão 2"],
  "sugestoes_melhoria": ["sugestão 1", "sugestão 2"],
  "resumo_executivo": "Resumo geral...",
  "anomalias": ["anomalia 1 ou 'Nenhuma detectada'"]
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
                content: 'Você é um analista de conversas experiente. Analise APENAS os dados fornecidos. Cite trechos REAIS das mensagens. Responda em JSON válido.'
              },
              {
                role: 'user',
                content: aiPrompt
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          }),
        });

        const aiData = await aiResponse.json();
        const aiContent = JSON.parse(aiData.choices[0].message.content);
        
        ia_resumo_executivo = aiContent.resumo_executivo || '';
        ia_padroes_detectados = aiContent.padroes_detectados || [];
        ia_anomalias = aiContent.anomalias || [];
        ia_recomendacoes = aiContent.sugestoes_melhoria || aiContent.recomendacoes || [];
        ia_primeira_conversa_por_tipo = aiContent.primeira_conversa_por_tipo || [];
        ia_analise_por_tipo = aiContent.analise_por_tipo || {};
        ia_trechos_importantes = aiContent.trechos_importantes || [];

      } catch (aiError) {
        console.error('❌ Erro na análise IA:', aiError);
        ia_resumo_executivo = 'Análise IA indisponível no momento';
        ia_padroes_detectados = ['Análise não disponível'];
        ia_anomalias = ['Análise não disponível'];
        ia_recomendacoes = ['Análise não disponível'];
        ia_primeira_conversa_por_tipo = [];
        ia_analise_por_tipo = {};
        ia_trechos_importantes = [];
      }
    }

    // ===== LISTA COMPLETA DE CONVERSAS =====
    const conversas_lista = conversations?.map((c: ConversationRecord) => ({
      id: c.id,
      contact_name: c.contact_name,
      phone_number: c.contact_phone,
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
      
      // Análise IA (20-27)
      ia_resumo_executivo,
      ia_padroes_detectados,
      ia_anomalias,
      ia_recomendacoes,
      ia_primeira_conversa_por_tipo,
      ia_analise_por_tipo,
      ia_trechos_importantes,
      
      // Lista Completa (24)
      conversas_lista,
      
      // Metadados (25-27)
      total_mensagens: messages.length,
      gerado_em: new Date().toISOString(),
      versao_relatorio: '1.0',
      
      // NOVOS CAMPOS (28-35)
      distribuicao_periodo,
      mensagens_enviadas,
      mensagens_recebidas,
      comparativo_anterior,
      conversas_mais_ativas,
      mensagens_por_tipo, // NOVO: breakdown por tipo de contato
      evolucao_por_hora // NOVO: evolução por hora para períodos de 1 dia
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
