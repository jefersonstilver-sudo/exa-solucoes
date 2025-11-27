import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-manychat-signature',
};

interface ManyChatWebhookPayload {
  event: string;
  message_id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  from: {
    name?: string;
    phone: string;
  };
  text?: string;
  attachments?: any[];
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 [MANYCHAT WEBHOOK] Received request');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse payload
    const payload: ManyChatWebhookPayload = await req.json();
    console.log('📦 [WEBHOOK] Payload:', JSON.stringify(payload, null, 2));

    // Validate signature if provided (ManyChat may send x-manychat-signature)
    const signature = req.headers.get('x-manychat-signature');
    if (signature) {
      console.log('🔐 [WEBHOOK] Signature validation skipped (implement if needed)');
    }

    // Extract data
    const {
      message_id,
      conversation_id,
      direction,
      from,
      text = '',
      attachments = [],
      timestamp
    } = payload;

    // Check for duplicate message (idempotency)
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('external_message_id', message_id)
      .single();

    if (existingMessage) {
      console.log('⚠️ [WEBHOOK] Duplicate message detected, skipping:', message_id);
      return new Response(
        JSON.stringify({ ok: true, processed: false, reason: 'duplicate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Upsert conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .upsert({
        external_id: conversation_id,
        contact_phone: from.phone,
        contact_name: from.name || from.phone.split('@')[0],
        contact_type: 'unknown',
        first_message_at: timestamp,
        last_message_at: timestamp,
        status: 'open'
      }, {
        onConflict: 'external_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (convError) {
      console.error('❌ [WEBHOOK] Error upserting conversation:', convError);
      throw convError;
    }

    console.log('✅ [WEBHOOK] Conversation upserted:', conversation.id);

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        external_message_id: message_id,
        from_role: direction === 'inbound' ? 'contact' : 'attendant',
        body: text,
        has_image: attachments.some((a: any) => a.type === 'image'),
        has_audio: attachments.some((a: any) => a.type === 'audio'),
        raw_payload: payload
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ [WEBHOOK] Error inserting message:', msgError);
      throw msgError;
    }

    console.log('✅ [WEBHOOK] Message inserted:', message.id);

    // Trigger AI analysis (async, non-blocking)
    try {
      const analysisResult = await analyzeMessage(supabase, message.id, conversation.id, text);
      console.log('🤖 [WEBHOOK] Analysis completed:', analysisResult);
    } catch (analysisError) {
      console.error('⚠️ [WEBHOOK] Analysis failed (non-critical):', analysisError);
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        processed: true, 
        message_id: message.id,
        conversation_id: conversation.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ [WEBHOOK] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function analyzeMessage(supabase: any, messageId: string, conversationId: string, text: string) {
  console.log('🤖 [ANALYSIS] Starting analysis for message:', messageId);

  // Detect urgency keywords
  const urgencyKeywords = ['pane', 'parado', 'não funciona', 'offline', 'urgente', 'problema', 'erro'];
  const isUrgent = urgencyKeywords.some(kw => text.toLowerCase().includes(kw));

  // Detect opportunity keywords
  const opportunityKeywords = ['quero', 'comprar', 'preço', 'orçamento', 'contratar', 'interessado'];
  const isOpportunity = opportunityKeywords.some(kw => text.toLowerCase().includes(kw));

  // Classify contact type (basic heuristic)
  let contactType = 'lead'; // Default para lead
  if (text.toLowerCase().includes('síndico') || text.toLowerCase().includes('condominio')) {
    contactType = 'sindico';
  } else if (isOpportunity) {
    contactType = 'lead';
  }

  // Check for SLA violations (basic: response time > 2 hours)
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('created_at, from_role')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(5);

  let slaViolations: any[] = [];
  if (recentMessages && recentMessages.length > 1) {
    const lastAttendantMsg = recentMessages.find((m: any) => m.from_role === 'attendant');
    if (lastAttendantMsg) {
      const timeDiff = (new Date().getTime() - new Date(lastAttendantMsg.created_at).getTime()) / (1000 * 60 * 60);
      if (timeDiff > 2) {
        slaViolations.push({
          type: 'response_time',
          value: timeDiff,
          threshold: 2
        });
      }
    }
  }

  // Generate suggested reply (using OpenAI if available)
  let suggestedReply = '';
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (openaiKey) {
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente da EXA, empresa de painéis digitais. Seja perspicaz, profissional, empático e focado em soluções. Responda de forma clara e objetiva.'
            },
            {
              role: 'user',
              content: `Mensagem do cliente: "${text}"\n\nGere uma resposta sugerida profissional e empática.`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        suggestedReply = openaiData.choices[0]?.message?.content || '';
      }
    } catch (aiError) {
      console.error('⚠️ [ANALYSIS] OpenAI error:', aiError);
    }
  }

  // If no OpenAI, use template
  if (!suggestedReply) {
    if (isUrgent) {
      suggestedReply = 'Olá! Identificamos sua solicitação urgente. Nossa equipe técnica já foi acionada e entrará em contato em até 30 minutos.';
    } else if (isOpportunity) {
      suggestedReply = 'Olá! Ficamos felizes com seu interesse. Vou te enviar mais informações sobre nossos planos e preços. Qual seria o melhor horário para conversarmos?';
    } else {
      suggestedReply = 'Olá! Recebi sua mensagem e vou analisar. Retorno em breve com mais informações.';
    }
  }

  // Save analysis
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .insert({
      conversation_id: conversationId,
      summary: text.substring(0, 200),
      intent: isUrgent ? 'urgency' : isOpportunity ? 'opportunity' : 'general',
      opportunity: isOpportunity,
      response_quality_score: isUrgent ? 90 : 70,
      sla_violations: slaViolations,
      suggested_reply: suggestedReply,
      raw_payload: {
        urgency: isUrgent,
        contact_type: contactType,
        keywords_detected: urgencyKeywords.filter(kw => text.toLowerCase().includes(kw))
      }
    })
    .select()
    .single();

  if (analysisError) {
    console.error('❌ [ANALYSIS] Error saving analysis:', analysisError);
  }

  // Update conversation contact_type
  await supabase
    .from('conversations')
    .update({ contact_type: contactType })
    .eq('id', conversationId);

  // Create alert if urgent
  if (isUrgent && analysis) {
    console.log('🚨 [ANALYSIS] Creating alert for urgent message');
    // Try to map message to device (if applicable)
    const deviceRef = extractDeviceReference(text);
    if (deviceRef) {
      await supabase
        .from('device_alerts')
        .insert({
          device_id: deviceRef,
          alert_type: 'manychat_urgent',
          severity: 'high',
          status: 'open',
          evidence: {
            message_id: messageId,
            conversation_id: conversationId,
            text: text
          }
        });
    }
  }

  return analysis;
}

function extractDeviceReference(text: string): string | null {
  // Try to extract device ID from text (e.g., "painel 123", "anydesk 456789")
  const anydeskMatch = text.match(/anydesk\s*:?\s*(\d+)/i);
  if (anydeskMatch) {
    // In real scenario, query devices table by anydesk_client_id
    return null; // Placeholder
  }
  
  const painelMatch = text.match(/painel\s*#?\s*(\d+)/i);
  if (painelMatch) {
    // In real scenario, query devices/painels table
    return null; // Placeholder
  }
  
  return null;
}
