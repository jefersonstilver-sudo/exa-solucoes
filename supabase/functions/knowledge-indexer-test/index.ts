import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();

    // Verificar se bucket 'knowledge' existe
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) throw bucketsError;

    const knowledgeBucket = buckets?.find(b => b.name === 'knowledge');

    // Contar documentos na tabela
    const { count, error: countError } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const latency = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Knowledge base operational',
        bucketExists: !!knowledgeBucket,
        documentsCount: count || 0,
        latency,
        lastCheck: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[KNOWLEDGE-TEST] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Knowledge base check failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
