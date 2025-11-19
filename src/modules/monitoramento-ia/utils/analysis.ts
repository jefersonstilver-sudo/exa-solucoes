import { supabase } from '@/integrations/supabase/client';
import { mapManychatToDevice } from './manychat';

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
  // Try OpenAI first
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (openaiKey) {
    try {
      return await performOpenAIAnalysis(text, recentMessages, openaiKey);
    } catch (error) {
      console.warn('⚠️ [ANALYSIS] OpenAI failed, falling back to heuristics:', error);
    }
  }

  // Fallback to heuristics
  return performHeuristicAnalysis(text, recentMessages);
};

/**
 * Perform analysis using OpenAI
 */
const performOpenAIAnalysis = async (
  text: string,
  recentMessages: any[],
  apiKey: string
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Contexto da conversa:\n${conversationContext}\n\nNova mensagem: "${text}"` }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

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
    // Try to map message to device
    const deviceId = await mapManychatToDevice({
      conversation_id: message.conversation_id,
      message_id: message.id,
      direction: message.from_role === 'contact' ? 'inbound' : 'outbound',
      body: message.body,
      from: { phone: 'unknown' },
      attachments: [],
      timestamp: message.created_at
    });

    if (deviceId) {
      // Create device alert
      await supabase
        .from('device_alerts')
        .insert({
          device_id: deviceId,
          alert_type: 'manychat_urgent',
          severity: analysis.raw_payload?.urgency >= 2 ? 'critical' : 'high',
          status: 'open',
          evidence: {
            analysis_id: analysis.id,
            message_id: message.id,
            conversation_id: message.conversation_id,
            text: message.body,
            urgency_score: analysis.raw_payload?.urgency
          }
        });

      console.log('✅ [ANALYSIS] Device alert created for device:', deviceId);
    } else {
      // Create general conversation alert (could be stored in separate table)
      console.log('ℹ️ [ANALYSIS] No device mapping, alert logged in analysis');
    }
  } catch (error) {
    console.error('❌ [ANALYSIS] Error creating alert:', error);
  }
};
