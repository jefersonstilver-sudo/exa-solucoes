import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar se é admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: userData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      throw new Error('Only admins can generate binding codes');
    }

    const { building_id } = await req.json();

    if (!building_id) {
      throw new Error('building_id is required');
    }

    // Gerar código único formato EXA-XXXX
    let codigo: string;
    let codigoExists = true;

    while (codigoExists) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      codigo = `EXA-${randomNum}`;

      const { data: existing } = await supabaseClient
        .from('paineis_vinculos')
        .select('codigo')
        .eq('codigo', codigo)
        .single();

      codigoExists = !!existing;
    }

    // Criar vínculo pendente com expiração em 24h
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 24);

    const { data: vinculo, error } = await supabaseClient
      .from('paineis_vinculos')
      .insert({
        codigo: codigo!,
        building_id,
        status: 'pending',
        expira_em: expiraEm.toISOString(),
        criado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Buscar nome do prédio
    const { data: building } = await supabaseClient
      .from('buildings')
      .select('nome')
      .eq('id', building_id)
      .single();

    console.log(`✅ Código gerado: ${codigo} para prédio ${building?.nome || building_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        codigo: vinculo.codigo,
        vinculo_id: vinculo.id,
        building_name: building?.nome,
        expira_em: vinculo.expira_em,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao gerar código:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
