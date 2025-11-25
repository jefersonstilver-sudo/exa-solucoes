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
      `[${m.direction === 'inbound' ? 'Cliente' : 'Atendente'}] ${m.message_text}`
    ).join('\n') || '';

    // Chamar Lovable AI para gerar relatório
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
            content: `Você é um analista de conversas comerciais especializado em mídia out-of-home (painéis digitais em elevadores).

Analise a conversa completa e retorne um relatório estruturado em JSON com:

{
  "summary": "Resumo executivo em 2-3 frases",
  "contactProfile": {
    "detectedName": "Nome identificado ou null",
    "detectedType": "sindico | cliente_potencial | cliente_ativo | prestador_servico | parceiro | administrativo | outro",
    "personality": "Descrição da personalidade (ex: direto, amigável, formal)",
    "communicationStyle": "Estilo de comunicação detectado",
    "estimatedBudget": "Estimativa de orçamento se mencionado"
  },
  "conversationStage": "novo | qualificando | interessado | negociando | proposta_enviada | fechando | perdido | cliente_ativo",
  "interests": [
    {
      "type": "predio | servico | informacao",
      "description": "Descrição do interesse",
      "priority": "alta | media | baixa"
    }
  ],
  "keyPoints": ["Ponto importante 1", "Ponto importante 2"],
  "concerns": ["Objeção ou dúvida 1", "Objeção 2"],
  "nextSteps": ["Ação recomendada 1", "Ação 2"],
  "riskFactors": ["Risco de perda 1", "Risco 2"],
  "opportunityScore": 0-100,
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "event": "primeiro_contato | interesse_manifestado | proposta_solicitada | objecao | followup",
      "summary": "Breve descrição do que aconteceu"
    }
  ],
  "recommendations": [
    {
      "priority": "alta | media | baixa",
      "action": "Ação específica recomendada",
      "reasoning": "Por que essa ação é importante"
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

Gere um relatório detalhado e acionável.`
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

    // Salvar relatório no banco
    const { data: savedReport, error: saveError } = await supabase
      .from('conversation_reports')
      .insert({
        conversation_id: conversationId,
        agent_key: conversation.agent_key,
        report_data: report,
        summary: report.summary,
        contact_profile: report.contactProfile,
        interests: report.interests,
        conversation_stage: report.conversationStage,
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
