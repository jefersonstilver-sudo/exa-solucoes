import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, agentKey } = await req.json();

    console.log('[ANALYZE-IMAGE] 🖼️ Starting image analysis:', {
      imageUrl: imageUrl.substring(0, 100),
      agentKey,
      timestamp: new Date().toISOString()
    });

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Chamar OpenAI GPT-4o Vision
    console.log('[ANALYZE-IMAGE] 🤖 Calling OpenAI Vision API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Modelo com visão
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise esta imagem em detalhes:

🎯 PRIORIDADE: Identificar se é um painel digital da Exa Mídia
- Procure por painéis digitais em elevadores
- Identifique logo, branding ou características da Exa Mídia
- Detecte se há problemas técnicos (tela preta, erro, cabo solto, tela congelada, etc.)

Se for um painel da Exa:
1. Descreva o estado (funcionando/com problema)
2. Identifique o problema específico (se houver): tela preta, mensagem de erro, cabo desconectado, tela quebrada, conteúdo congelado
3. Descreva o que está sendo exibido

Se NÃO for um painel:
1. O que você vê na imagem
2. Texto presente (OCR completo)
3. Contexto e significado
4. Qualquer informação relevante

Seja detalhado e preciso.`
              },
              {
                type: 'image_url',
                image_url: { 
                  url: imageUrl,
                  detail: 'high' // Alta qualidade para melhor OCR
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3 // Baixa temperatura para precisão
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[ANALYZE-IMAGE] ❌ OpenAI error:', error);
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const description = result.choices?.[0]?.message?.content;

    if (!description) {
      throw new Error('No description returned from OpenAI');
    }

    console.log('[ANALYZE-IMAGE] ✅ Image analyzed successfully:', {
      descriptionLength: description.length,
      preview: description.substring(0, 100)
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        description,
        metadata: {
          model: 'gpt-4o',
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ANALYZE-IMAGE] 💥 Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});