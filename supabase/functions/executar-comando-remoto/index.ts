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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Cliente com service role para bypass de RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Cliente para verificar autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar se é admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized - Invalid token');
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      console.error('❌ User is not admin:', user.id, userData?.role);
      throw new Error('Only admins can execute remote commands');
    }

    console.log('✅ Admin verified:', user.email, userData.role);

    const { painel_id, comando, parametros } = await req.json();

    if (!painel_id || !comando) {
      throw new Error('painel_id e comando são obrigatórios');
    }

    // Validar comando
    const comandosValidos = ['atualizar_url', 'reiniciar_app', 'desvincular', 'capturar_screenshot'];
    if (!comandosValidos.includes(comando)) {
      throw new Error(`Comando inválido. Permitidos: ${comandosValidos.join(', ')}`);
    }

    // Criar comando na tabela usando admin client
    const { data: novoComando, error } = await supabaseAdmin
      .from('paineis_comandos')
      .insert({
        painel_id,
        comando,
        parametros: parametros || {},
        status: 'pendente',
        criado_por: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar comando:', error);
      throw error;
    }

    console.log(`📡 Comando enviado: ${comando} para painel ${painel_id}`);

    // Log do sistema
    await supabaseAdmin
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'COMANDO_REMOTO_ENVIADO',
        descricao: `Admin ${user.email} enviou comando ${comando} para painel ${painel_id}`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        comando_id: novoComando.id,
        comando,
        painel_id,
        status: 'pendente',
        message: 'Comando enviado com sucesso. O painel executará no próximo heartbeat.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro ao executar comando remoto:', error);
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
