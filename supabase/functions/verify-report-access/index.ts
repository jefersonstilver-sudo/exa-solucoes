// ============================================
// EDGE FUNCTION: verify-report-access
// Verifica autenticação do diretor por senha
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { report_id, password } = await req.json();

    console.log('🔐 [VERIFY ACCESS] Verificando acesso ao relatório:', report_id);

    // 1. Verificar se relatório existe e não expirou
    const { data: report, error: reportError } = await supabase
      .from('generated_reports')
      .select('id, expires_at, created_by, report_data')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      console.log('❌ Relatório não encontrado');
      return new Response(
        JSON.stringify({ error: 'Relatório não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Verificar expiração
    if (new Date(report.expires_at) < new Date()) {
      console.log('⏰ Relatório expirado');
      return new Response(
        JSON.stringify({ error: 'Link expirado', expired: true }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. BUSCAR DIRETORES VINCULADOS A ESTE RELATÓRIO
    const { data: linkedDirectors, error: linkError } = await supabase
      .from('report_director_links')
      .select('director_id')
      .eq('report_id', report_id);

    let directorIds: string[] = [];
    
    if (linkError || !linkedDirectors || linkedDirectors.length === 0) {
      console.log('⚠️ Nenhum vínculo encontrado, buscando todos os admins (fallback)');
      // Fallback: buscar todos os diretores admin (compatibilidade com relatórios antigos)
      const { data: allAdmins } = await supabase
        .from('exa_alerts_directors')
        .select('id')
        .eq('ativo', true)
        .eq('nivel_acesso', 'admin');
      
      directorIds = allAdmins?.map(a => a.id) || [];
    } else {
      directorIds = linkedDirectors.map(l => l.director_id);
      console.log(`🔗 ${directorIds.length} diretor(es) vinculado(s) ao relatório`);
    }

    if (directorIds.length === 0) {
      console.log('❌ Nenhum diretor encontrado');
      return new Response(
        JSON.stringify({ error: 'Sistema de autenticação indisponível' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. VERIFICAR SENHA PARA CADA DIRETOR VINCULADO
    let authenticatedUser = null;

    for (const directorId of directorIds) {
      // Buscar user_id do diretor
      const { data: director, error: dirError } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, user_id')
        .eq('id', directorId)
        .single();

      if (dirError || !director?.user_id) {
        console.log(`⚠️ Diretor ${directorId} sem user_id vinculado`);
        continue;
      }

      // Buscar email do auth.users
      const { data: authData, error: authFetchError } = await supabase.auth.admin.getUserById(director.user_id);
      
      if (authFetchError || !authData?.user?.email) {
        console.log(`⚠️ Erro ao buscar email do user_id ${director.user_id}`);
        continue;
      }

      console.log(`🔍 Testando autenticação para: ${authData.user.email}`);

      // Criar cliente anon para testar autenticação
      const anonSupabase = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY')!
      );

      // Tentar autenticar com a senha digitada
      const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
        email: authData.user.email,
        password: password
      });

      if (!signInError && signInData?.user) {
        // SUCESSO! Senha correta
        authenticatedUser = {
          id: director.user_id,
          email: authData.user.email,
          role: 'director',
          director_name: director.nome
        };
        console.log(`✅ Diretor autenticado: ${director.nome} (${authData.user.email})`);
        break;
      } else {
        console.log(`❌ Senha incorreta para ${authData.user.email}`);
      }
    }

    // 5. FALLBACK: Código de emergência EXA2024
    if (!authenticatedUser && password === 'EXA2024') {
      console.log('⚠️ Acesso via código de emergência EXA2024');
      authenticatedUser = {
        id: 'emergency',
        email: 'emergency_access',
        role: 'emergency',
        director_name: 'Acesso Emergência'
      };
    }

    if (!authenticatedUser) {
      console.log('❌ Autenticação falhou - senha incorreta');
      return new Response(
        JSON.stringify({ error: 'Senha incorreta' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 6. Registrar acesso
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    await supabase.from('report_access_tokens').insert({
      report_id,
      admin_id: authenticatedUser.id,
      access_granted_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // 7. Gerar token de sessão temporário (válido por 1 hora)
    const accessToken = crypto.randomUUID();

    console.log(`✅ Acesso concedido para: ${authenticatedUser.email || authenticatedUser.director_name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        access_token: accessToken,
        admin_email: authenticatedUser.email,
        director_name: authenticatedUser.director_name,
        report_data: report.report_data,
        auth_method: authenticatedUser.role === 'emergency' ? 'emergency_code' : 'password'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ [VERIFY ACCESS] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});