import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('🧹 [CLEANUP-ORPHANED] Requisição recebida:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { email } = await req.json();
    
    // Validação de input
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Email é obrigatório e deve ser uma string',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    // Validação de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return new Response(JSON.stringify({ 
        error: 'Formato de email inválido',
        success: false
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('🔍 [CLEANUP-ORPHANED] Procurando email órfão:', sanitizedEmail);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se existe na tabela users
    const { data: userData, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (userCheckError) {
      console.error('❌ [CLEANUP-ORPHANED] Erro ao verificar tabela users:', userCheckError);
      throw userCheckError;
    }

    if (userData) {
      console.log('⚠️ [CLEANUP-ORPHANED] Email existe na tabela users, não é órfão');
      return new Response(JSON.stringify({ 
        error: 'Este email ainda existe na tabela users. Use a função de deleção normal.',
        success: false,
        exists_in_users: true
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Buscar usuário em auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ [CLEANUP-ORPHANED] Erro ao listar usuários:', listError);
      throw listError;
    }

    const authUser = users?.find(u => u.email?.toLowerCase() === sanitizedEmail);

    if (!authUser) {
      console.log('✅ [CLEANUP-ORPHANED] Email não encontrado em auth.users');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Email não encontrado no sistema de autenticação',
        was_orphaned: false
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('🗑️ [CLEANUP-ORPHANED] Deletando usuário órfão do auth.users:', authUser.id);

    // Deletar usuário órfão do auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);

    if (deleteError) {
      console.error('❌ [CLEANUP-ORPHANED] Erro ao deletar usuário:', deleteError);
      throw deleteError;
    }

    console.log('✅ [CLEANUP-ORPHANED] Usuário órfão removido com sucesso');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email órfão removido do sistema de autenticação com sucesso',
      was_orphaned: true,
      deleted_user_id: authUser.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 [CLEANUP-ORPHANED] Erro:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao limpar email órfão',
      message: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
