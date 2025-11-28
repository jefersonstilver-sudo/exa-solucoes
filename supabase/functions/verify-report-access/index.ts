// ============================================
// EDGE FUNCTION: verify-report-access
// Verifica autenticação do usuário ou código de acesso
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
    const authHeader = req.headers.get('authorization');

    console.log('🔐 [VERIFY ACCESS] Verificando acesso ao relatório:', report_id);
    console.log('🔐 [VERIFY ACCESS] Auth header present:', !!authHeader);

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

    // 3. NOVA LÓGICA: Verificar autenticação via Supabase Auth
    let authenticatedUser = null;
    
    if (authHeader) {
      try {
        // Criar cliente com token do usuário
        const userSupabase = createClient(
          supabaseUrl,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          {
            global: {
              headers: { authorization: authHeader }
            }
          }
        );

        const { data: { user }, error: authError } = await userSupabase.auth.getUser();
        
        if (!authError && user) {
          console.log('✅ Usuário autenticado:', user.email);
          
          // Verificar se é admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (profile && ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro'].includes(profile.role)) {
            console.log('✅ Usuário é admin, acesso liberado automaticamente');
            authenticatedUser = {
              id: user.id,
              email: user.email,
              role: profile.role
            };
          }
        }
      } catch (authCheckError) {
        console.log('⚠️ Erro ao verificar autenticação:', authCheckError);
      }
    }

    // 4. Se não está autenticado como admin, verificar senha
    if (!authenticatedUser) {
      console.log('🔐 Usuário não autenticado como admin, verificando senha...');
      
      // Buscar diretores ativos
      const { data: directors, error: directorsError } = await supabase
        .from('exa_alerts_directors')
        .select('id, nome, email, telefone, nivel_acesso, senha')
        .eq('ativo', true)
        .eq('nivel_acesso', 'admin');

      if (directorsError || !directors || directors.length === 0) {
        console.log('❌ Nenhum diretor admin encontrado');
        return new Response(
          JSON.stringify({ error: 'Sistema de autenticação indisponível' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verificar senha contra qualquer diretor admin
      let matchedDirector = null;
      for (const director of directors) {
        if (director.senha === password) {
          matchedDirector = director;
          break;
        }
      }

      // Se não encontrou com senha de diretor, tentar código padrão EXA2024
      if (!matchedDirector && password === 'EXA2024') {
        matchedDirector = directors[0]; // Usar primeiro diretor como fallback
        console.log('✅ Código de acesso padrão aceito (EXA2024)');
      }
      
      if (!matchedDirector) {
        console.log('❌ Senha incorreta');
        return new Response(
          JSON.stringify({ error: 'Senha incorreta' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      authenticatedUser = {
        id: matchedDirector.id,
        email: matchedDirector.email || matchedDirector.nome,
        role: 'director'
      };
      
      console.log('✅ Diretor autenticado:', authenticatedUser.email);
    }

    // 5. Registrar acesso
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

    // 6. Gerar token de sessão temporário (válido por 1 hora)
    const accessToken = crypto.randomUUID();

    console.log('✅ Acesso concedido para:', authenticatedUser.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        access_token: accessToken,
        admin_email: authenticatedUser.email,
        report_data: report.report_data,
        auth_method: authenticatedUser.role === 'director' ? 'password' : 'supabase_auth'
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
