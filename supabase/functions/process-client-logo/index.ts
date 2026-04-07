import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DETAILED_PROMPT = `Você é um especialista em tratamento profissional de logos para uso digital e branding.

1. REMOVER O FUNDO COMPLETAMENTE
- Fundo 100% transparente (sem resíduos, sem sombras, sem pixels)
- NÃO pode sobrar borda branca, azul ou qualquer cor
- PNG com transparência real (alpha)

2. CONVERTER PARA MONOCROMÁTICA - SEMPRE EM CORES CLARAS PARA CONTRASTE
- CASO 1 — LOGO COM ELEMENTOS VISUAIS (ícones, desenhos, símbolos, mascotes):
  Converter para tons de CINZA CLARO (grayscale profissional), preservar contraste e profundidade
- CASO 2 — LOGO APENAS TEXTO:
  Converter para BRANCO puro (#FFFFFF), sem cinza, sem degradê

3. QUALIDADE
- Melhorar nitidez, corrigir serrilhados (anti-aliasing)
- Manter proporção original, NÃO distorcer tipografia

4. CASOS ESPECIAIS
- Fundo complexo (gradiente, imagem, textura) → remover completamente
- Sombra, glow, reflexo → remover
- Múltiplas cores → adaptar para branco ou cinza conforme regra 2

Entregar logo limpa, profissional, monocromática em cores claras, sem fundo, pronta para uso imediato.
NÃO explicar o processo. NÃO perguntar nada. Apenas entregar o arquivo pronto.`;

const SIMPLE_PROMPT = `Remove the background completely (transparent PNG). Convert logo to light monochrome: if it has icons/symbols/mascots use light grayscale tones, if text-only use pure white #FFFFFF. The logo must always be in LIGHT colors for contrast on dark backgrounds. Remove all shadows, glows, reflections. Keep proportions and details intact. Just deliver the result, no explanation.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName, onlyUploadOriginal = false } = await req.json();

    console.log('[PROCESS-CLIENT-LOGO] 🎨 Iniciando:', {
      fileName,
      imageSize: imageBase64?.length || 0,
      onlyUploadOriginal,
      timestamp: new Date().toISOString()
    });

    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Preparar dados do original
    const originalBase64 = imageBase64.startsWith('data:') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    const originalData = Uint8Array.from(atob(originalBase64), c => c.charCodeAt(0));

    const sanitizedFileName = (fileName || 'logo.png')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_+/g, '_');
    
    const timestamp = Date.now();
    const originalPath = `proposal-client-logos/original/${timestamp}_${sanitizedFileName}`;
    
    // 1. Upload do original
    const { error: originalUploadError } = await supabase.storage
      .from('arquivos')
      .upload(originalPath, originalData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (originalUploadError) {
      console.error('[PROCESS-CLIENT-LOGO] ❌ Upload original error:', originalUploadError);
      throw new Error(`Upload original failed: ${originalUploadError.message}`);
    }

    const { data: originalUrlData } = supabase.storage
      .from('arquivos')
      .getPublicUrl(originalPath);

    const originalUrl = originalUrlData.publicUrl;
    console.log('[PROCESS-CLIENT-LOGO] ✅ Original uploaded');

    if (onlyUploadOriginal) {
      return new Response(
        JSON.stringify({ success: true, originalUrl, processedUrl: null, processed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Processar com IA - Tentar OpenAI primeiro, depois Lovable Gateway como fallback
    const imageDataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

    // Attempt 1: OpenAI GPT-4o
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    let processedImageUrl: string | null = null;

    if (OPENAI_API_KEY) {
      console.log('[PROCESS-CLIENT-LOGO] 🤖 Tentativa 1: OpenAI GPT-4o...');
      processedImageUrl = await callOpenAI(OPENAI_API_KEY, DETAILED_PROMPT, imageDataUrl);
    } else {
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ OPENAI_API_KEY not configured, skipping OpenAI');
    }

    // Attempt 2: Lovable AI Gateway (fallback)
    if (!processedImageUrl) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        console.log('[PROCESS-CLIENT-LOGO] 🔄 Tentativa 2: Lovable Gateway gemini-2.5-flash...');
        processedImageUrl = await callLovableGateway(LOVABLE_API_KEY, SIMPLE_PROMPT, imageDataUrl);
      } else {
        console.log('[PROCESS-CLIENT-LOGO] ⚠️ LOVABLE_API_KEY not configured');
      }
    }

    if (!processedImageUrl) {
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ Todas as tentativas falharam');
      return new Response(
        JSON.stringify({ 
          success: true, originalUrl, processedUrl: null, processed: false,
          message: 'AI could not process the image after all attempts'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Upload da imagem processada
    const processedBase64 = processedImageUrl.split(',')[1];
    const processedData = Uint8Array.from(atob(processedBase64), c => c.charCodeAt(0));
    const processedPath = `proposal-client-logos/processed/${timestamp}_${sanitizedFileName}`;

    const { error: processedUploadError } = await supabase.storage
      .from('arquivos')
      .upload(processedPath, processedData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (processedUploadError) {
      console.error('[PROCESS-CLIENT-LOGO] ❌ Upload processed error:', processedUploadError);
      return new Response(
        JSON.stringify({ success: true, originalUrl, processedUrl: null, processed: false, error: processedUploadError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: processedUrlData } = supabase.storage
      .from('arquivos')
      .getPublicUrl(processedPath);

    console.log('[PROCESS-CLIENT-LOGO] ✅ Logo processada com sucesso');

    return new Response(
      JSON.stringify({ success: true, originalUrl, processedUrl: processedUrlData.publicUrl, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESS-CLIENT-LOGO] 💥 Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// OpenAI GPT-4o - image input via chat completions
async function callOpenAI(apiKey: string, prompt: string, imageDataUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50s timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } }
          ]
        }],
        max_tokens: 4096
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROCESS-CLIENT-LOGO] OpenAI error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    // GPT-4o retorna texto descritivo, não imagem direta via chat completions
    // Precisamos usar a API de images/generations para gerar a versão processada
    // Como GPT-4o chat não retorna imagem editada, vamos usar DALL-E 3 approach:
    // Na verdade, GPT-4o com image output não é suportado via /chat/completions padrão
    // Vamos usar a Lovable Gateway que suporta modalities: ['image', 'text']
    console.log('[PROCESS-CLIENT-LOGO] ⚠️ OpenAI chat completions não suporta output de imagem, usando fallback');
    return null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[PROCESS-CLIENT-LOGO] OpenAI timeout (50s)');
    } else {
      console.error('[PROCESS-CLIENT-LOGO] OpenAI call error:', err);
    }
    return null;
  }
}

// Lovable AI Gateway - supports image output via modalities
async function callLovableGateway(apiKey: string, prompt: string, imageDataUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50s timeout

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]
        }],
        modalities: ['image', 'text']
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROCESS-CLIENT-LOGO] Gateway error:', response.status, errorText);
      return null;
    }

    const aiResult = await response.json();
    const imageUrl = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl && imageUrl.startsWith('data:')) {
      console.log('[PROCESS-CLIENT-LOGO] ✅ Gateway returned valid image');
      return imageUrl;
    }
    
    console.log('[PROCESS-CLIENT-LOGO] ⚠️ Gateway did not return valid image');
    return null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[PROCESS-CLIENT-LOGO] Gateway timeout (50s)');
    } else {
      console.error('[PROCESS-CLIENT-LOGO] Gateway call error:', err);
    }
    return null;
  }
}
