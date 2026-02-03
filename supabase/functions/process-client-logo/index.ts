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
    const { imageBase64, fileName } = await req.json();

    console.log('[PROCESS-CLIENT-LOGO] 🎨 Iniciando processamento de logo:', {
      fileName,
      imageSize: imageBase64?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // 1. Processar com Gemini Image (remoção de fundo + upscale)
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
          JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle payment required
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log('[PROCESS-CLIENT-LOGO] 📊 Resposta da IA recebida');

    // Extrair a imagem processada
    const processedImageUrl = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!processedImageUrl) {
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ IA não retornou imagem, usando original');
      // Fallback: usar imagem original se IA não processar
      // Mas ainda precisamos fazer upload para storage
    }

    // 2. Upload para Supabase Storage
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Preparar imagem para upload
    let imageDataToUpload: Uint8Array;
    
    if (processedImageUrl && processedImageUrl.startsWith('data:')) {
      // Extrair base64 da data URL processada
      const base64Data = processedImageUrl.split(',')[1];
      imageDataToUpload = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('[PROCESS-CLIENT-LOGO] ✅ Usando imagem processada pela IA');
    } else {
      // Fallback: usar imagem original
      const originalBase64 = imageBase64.startsWith('data:') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      imageDataToUpload = Uint8Array.from(atob(originalBase64), c => c.charCodeAt(0));
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ Usando imagem original (fallback)');
    }

    // Gerar nome único para o arquivo
    const sanitizedFileName = (fileName || 'logo.png')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_+/g, '_');
    
    const storagePath = `proposal-client-logos/${Date.now()}_${sanitizedFileName}`;
    
    console.log('[PROCESS-CLIENT-LOGO] 📤 Fazendo upload para:', storagePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('arquivos')
      .upload(storagePath, imageDataToUpload, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[PROCESS-CLIENT-LOGO] ❌ Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 3. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('arquivos')
      .getPublicUrl(storagePath);

    const logoUrl = publicUrlData.publicUrl;

    console.log('[PROCESS-CLIENT-LOGO] ✅ Logo processada com sucesso:', {
      storagePath,
      logoUrl: logoUrl.substring(0, 80) + '...'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        logoUrl,
        storagePath,
        processed: Boolean(processedImageUrl)
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
