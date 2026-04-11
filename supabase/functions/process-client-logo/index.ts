import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const originalImage = parseImageData(imageBase64);
    const sanitizedFileName = sanitizeFileName(fileName || 'logo.png', originalImage.mimeType);
    const timestamp = Date.now();
    const originalPath = `proposal-client-logos/original/${timestamp}_${sanitizedFileName}`;

    console.log('[PROCESS-CLIENT-LOGO] 🎨 Iniciando:', {
      fileName,
      imageSize: imageBase64?.length || 0,
      onlyUploadOriginal,
      hasOpenAI: !!Deno.env.get('OPENAI_API_KEY'),
      hasLovable: !!Deno.env.get('LOVABLE_API_KEY'),
      timestamp: new Date().toISOString()
    });

    const { error: originalUploadError } = await supabase.storage
      .from('arquivos')
      .upload(originalPath, originalImage.bytes, {
        contentType: originalImage.mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (originalUploadError) {
      throw new Error(`Upload original failed: ${originalUploadError.message}`);
    }

    const originalUrl = getStorageUrl(supabase, 'arquivos', originalPath);
    const originalPreviewUrl = await createSignedPreviewUrl(supabase, 'arquivos', originalPath, originalUrl);

    if (onlyUploadOriginal) {
      return jsonResponse({
        success: true,
        originalUrl,
        originalPreviewUrl,
        processedUrl: null,
        processedPreviewUrl: null,
        processed: false
      });
    }

    let processedImageUrl: string | null = null;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (OPENAI_API_KEY) {
      console.log('[PROCESS-CLIENT-LOGO] 🤖 Tentativa 1: OpenAI gpt-image-1...');
      processedImageUrl = await callOpenAI(OPENAI_API_KEY, DETAILED_PROMPT, originalImage.bytes, originalImage.mimeType, sanitizedFileName);
    }

    if (!processedImageUrl && LOVABLE_API_KEY) {
      console.log('[PROCESS-CLIENT-LOGO] 🔄 Tentativa 2: Lovable Gateway gemini-2.5-flash-image...');
      processedImageUrl = await callLovableGateway(LOVABLE_API_KEY, SIMPLE_PROMPT, originalImage.dataUrl);
    }

    if (!processedImageUrl) {
      return jsonResponse({
        success: true,
        originalUrl,
        originalPreviewUrl,
        processedUrl: null,
        processedPreviewUrl: null,
        processed: false,
        message: 'A IA não conseguiu concluir o tratamento da logo.'
      });
    }

    const processedImage = parseImageData(processedImageUrl, 'image/png');
    const processedPath = `proposal-client-logos/processed/${timestamp}_${sanitizedFileName.replace(/\.(png|jpg|jpeg|webp)$/i, '.png')}`;

    const { error: processedUploadError } = await supabase.storage
      .from('arquivos')
      .upload(processedPath, processedImage.bytes, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (processedUploadError) {
      throw new Error(`Upload processed failed: ${processedUploadError.message}`);
    }

    const processedUrl = getStorageUrl(supabase, 'arquivos', processedPath);
    const processedPreviewUrl = await createSignedPreviewUrl(supabase, 'arquivos', processedPath, processedUrl);

    console.log('[PROCESS-CLIENT-LOGO] ✅ Logo processada com sucesso');

    return jsonResponse({
      success: true,
      originalUrl,
      originalPreviewUrl,
      processedUrl,
      processedPreviewUrl,
      processed: true
    });
  } catch (error) {
    console.error('[PROCESS-CLIENT-LOGO] 💥 Error:', error);
    return jsonResponse({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function getStorageUrl(supabase: ReturnType<typeof createClient>, bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function createSignedPreviewUrl(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  fallbackUrl: string
) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (data?.signedUrl && !error) return data.signedUrl;
  return fallbackUrl;
}

function sanitizeFileName(fileName: string, mimeType: string) {
  const extension = extensionFromMimeType(mimeType);
  const normalized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/\.(png|jpg|jpeg|webp)$/i, '');

  return `${normalized}.${extension}`;
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

function parseImageData(input: string, fallbackMimeType = 'image/png') {
  const match = input.match(/^data:(.*?);base64,(.*)$/);
  const mimeType = match?.[1] || fallbackMimeType;
  const base64 = match?.[2] || input;
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return {
    mimeType,
    bytes,
    dataUrl: match ? input : `data:${mimeType};base64,${base64}`
  };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function callOpenAI(
  apiKey: string,
  prompt: string,
  imageBytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');
    formData.append('image', new Blob([imageBytes], { type: mimeType }), fileName);

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROCESS-CLIENT-LOGO] OpenAI error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const b64Json = result?.data?.[0]?.b64_json;
    if (b64Json) {
      console.log('[PROCESS-CLIENT-LOGO] ✅ OpenAI returned valid image');
      return `data:image/png;base64,${b64Json}`;
    }

    const imageUrl = result?.data?.[0]?.url;
    if (imageUrl) {
      const imageResponse = await fetch(imageUrl, { signal: controller.signal });
      if (!imageResponse.ok) return null;
      const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
      return `data:image/png;base64,${bytesToBase64(imageBuffer)}`;
    }

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

async function callLovableGateway(apiKey: string, prompt: string, imageDataUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

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
