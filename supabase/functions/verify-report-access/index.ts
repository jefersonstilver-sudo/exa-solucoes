// ============================================
// EDGE FUNCTION: verify-report-access
// Verifica senha do admin e libera acesso ao relatório
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

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

    // 3. Buscar admins ativos que podem acessar
    // Buscar pela tabela profiles que deve ter informações de role
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, email, senha, role')
      .eq('role', 'admin')
      .eq('ativo', true);

    if (adminsError || !admins || admins.length === 0) {
      console.log('❌ Nenhum admin encontrado');
      return new Response(
        JSON.stringify({ error: 'Sistema de autenticação indisponível' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. Verificar senha usando bcrypt
    let authenticatedAdmin = null;
    for (const admin of admins) {
      if (!admin.senha) continue;
      
      try {
        const passwordMatch = await bcrypt.compare(password, admin.senha);
        if (passwordMatch) {
          authenticatedAdmin = admin;
          break;
        }
      } catch (bcryptError) {
        console.error('Erro ao comparar senha:', bcryptError);
        continue;
      }
    }

    if (!authenticatedAdmin) {
      console.log('❌ Senha incorreta');
      return new Response(
        JSON.stringify({ error: 'Senha incorreta' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Admin autenticado:', authenticatedAdmin.email);

    // 5. Registrar acesso
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    await supabase.from('report_access_tokens').insert({
      report_id,
      admin_id: authenticatedAdmin.id,
      access_granted_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // 6. Gerar token de sessão temporário (válido por 1 hora)
    const accessToken = crypto.randomUUID();

    return new Response(
      JSON.stringify({ 
        success: true, 
        access_token: accessToken,
        admin_email: authenticatedAdmin.email,
        report_data: report.report_data
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
