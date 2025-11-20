import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, conversationId, from, contactName } = await req.json();

    console.log(`[QUALIFY] Processing lead for conversation: ${conversationId}`);

    // Buscar conhecimento da Sofia para qualificação
    const { data: knowledge } = await supabase
      .from('agent_knowledge')
      .select('content')
      .eq('agent_key', 'sofia')
      .in('section', ['spin_selling', 'scoring', 'perfis', 'objetivo_final'])
      .eq('is_active', true);

    const knowledgeText = knowledge?.map(k => k.content).join('\n\n') || '';

    const systemPrompt = `
Você é um sistema de qualificação de leads da EXA (mídia Out of Home - painéis digitais).

Analise a mensagem do lead e retorne um JSON com:
{
  "score": 0-100,
  "classification": "frio" | "morno" | "quente" | "muito_quente",
  "interest_areas": ["array", "de", "interesses"],
  "profile_type": "pequeno_comercio" | "medio_negocio" | "grande_empresa" | "agencia" | "indefinido",
  "budget_range": "baixo" | "medio" | "alto" | "indefinido",
  "timeline": "imediato" | "1_mes" | "3_meses" | "planejamento" | "indefinido",
  "spin_situation": 0-3,
  "spin_problem": 0-3,
  "spin_implication": 0-3,
  "spin_need": 0-3,
  "notes": "observações importantes sobre o lead",
  "risk_of_loss": true/false,
  "reason_for_risk": "motivo caso risk_of_loss seja true"
}

SISTEMA DE PONTUAÇÃO SPIN:
- Situação (0-3): Quanto o lead já conhece/usa mídia OOH
- Problema (0-3): Reconhecimento das limitações atuais
- Implicação (0-3): Entendimento do impacto negativo
- Necessidade (0-3): Desejo de mudança/solução

CLASSIFICAÇÃO POR SCORE:
- 0-40: frio
- 41-70: morno  
- 71-89: quente
- 90-100: muito_quente

DETECÇÃO DE RISCO DE PERDA:
Identifique sinais de que o lead vai desistir:
- Foco excessivo em preço/orçamento baixo
- Resistência após apresentação de valores
- Comparação constante com alternativas mais baratas
- Hesitação ou adiamento de decisão
- Sinais de que não vê valor suficiente

BASE DE CONHECIMENTO:
${knowledgeText}
`;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.warn('[QUALIFY] OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        score: 50,
        classification: 'morno',
        notes: 'Qualificação manual necessária - OpenAI não configurado'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const qualification = JSON.parse(data.choices[0].message.content);

    // Salvar qualificação
    const { data: savedQual, error: saveError } = await supabase
      .from('lead_qualifications')
      .insert({
        conversation_id: conversationId,
        contact_number: from,
        contact_name: contactName,
        ...qualification
      })
      .select()
      .single();

    if (saveError) {
      console.error('[QUALIFY] Error saving:', saveError);
    }

    console.log(`[QUALIFY] Lead qualified with score: ${qualification.score}, risk: ${qualification.risk_of_loss}`);

    return new Response(JSON.stringify(qualification), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[QUALIFY] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
