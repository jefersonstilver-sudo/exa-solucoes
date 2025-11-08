import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗑️ [DELETE-USER] Edge function iniciada');

    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse da requisição
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'ID do usuário é obrigatório',
          code: 'MISSING_USER_ID' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 [DELETE-USER] Deletando usuário:', userId);

    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Buscar informações do usuário antes de deletar (para logs)
    console.log('📊 [DELETE-USER] Buscando informações do usuário...');
    const { data: userData, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('email, nome, role')
      .eq('id', userId)
      .single();

    if (userFetchError) {
      console.error('❌ [DELETE-USER] Erro ao buscar usuário:', userFetchError);
    } else {
      console.log('✅ [DELETE-USER] Usuário encontrado:', userData?.email);
    }

    // 2. PRIMEIRO deletar do auth.users (ordem invertida para evitar conflitos)
    console.log('🔐 [DELETE-USER] Deletando do auth.users...');
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('❌ [DELETE-USER] Erro ao deletar do auth:', deleteAuthError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao deletar usuário do auth',
          code: 'AUTH_DELETE_ERROR',
          details: deleteAuthError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [DELETE-USER] Deletado do auth com sucesso');

    // 3. DEPOIS deletar da tabela users
    console.log('🗑️ [DELETE-USER] Deletando da tabela users...');
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      console.error('❌ [DELETE-USER] Erro ao deletar da tabela users:', deleteUserError);
      console.warn('⚠️ [DELETE-USER] Usuário deletado do auth mas falhou ao deletar do banco');
      // Não retorna erro aqui pois o importante é ter deletado do auth
      // O usuário pode ser recriado mesmo se ficar órfão no banco
    } else {
      console.log('✅ [DELETE-USER] Deletado da tabela users com sucesso');
    }

    // 4. Registrar em auditoria
    console.log('📝 [DELETE-USER] Registrando em auditoria...');
    const authHeader = req.headers.get('authorization');
    let performedById = null;
    let performedByEmail = 'Sistema';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      
      if (user) {
        performedById = user.id;
        const { data: performerProfile } = await supabaseAdmin
          .from('users')
          .select('email, nome')
          .eq('id', user.id)
          .single();
        
        if (performerProfile) {
          performedByEmail = performerProfile.nome || performerProfile.email || 'Sistema';
        }
      }
    }

    try {
      const { error: auditError } = await supabaseAdmin
        .from('user_activity_logs')
        .insert({
          user_id: performedById,
          action_type: 'ADMIN_ACCOUNT_DELETED',
          entity_type: 'user',
          entity_id: userId,
          action_description: `Conta ${userData?.role || 'usuário'} deletada: ${userData?.email || userId}`,
          metadata: {
            deleted_account: {
              email: userData?.email,
              nome: userData?.nome,
              role: userData?.role,
              user_id: userId
            },
            performed_by: performedByEmail,
            performed_by_id: performedById,
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        });

      if (auditError) {
        console.error('❌ [DELETE-USER] Erro ao registrar auditoria:', auditError);
      } else {
        console.log('✅ [DELETE-USER] Auditoria registrada com sucesso');
      }
    } catch (auditError) {
      console.error('💥 [DELETE-USER] Erro crítico na auditoria:', auditError);
    }

    // Resposta de sucesso
    console.log('🎉 [DELETE-USER] Usuário deletado completamente!');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário deletado completamente',
        deletedUser: {
          id: userId,
          email: userData?.email,
          role: userData?.role
        },
        performedBy: performedByEmail
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [DELETE-USER] Erro crítico não tratado:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
