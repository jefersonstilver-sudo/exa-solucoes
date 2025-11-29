import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  userId: string;
  telefone: string;
  codigo: string;
  tipo: 'phone_change' | '2fa_login' | 'new_phone' | 'signup';
  novoTelefone?: string; // Para tipo 'new_phone'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: RequestBody = await req.json();
    const { userId, telefone, codigo, tipo, novoTelefone } = body;

    console.log('🔍 [VERIFY-USER-CODE] Verificando código:', { 
      userId, 
      telefone: telefone?.substring(0, 8) + '****', 
      tipo,
      codigo: codigo?.substring(0, 3) + '***'
    });

    if (!userId || !telefone || !codigo || !tipo) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar código válido no banco
    const { data: codigoData, error: codigoError } = await supabase
      .from('exa_alerts_verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('telefone', telefone)
      .eq('codigo', codigo)
      .eq('tipo_verificacao', tipo)
      .eq('verificado', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codigoError) {
      console.error('❌ [VERIFY-USER-CODE] Erro ao buscar código:', codigoError);
      throw codigoError;
    }

    if (!codigoData) {
      console.warn('⚠️ [VERIFY-USER-CODE] Código inválido ou expirado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código inválido ou expirado' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marcar código como verificado
    const { error: updateCodigoError } = await supabase
      .from('exa_alerts_verification_codes')
      .update({ verificado: true })
      .eq('id', codigoData.id);

    if (updateCodigoError) {
      console.error('❌ [VERIFY-USER-CODE] Erro ao atualizar código:', updateCodigoError);
      throw updateCodigoError;
    }

    console.log('✅ [VERIFY-USER-CODE] Código verificado com sucesso');

    // Se for verificação de novo número, atualizar o telefone do usuário
    if (tipo === 'new_phone' && novoTelefone) {
      console.log('📱 [VERIFY-USER-CODE] Atualizando telefone do usuário');
      
      // Atualizar na tabela users
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ 
          telefone: novoTelefone,
          telefone_verificado: true,
          telefone_verificado_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateUserError) {
        console.error('❌ [VERIFY-USER-CODE] Erro ao atualizar telefone:', updateUserError);
        throw updateUserError;
      }

      // Atualizar user_metadata no auth
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { phone: novoTelefone } }
      );

      if (authUpdateError) {
        console.error('⚠️ [VERIFY-USER-CODE] Erro ao atualizar metadata:', authUpdateError);
      }

      console.log('✅ [VERIFY-USER-CODE] Telefone atualizado com sucesso');
    }

    // Se for verificação de cadastro ou primeiro número, marcar como verificado
    if (tipo === 'signup') {
      const { error: markVerifiedError } = await supabase
        .from('users')
        .update({ 
          telefone_verificado: true,
          telefone_verificado_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (markVerifiedError) {
        console.error('⚠️ [VERIFY-USER-CODE] Erro ao marcar telefone como verificado:', markVerifiedError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código verificado com sucesso' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [VERIFY-USER-CODE] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao verificar código' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
