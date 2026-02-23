import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DETAILED_PROMPT = `You are a professional logo processing expert. Analyze and process this logo image with extreme precision:

## STEP 1 - BACKGROUND ANALYSIS
Identify the background type:
- Solid color (white, colored, dark)
- Gradient (linear, radial, complex)
- Textured or patterned
- Photographic/complex scene
- Already transparent

## STEP 2 - PRECISE BACKGROUND REMOVAL
- Remove ALL background pixels completely
- Preserve every detail of the logo: fine edges, thin lines, small text, subtle shadows
- Handle anti-aliased edges carefully - keep smooth transitions
- If the logo has semi-transparent elements, preserve them
- Clean up any halo or fringe artifacts around edges

## STEP 3 - COLOR CONVERSION TO WHITE/GRAY
Convert the entire logo to a white and light gray color scheme:
- Main logo elements: PURE WHITE (#FFFFFF)
- Secondary details, outlines, shadows: light gray (#E0E0E0 to #F0F0F0)
- Preserve the visual hierarchy and depth of the original design
- If the logo has gradients, convert them to white-to-light-gray gradients
- Text in the logo must be crisp white

## STEP 4 - QUALITY & CLEANUP
- Remove any artifacts, noise, or irregular edges
- Ensure clean, professional borders on all elements
- Maintain original proportions - DO NOT stretch or distort
- Center the logo with adequate padding (about 5-8% on each side)
- Output as high-quality PNG with transparent background

## CRITICAL RULES:
- The final image MUST have a TRANSPARENT background
- ALL logo elements must be WHITE or VERY LIGHT GRAY only
- NO other colors are allowed in the output
- Preserve ALL fine details, text, and design elements
- The logo will be displayed on dark red backgrounds (#6B1515) in professional documents`;

const SIMPLE_PROMPT = `Remove the background from this logo image completely (make it transparent). Then convert ALL colors in the logo to pure white (#FFFFFF). Output a white logo on transparent background. Keep all details and proportions intact.`;

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

    // 2. Processar com IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: true, originalUrl, processedUrl: null, processed: false, message: 'AI not available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageDataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

    // Attempt 1: Detailed prompt
    console.log('[PROCESS-CLIENT-LOGO] 🤖 Tentativa 1: prompt detalhado...');
    let processedImageUrl = await callAI(LOVABLE_API_KEY, DETAILED_PROMPT, imageDataUrl);

    // Attempt 2: Simple prompt (retry)
    if (!processedImageUrl) {
      console.log('[PROCESS-CLIENT-LOGO] 🔄 Tentativa 2: prompt simplificado...');
      processedImageUrl = await callAI(LOVABLE_API_KEY, SIMPLE_PROMPT, imageDataUrl);
    }

    if (!processedImageUrl) {
      console.log('[PROCESS-CLIENT-LOGO] ⚠️ Ambas tentativas falharam');
      return new Response(
        JSON.stringify({ 
          success: true, originalUrl, processedUrl: null, processed: false,
          message: 'AI could not process the image after 2 attempts'
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

async function callAI(apiKey: string, prompt: string, imageDataUrl: string): Promise<string | null> {
  try {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROCESS-CLIENT-LOGO] AI error:', response.status, errorText);
      
      if (response.status === 429 || response.status === 402) {
        // Don't retry on rate limit or payment errors
        return null;
      }
      return null;
    }

    const aiResult = await response.json();
    const imageUrl = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl && imageUrl.startsWith('data:')) {
      console.log('[PROCESS-CLIENT-LOGO] ✅ AI returned valid image');
      return imageUrl;
    }
    
    console.log('[PROCESS-CLIENT-LOGO] ⚠️ AI did not return valid image');
    return null;
  } catch (err) {
    console.error('[PROCESS-CLIENT-LOGO] AI call error:', err);
    return null;
  }
}
