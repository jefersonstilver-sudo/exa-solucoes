import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, nome } = await req.json();
    
    console.log('🔧 [FIX-ROLE] Corrigindo role para:', { email, role, nome });

    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Atualizar na tabela users
    const { data, error } = await supabaseServiceRole
      .from('users')
      .update({ role, nome })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ [FIX-ROLE] Erro:', error);
      throw error;
    }

    console.log('✅ [FIX-ROLE] Role corrigido com sucesso:', data);

    return new Response(
      JSON.stringify({ success: true, user: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [FIX-ROLE] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
