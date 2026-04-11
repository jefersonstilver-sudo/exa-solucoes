import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    const { conversationId, messageText, metadata } = await req.json();

    console.log('[ANALYZE-MESSAGE] Analyzing:', { conversationId, textLength: messageText?.length });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.warn('[ANALYZE-MESSAGE] OpenAI API Key not configured, returning default analysis');
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            sentiment: 'neutral',
            mood_score: 50,
            urgency_level: 0,
            lead_score: 0,
            intent: 'question',
            is_sindico: false,
            is_critical: false,
            key_points: [],
            suggested_response: ''
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar OpenAI para análise estruturada
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Você é um analisador de conversas comerciais. Analise a mensagem e retorne JSON estruturado com:
- sentiment: 'positive' | 'neutral' | 'negative' | 'angry'
- mood_score: 0-100 (0=muito irritado, 100=muito feliz)
- urgency_level: 0-10
- lead_score: 0-100 (probabilidade de fechamento)
- intent: 'question' | 'complaint' | 'interest' | 'objection' | 'followup' | 'thanks'
- is_sindico: boolean (se menciona ser síndico/gestor de condomínio)
- is_critical: boolean (se requer atenção imediata)
- key_points: array de strings (pontos principais da mensagem)
- suggested_response: string (sugestão de resposta)
- contact_type_suggestion: 'lead' | 'sindico' | 'sindico_lead' | 'eletricista' | 'outros_prestadores' | 'equipe_exa' | 'cliente_ativo' | 'tke_tecnico' | 'tke_supervisor' | 'oriente_tecnico' | 'oriente_supervisor' | 'atlas_tecnico' | 'atlas_supervisor' | 'vivo_provedor' | 'ligga_provedor'
- contact_type_confidence: 0-100 (confiança na classificação)
- contact_type_reasoning: string (explicação breve do porquê desta classificação)`
          },
          {
            role: 'user',
            content: messageText
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    const aiResult = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResult.error?.message || 'Unknown error'}`);
    }

    const analysis = JSON.parse(aiResult.choices[0].message.content);

    console.log('[ANALYZE-MESSAGE] Analysis:', analysis);

    // Atualizar última message com análise
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (messages && messages.length > 0) {
      await supabase
        .from('messages')
        .update({
          sentiment: analysis.sentiment,
          detected_urgency: analysis.urgency_level,
          detected_mood: analysis.mood_score,
          intent: analysis.intent,
          classification: {
            is_sindico: analysis.is_sindico,
            is_critical: analysis.is_critical,
            lead_score: analysis.lead_score
          },
          ai_analysis: analysis
        })
        .eq('id', messages[0].id);
    }

    // Buscar dados atuais da conversa para verificar classificação manual
    const { data: conversation } = await supabase
      .from('conversations')
      .select('contact_type, contact_type_source, id')
      .eq('id', conversationId)
      .single();

    // Contar mensagens da conversa
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    // Determinar se deve atualizar contact_type automaticamente
    const shouldUpdateContactType = conversation && (
      conversation.contact_type_source !== 'manual' || // Não é manual
      conversation.contact_type_source === 'unknown' || // Ou é desconhecido
      !conversation.contact_type // Ou não tem tipo definido
    ) && (
      messageCount && messageCount >= 10 && // Tem pelo menos 10 mensagens
      analysis.contact_type_confidence >= 70 // E confiança >= 70%
    );

    // Preparar update da conversa
    const conversationUpdate: any = {
      sentiment: analysis.sentiment,
      mood_score: analysis.mood_score,
      urgency_level: analysis.urgency_level,
      lead_score: analysis.lead_score,
      is_sindico: analysis.is_sindico,
      is_critical: analysis.is_critical,
      is_hot_lead: analysis.lead_score >= 75
    };

    // Adicionar classificação automática se permitido
    if (shouldUpdateContactType && analysis.contact_type_suggestion) {
      conversationUpdate.contact_type = analysis.contact_type_suggestion;
      conversationUpdate.contact_type_source = 'ai';
      conversationUpdate.contact_type_updated_at = new Date().toISOString();
      
      console.log('[ANALYZE-MESSAGE] Auto-classifying contact type:', {
        suggestion: analysis.contact_type_suggestion,
        confidence: analysis.contact_type_confidence,
        reasoning: analysis.contact_type_reasoning,
        messageCount
      });
    }

    // Atualizar conversation
    await supabase
      .from('conversations')
      .update(conversationUpdate)
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ANALYZE-MESSAGE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
