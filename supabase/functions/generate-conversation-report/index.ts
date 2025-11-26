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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conversationId } = await req.json();

    console.log('[GENERATE-REPORT] Generating report for:', conversationId);

    // Buscar dados da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversa não encontrada');
    }

    // Buscar todas as mensagens
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw new Error('Erro ao buscar mensagens');
    }

    // Verificar se tem API key da Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.warn('[GENERATE-REPORT] Lovable API Key not configured');
      throw new Error('Lovable AI não configurado');
    }

    // Preparar contexto da conversa para a IA
    const conversationContext = messages?.map(m => 
      `[${new Date(m.created_at).toLocaleString('pt-BR')}] [${m.direction === 'inbound' ? 'Cliente' : (m.agent_key || 'Atendente')}] ${m.body || ''}${m.has_image ? ' 📷' : ''}${m.has_audio ? ' 🎤' : ''}`
    ).join('\n') || '';

    // Chamar Lovable AI para gerar relatório otimizado para mídia em elevadores
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um analista de leads especializado em mídia OOH (out-of-home) em painéis digitais de elevadores de prédios.

TIPOS DE CONTATOS:
- ANUNCIANTE: Empresário/negócio que quer anunciar nos prédios
- SÍNDICO: Síndico/administradora interessado em instalar telas no prédio
- MORADOR: Morador com dúvidas ou suporte
- SUPORTE_TECNICO: Questões técnicas/defeitos
- CLIENTE_ATIVO: Cliente já existente

REGRAS DE HOT LEAD (ANUNCIANTE):
+30 pts: Pediu orçamento
+25 pts: Quer 5+ prédios
+20 pts: Perguntou preço diretamente
+15 pts: Demonstrou urgência
+10 pts: Já sabe o que quer anunciar
≥70 pontos = HOT LEAD 🔥

REGRAS DE HOT LEAD (SÍNDICO):
+25 pts: Prédio 10+ andares
+25 pts: 30+ unidades
+20 pts: Responde rápido
+30 pts: Interesse direto em instalar
≥70 pontos = HOT LEAD 🔥

CRITÉRIOS DE ESCALAÇÃO para Eduardo:
- Negociações especiais
- Contratos grandes (10+ prédios)
- Síndico premium
- Risco de cancelamento
- Cliente irritado/reclamação grave

Analise a conversa e retorne um relatório em JSON:

{
  "summary": "Resumo executivo em 2-3 frases",
  "detectedType": "anunciante | sindico | morador | suporte_tecnico | cliente_ativo",
  "leadProfile": {
    "empresaNome": "string ou null (para anunciantes)",
    "segmento": "saúde | restaurante | imobiliária | etc (para anunciantes)",
    "bairroInteresse": "string ou null (para anunciantes)",
    "prediosDesejados": number ou null (para anunciantes)",
    "intencao": "baixa | media | alta",
    "orcamentoEstimado": number ou null,
    "estagioCompra": "consultando | orcamento | decidindo | comprando",
    "predioNome": "string ou null (para síndicos)",
    "predioAndares": number ou null (para síndicos)",
    "predioUnidades": number ou null (para síndicos)",
    "predioTipo": "residencial | comercial | misto (para síndicos)",
    "administradora": "string ou null (para síndicos)",
    "interesseReal": boolean ou null (para síndicos)"
  },
  "hotLeadScore": 0-100,
  "isHotLead": boolean,
  "probabilidadeFechamento": 0-100,
  "urgencia": "baixa | media | alta | critica",
  "necessitaEscalacao": boolean,
  "motivoEscalacao": "string ou null",
  "proximosPassos": ["Passo 1", "Passo 2", "Passo 3"],
  "objecoesIdentificadas": ["Objeção 1", "Objeção 2"],
  "keyPoints": ["Ponto importante 1", "Ponto 2"],
  "recommendations": [
    {
      "priority": "alta | media | baixa",
      "action": "Ação específica",
      "reasoning": "Por quê"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Analise esta conversa e gere um relatório completo:

DADOS DO CONTATO:
- Nome: ${conversation.contact_name || 'Não informado'}
- Telefone: ${conversation.contact_phone}
- Tipo atual: ${conversation.contact_type || 'Desconhecido'}
- Lead Score: ${conversation.lead_score || 0}/100
- É Síndico: ${conversation.is_sindico ? 'Sim' : 'Não'}
- Primeiro contato: ${conversation.first_message_at}
- Último contato: ${conversation.last_message_at}

CONVERSA (${messages?.length || 0} mensagens):
${conversationContext}

Gere um relatório detalhado e acionável seguindo EXATAMENTE o formato JSON solicitado.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      })
    });

    const aiResult = await response.json();
    
    if (!response.ok) {
      console.error('[GENERATE-REPORT] AI Error:', aiResult);
      throw new Error(`Erro na Lovable AI: ${aiResult.error?.message || 'Erro desconhecido'}`);
    }

    const report = JSON.parse(aiResult.choices[0].message.content);

    console.log('[GENERATE-REPORT] Report generated:', report);

    // Obter usuário atual
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId = null;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Atualizar tipo de contato na conversa se foi detectado pela IA
    if (report.detectedType) {
      await supabase
        .from('conversations')
        .update({ 
          contact_type: report.detectedType,
          contact_type_source: 'ai'
        })
        .eq('id', conversationId);
    }

    // Salvar relatório no banco
    const { data: savedReport, error: saveError } = await supabase
      .from('conversation_reports')
      .insert({
        conversation_id: conversationId,
        agent_key: conversation.agent_key,
        report_data: report,
        summary: report.summary,
        contact_profile: report.leadProfile,
        interests: report.keyPoints,
        conversation_stage: report.leadProfile?.estagioCompra || null,
        recommendations: report.recommendations,
        generated_by: userId
      })
      .select()
      .single();

    if (saveError) {
      console.error('[GENERATE-REPORT] Save error:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        reportId: savedReport?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[GENERATE-REPORT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
