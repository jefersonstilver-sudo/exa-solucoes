import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, fileName, onlyUploadOriginal = false } = await req.json();

    console.log('[PROCESS-CLIENT-LOGO] 🎨 Iniciando processamento de logo:', {
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

    // Gerar nome único para o arquivo
    const sanitizedFileName = (fileName || 'logo.png')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_+/g, '_');
    
    const timestamp = Date.now();
    const originalPath = `proposal-client-logos/original/${timestamp}_${sanitizedFileName}`;
    
    console.log('[PROCESS-CLIENT-LOGO] 📤 Fazendo upload do original para:', originalPath);

    // 1. SEMPRE fazer upload do original primeiro
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

    // Obter URL pública do original
    const { data: originalUrlData } = supabase.storage
      .from('arquivos')
      .getPublicUrl(originalPath);

    const originalUrl = originalUrlData.publicUrl;
    console.log('[PROCESS-CLIENT-LOGO] ✅ Original uploaded:', originalUrl.substring(0, 80) + '...');

    // Se onlyUploadOriginal, retornar apenas o original
    if (onlyUploadOriginal) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          originalUrl,
          processedUrl: null,
          processed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Processar com Gemini Image (remoção de fundo + upscale)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ LOVABLE_API_KEY not configured, returning original only');
      return new Response(
        JSON.stringify({ 
          success: true, 
          originalUrl,
          processedUrl: null,
          processed: false,
          message: 'AI processing not available'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PROCESS-CLIENT-LOGO] 🤖 Enviando para Gemini Image API...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Process this logo image:
1. Remove the background completely - make it transparent
2. Enhance the quality and resolution (upscale if needed)
3. Keep the original logo colors and design intact
4. Make the logo clean and professional
5. Output as high-quality PNG with transparent background
6. Center the logo in the output image

This logo will be used on professional business documents and proposals.`
              },
              {
                type: 'image_url',
                image_url: { 
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROCESS-CLIENT-LOGO] ❌ Gemini API error:', response.status, errorText);
      
      // Handle rate limit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            originalUrl,
            processedUrl: null,
            processed: false,
            error: 'Rate limits exceeded. Please try again later.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle payment required
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            originalUrl,
            processedUrl: null,
            processed: false,
            error: 'Payment required. Please add credits to continue.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return original on API error
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ AI processing failed, returning original only');
      return new Response(
        JSON.stringify({ 
          success: true, 
          originalUrl,
          processedUrl: null,
          processed: false,
          error: `AI error: ${response.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await response.json();
    console.log('[PROCESS-CLIENT-LOGO] 📊 Resposta da IA recebida');

    // Extrair a imagem processada
    const processedImageUrl = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!processedImageUrl || !processedImageUrl.startsWith('data:')) {
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ IA não retornou imagem válida, usando original');
      return new Response(
        JSON.stringify({ 
          success: true, 
          originalUrl,
          processedUrl: null,
          processed: false,
          message: 'AI did not return processed image'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Upload da imagem processada
    const processedBase64 = processedImageUrl.split(',')[1];
    const processedData = Uint8Array.from(atob(processedBase64), c => c.charCodeAt(0));
    const processedPath = `proposal-client-logos/processed/${timestamp}_${sanitizedFileName}`;

    console.log('[PROCESS-CLIENT-LOGO] 📤 Fazendo upload da processada para:', processedPath);

    const { error: processedUploadError } = await supabase.storage
      .from('arquivos')
      .upload(processedPath, processedData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (processedUploadError) {
      console.error('[PROCESS-CLIENT-LOGO] ❌ Upload processed error:', processedUploadError);
      // Still return success with original
      return new Response(
        JSON.stringify({ 
          success: true, 
          originalUrl,
          processedUrl: null,
          processed: false,
          error: `Upload processed failed: ${processedUploadError.message}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter URL pública da processada
    const { data: processedUrlData } = supabase.storage
      .from('arquivos')
      .getPublicUrl(processedPath);

    const processedUrl = processedUrlData.publicUrl;

    console.log('[PROCESS-CLIENT-LOGO] ✅ Logo processada com sucesso:', {
      originalUrl: originalUrl.substring(0, 60) + '...',
      processedUrl: processedUrl.substring(0, 60) + '...'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        originalUrl,
        processedUrl,
        processed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESS-CLIENT-LOGO] 💥 Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
