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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { messageId, fromEmail, fromName, subject, content, receivedAt } = await req.json();
    
    console.log('Analyzing email:', { messageId, fromEmail, subject });

    // Use Lovable AI to analyze the email
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const analysisPrompt = `Analise o seguinte email e determine se é um envio de currículo/candidatura de emprego.

ASSUNTO: ${subject}
REMETENTE: ${fromName} <${fromEmail}>
CONTEÚDO:
${content}

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem texto extra):
{
  "is_curriculum": true/false,
  "confidence": 0.0-1.0,
  "candidate_data": {
    "nome": "nome completo do candidato se identificado",
    "telefone": "telefone se encontrado",
    "email": "email do candidato",
    "cidade": "cidade se mencionada",
    "formacao": "formação acadêmica",
    "experiencia_anos": número estimado ou null,
    "ultimo_cargo": "último cargo se mencionado",
    "ultima_empresa": "última empresa se mencionada",
    "habilidades": ["lista", "de", "habilidades"],
    "pretensao_salarial": "pretensão se mencionada ou null",
    "disponibilidade": "disponibilidade se mencionada"
  },
  "hr_analysis": {
    "resumo": "resumo breve do perfil em 2-3 frases",
    "pontos_fortes": ["lista de pontos fortes identificados"],
    "areas_desenvolvimento": ["áreas que precisam desenvolvimento"],
    "adequacao_areas": ["áreas profissionais adequadas para o perfil"],
    "recomendacao": "recomendação geral (Recomendado/Neutro/Não Recomendado)",
    "nota_geral": 1-10
  }
}

Se NÃO for um currículo, retorne apenas:
{
  "is_curriculum": false,
  "confidence": 0.0-1.0,
  "reason": "motivo pelo qual não é currículo"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um analista de RH especializado. Analise emails e identifique currículos, extraindo informações estruturadas dos candidatos. Responda SEMPRE em JSON puro, sem markdown.' },
          { role: 'user', content: analysisPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', aiContent);

    // Parse AI response
    let analysis;
    try {
      // Clean up the response (remove markdown code blocks if present)
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      analysis = JSON.parse(cleanContent.trim());
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      analysis = { is_curriculum: false, confidence: 0, reason: 'Falha ao analisar' };
    }

    // Save to database
    const logEntry = {
      message_id: messageId,
      from_email: fromEmail,
      from_name: fromName,
      subject: subject,
      received_at: receivedAt ? new Date(receivedAt).toISOString() : new Date().toISOString(),
      is_curriculum: analysis.is_curriculum || false,
      candidate_data: analysis.is_curriculum ? analysis.candidate_data : null,
      ai_analysis: analysis.is_curriculum ? JSON.stringify(analysis.hr_analysis) : null,
      processed_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('email_processing_log')
      .insert(logEntry);

    if (insertError) {
      console.error('Error saving log:', insertError);
    }

    // If it's a curriculum, send notification
    if (analysis.is_curriculum && analysis.confidence >= 0.7) {
      console.log('Curriculum detected! Sending notification...');
      
      try {
        await supabase.functions.invoke('notify-curriculum-received', {
          body: {
            messageId,
            fromEmail,
            fromName,
            subject,
            candidateData: analysis.candidate_data,
            hrAnalysis: analysis.hr_analysis,
            receivedAt,
          },
        });
      } catch (e) {
        console.error('Error sending notification:', e);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        is_curriculum: analysis.is_curriculum,
        confidence: analysis.confidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-curriculum:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
