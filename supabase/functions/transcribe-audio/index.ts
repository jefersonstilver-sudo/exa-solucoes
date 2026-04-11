import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, language = 'pt', prompt = 'Áudio de WhatsApp' } = await req.json();

    if (!audioUrl) {
      throw new Error('audioUrl is required');
    }

    console.log('[TRANSCRIBE-AUDIO] 🎤 Starting transcription:', { audioUrl, language, prompt });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Download audio from Z-API
    console.log('[TRANSCRIBE-AUDIO] ⬇️ Downloading audio...');
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log('[TRANSCRIBE-AUDIO] ✅ Audio downloaded:', audioBlob.size, 'bytes');

    // Validate file size (max 25MB for Whisper)
    if (audioBlob.size > 25 * 1024 * 1024) {
      throw new Error('Audio file too large (max 25MB)');
    }

    // Prepare form data for Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    if (prompt) {
      formData.append('prompt', prompt);
    }

    // Call OpenAI Whisper API
    console.log('[TRANSCRIBE-AUDIO] 🔄 Calling Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('[TRANSCRIBE-AUDIO] ❌ Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${whisperResponse.status} - ${errorText}`);
    }

    const transcription = await whisperResponse.json();
    console.log('[TRANSCRIBE-AUDIO] ✅ Transcription successful:', transcription.text?.substring(0, 100));

    return new Response(
      JSON.stringify({
        text: transcription.text,
        language: language,
        duration: audioBlob.size / 16000, // Rough estimate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TRANSCRIBE-AUDIO] ❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        text: '[Áudio - erro ao transcrever]'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
