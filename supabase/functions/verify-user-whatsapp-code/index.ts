import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


// Segurança (02/11/2026): quem pede/verifica código para uma conta tem que ser o dono da conta (JWT) ou a equipe.
// Antes o userId vinha do corpo: dava para trocar o telefone de qualquer conta e o limite era por sessionId (contornável).
const EQUIPE = ['super_admin', 'admin', 'admin_financeiro', 'admin_departamental', 'comercial'];
async function donoOuEquipe(supabase: any, req: Request, userId?: string): Promise<boolean> {
  if (!userId) return true;
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;
  if (user.id === userId) return true;
  const { data: papeis } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  return (papeis || []).some((r: any) => EQUIPE.includes(String(r.role)));
}
const soDigitos = (t?: string) => String(t || '').replace(/\D/g, '');

interface RequestBody {
  userId?: string;
  telefone: string;
  codigo: string;
  tipo: 'phone_change' | '2fa_login' | 'new_phone' | 'signup';
  novoTelefone?: string; // Para tipo 'new_phone'
  sessionId?: string; // Para signup sem userId
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: RequestBody = await req.json();
    const { userId, telefone, codigo, tipo, novoTelefone, sessionId } = body;

    console.log('🔍 [VERIFY-USER-CODE] Verificando código:', { 
      userId: userId || 'sem userId (signup)',
      telefone: telefone?.substring(0, 8) + '****', 
      tipo,
      codigo: codigo?.substring(0, 3) + '***',
      sessionId: sessionId || 'sem session'
    });

    if (!telefone || !codigo || !tipo) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios faltando (telefone, codigo, tipo)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para signup, pode usar sessionId; para outros, userId é obrigatório
    if (tipo !== 'signup' && !userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório para este tipo de verificação' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tipo === 'signup' && !userId && !sessionId) {
      return new Response(
        JSON.stringify({ error: 'userId ou sessionId é obrigatório para signup' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!(await donoOuEquipe(supabase, req, userId))) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    let telefoneAlvo = telefone;
    if (userId && (tipo === '2fa_login' || tipo === 'phone_change')) {
      const { data: u } = await supabase.from('users').select('telefone').eq('id', userId).maybeSingle();
      if (u?.telefone) telefoneAlvo = u.telefone;
    }
    // troca de número: só grava o número que recebeu o código
    if (tipo === 'new_phone' && novoTelefone && soDigitos(novoTelefone) !== soDigitos(telefone)) {
      return new Response(JSON.stringify({ success: false, error: 'O novo número precisa ser o mesmo que recebeu o código' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Buscar código válido no banco
    let codigoQuery = supabase
      .from('exa_alerts_verification_codes')
      .select('*')
      .eq('telefone', telefoneAlvo)
      .eq('codigo', codigo)
      .lt('tentativas', 5)
      .eq('tipo_verificacao', tipo)
      .eq('verificado', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    // Filtrar por userId ou sessionId
    if (userId) {
      codigoQuery = codigoQuery.eq('user_id', userId);
    } else if (sessionId) {
      codigoQuery = codigoQuery.eq('session_id', sessionId);
    }

    const { data: codigoData, error: codigoError } = await codigoQuery.maybeSingle();

    if (codigoError) {
      console.error('❌ [VERIFY-USER-CODE] Erro ao buscar código:', codigoError);
      throw codigoError;
    }

    if (!codigoData) {
      // conta a tentativa errada no código ativo deste telefone; com 5 erros o código deixa de valer (antes dava para chutar sem limite)
      const { data: ativo } = await supabase.from('exa_alerts_verification_codes').select('id, tentativas')
        .eq('telefone', telefoneAlvo).eq('tipo_verificacao', tipo).eq('verificado', false)
        .gte('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (ativo) await supabase.from('exa_alerts_verification_codes').update({ tentativas: (ativo.tentativas || 0) + 1 }).eq('id', ativo.id);
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
    // Mas só se já tivermos userId (conta já criada)
    if (tipo === 'signup' && userId) {
      const { error: markVerifiedError } = await supabase
        .from('users')
        .update({ 
          telefone_verificado: true,
          telefone_verificado_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (markVerifiedError) {
        console.error('⚠️ [VERIFY-USER-CODE] Erro ao marcar telefone como verificado:', markVerifiedError);
      } else {
        console.log('✅ [VERIFY-USER-CODE] Telefone marcado como verificado');
      }
    }

    // Se for verificação do número atual (phone_change), marcar como verificado
    if (tipo === 'phone_change' && userId) {
      const { error: markVerifiedError } = await supabase
        .from('users')
        .update({ 
          telefone_verificado: true,
          telefone_verificado_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (markVerifiedError) {
        console.error('⚠️ [VERIFY-USER-CODE] Erro ao marcar telefone como verificado (phone_change):', markVerifiedError);
      } else {
        console.log('✅ [VERIFY-USER-CODE] Telefone marcado como verificado via phone_change');
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
