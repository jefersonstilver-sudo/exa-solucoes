import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  contact_type: string;
  urgency: number;
  opportunity: number;
  suggested_reply: string;
  summary: string;
  response_quality_score: number;
  sla_violations: any[];
}

/**
 * Analyze message and update conversation with AI insights
 * Uses OpenAI if OPENAI_API_KEY is available, otherwise uses heuristics
 */
export const analyzeMessageAndUpdateConversation = async (
  messageId: string
): Promise<any> => {
  console.log('🤖 [ANALYSIS] Starting analysis for message:', messageId);

  try {
    // Load message with conversation context
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select(`
        *,
        conversations (*)
      `)
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      throw new Error('Message not found');
    }

    const text = message.body || '';
    const conversationId = message.conversation_id;

    // Load recent messages for context
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Perform analysis
    const analysis = await performAnalysis(text, recentMessages || []);

    // Save analysis to database
    const { data: savedAnalysis, error: analysisError } = await supabase
      .from('analyses')
      .insert([{
        conversation_id: conversationId,
        summary: analysis.summary,
        intent: analysis.urgency > 2 ? 'urgency' : analysis.opportunity > 0.7 ? 'opportunity' : 'general',
        opportunity: analysis.opportunity > 0.7,
        response_quality_score: analysis.response_quality_score,
        sla_violations: analysis.sla_violations as any,
        suggested_reply: analysis.suggested_reply,
        raw_payload: analysis as any
      }])
      .select()
      .single();

    if (analysisError) {
      console.error('❌ [ANALYSIS] Error saving analysis:', analysisError);
      throw analysisError;
    }

    // Update conversation contact_type if detected
    if (analysis.contact_type !== 'unknown') {
      await supabase
        .from('conversations')
        .update({ contact_type: analysis.contact_type })
        .eq('id', conversationId);
    }

    // Create alert if needed
    if (analysis.urgency >= 2 || analysis.sla_violations.length > 0) {
      await createAlertFromAnalysis(savedAnalysis, message);
    }

    console.log('✅ [ANALYSIS] Analysis completed and saved:', savedAnalysis.id);
    return savedAnalysis;

  } catch (error) {
    console.error('❌ [ANALYSIS] Error during analysis:', error);
    throw error;
  }
};

/**
 * Perform actual analysis using OpenAI or heuristics
 */
const performAnalysis = async (
  text: string,
  recentMessages: any[]
): Promise<AnalysisResult> => {
  // Try secure Edge Function first
  try {
    return await performSecureAIAnalysis(text, recentMessages);
  } catch (error) {
    console.warn('⚠️ [ANALYSIS] Edge Function failed, falling back to heuristics:', error);
  }

  // Fallback to heuristics
  return performHeuristicAnalysis(text, recentMessages);
};

/**
 * Perform analysis using secure Edge Function (no exposed API keys)
 */
const performSecureAIAnalysis = async (
  text: string,
  recentMessages: any[]
): Promise<AnalysisResult> => {
  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.from_role}]: ${m.body}`)
    .join('\n');

  const systemPrompt = `Você é um analista de conversas da EXA, empresa de painéis digitais. 
Analise a mensagem e retorne um JSON com:
- contact_type: 'sindico' | 'cliente' | 'lead' | 'admin' | 'unknown'
- urgency: 0-3 (0=baixa, 3=crítica)
- opportunity: 0-1 (probabilidade de oportunidade de venda)
- suggested_reply: resposta sugerida profissional e empática
- summary: resumo da mensagem em até 150 caracteres
- response_quality_score: 0-100
- sla_violations: array de violações detectadas`;

  // Use secure Edge Function instead of direct API call
  const { data, error } = await supabase.functions.invoke('generate-ai-response', {
    body: {
      systemPrompt,
      userMessage: `Contexto da conversa:\n${conversationContext}\n\nNova mensagem: "${text}"`,
      model: 'gpt-4',
      responseFormat: 'json'
    }
  });

  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }

  const result = typeof data.response === 'string' 
    ? JSON.parse(data.response) 
    : data.response;

  return {
    contact_type: result.contact_type || 'unknown',
    urgency: result.urgency || 0,
    opportunity: result.opportunity || 0,
    suggested_reply: result.suggested_reply || '',
    summary: result.summary || text.substring(0, 150),
    response_quality_score: result.response_quality_score || 70,
    sla_violations: result.sla_violations || []
  };
};

/**
 * Perform analysis using keyword-based heuristics
 */
const performHeuristicAnalysis = (
  text: string,
  recentMessages: any[]
): AnalysisResult => {
  const lowerText = text.toLowerCase();

  // Detect urgency
  const urgencyKeywords = ['pane', 'parado', 'não funciona', 'offline', 'urgente', 'problema', 'erro', 'travado'];
  const urgencyScore = urgencyKeywords.filter(kw => lowerText.includes(kw)).length;
  const urgency = Math.min(3, urgencyScore);

  // Detect opportunity
  const opportunityKeywords = ['quero', 'comprar', 'preço', 'orçamento', 'contratar', 'interessado', 'valor'];
  const opportunityScore = opportunityKeywords.filter(kw => lowerText.includes(kw)).length / opportunityKeywords.length;
  const opportunity = Math.min(1, opportunityScore);

  // Classify contact type
  let contact_type = 'unknown';
  if (lowerText.includes('síndico') || lowerText.includes('síndica')) {
    contact_type = 'sindico';
  } else if (lowerText.includes('cliente') || lowerText.includes('meu pedido')) {
    contact_type = 'cliente';
  } else if (opportunity > 0.3) {
    contact_type = 'lead';
  }

  // Check SLA violations
  const sla_violations: any[] = [];
  if (recentMessages.length > 1) {
    const lastAttendantMsg = recentMessages.find(m => m.from_role === 'attendant');
    if (lastAttendantMsg) {
      const timeDiff = (Date.now() - new Date(lastAttendantMsg.created_at).getTime()) / (1000 * 60 * 60);
      if (timeDiff > 2) {
        sla_violations.push({
          type: 'response_time',
          value: timeDiff,
          threshold: 2,
          severity: timeDiff > 4 ? 'high' : 'medium'
        });
      }
    }
  }

  // Generate suggested reply
  let suggested_reply = '';
  if (urgency >= 2) {
    suggested_reply = 'Olá! Identificamos sua solicitação urgente. Nossa equipe técnica já foi acionada e entrará em contato em até 30 minutos para resolver o problema.';
  } else if (opportunity > 0.5) {
    suggested_reply = 'Olá! Ficamos felizes com seu interesse em nossos painéis digitais. Vou te enviar mais informações sobre nossos planos, preços e cases de sucesso. Qual seria o melhor horário para conversarmos?';
  } else {
    suggested_reply = 'Olá! Recebi sua mensagem e vou analisar com atenção. Retorno em breve com mais informações.';
  }

  return {
    contact_type,
    urgency,
    opportunity,
    suggested_reply,
    summary: text.substring(0, 150),
    response_quality_score: urgency >= 2 ? 90 : 70,
    sla_violations
  };
};

/**
 * Create alert from analysis if conditions are met
 */
export const createAlertFromAnalysis = async (
  analysis: any,
  message: any
): Promise<void> => {
  console.log('🚨 [ANALYSIS] Creating alert from analysis');

  try {
    // Log the alert - device mapping removed with ManyChat removal
    console.log('ℹ️ [ANALYSIS] Alert logged in analysis (device mapping removed with ManyChat)');
  } catch (error) {
    console.error('❌ [ANALYSIS] Error creating alert:', error);
  }
};
