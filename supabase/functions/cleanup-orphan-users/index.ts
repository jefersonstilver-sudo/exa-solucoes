import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 [CLEANUP] Iniciando limpeza de usuários órfãos...');

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

    // 1. Listar TODOS os usuários do auth.users
    console.log('📋 [CLEANUP] Listando usuários do auth.users...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ [CLEANUP] Erro ao listar auth.users:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao listar usuários do auth',
          details: authError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const authUsers = authData.users;
    console.log(`✅ [CLEANUP] Encontrados ${authUsers.length} usuários no auth`);

    // 2. Buscar todos os usuários da tabela users
    console.log('📋 [CLEANUP] Listando usuários da tabela users...');
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email');

    if (dbError) {
      console.error('❌ [CLEANUP] Erro ao listar tabela users:', dbError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao listar usuários do banco',
          details: dbError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const dbUserIds = new Set(dbUsers.map(u => u.id));
    console.log(`✅ [CLEANUP] Encontrados ${dbUsers.length} usuários no banco`);

    // 3. Encontrar usuários órfãos (existem no auth mas não no banco)
    const orphanUsers = authUsers.filter(authUser => !dbUserIds.has(authUser.id));
    
    console.log(`🔍 [CLEANUP] Encontrados ${orphanUsers.length} usuários órfãos`);

    if (orphanUsers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum usuário órfão encontrado',
          totalAuth: authUsers.length,
          totalDb: dbUsers.length,
          orphansDeleted: 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Deletar usuários órfãos
    const deletedOrphans = [];
    const failedDeletes = [];

    for (const orphan of orphanUsers) {
      try {
        console.log(`🗑️ [CLEANUP] Deletando órfão: ${orphan.email} (${orphan.id})`);
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphan.id);
        
        if (deleteError) {
          console.error(`❌ [CLEANUP] Erro ao deletar ${orphan.email}:`, deleteError);
          failedDeletes.push({
            email: orphan.email,
            id: orphan.id,
            error: deleteError.message
          });
        } else {
          console.log(`✅ [CLEANUP] Órfão deletado: ${orphan.email}`);
          deletedOrphans.push({
            email: orphan.email,
            id: orphan.id
          });
        }
      } catch (error) {
        console.error(`💥 [CLEANUP] Erro crítico ao deletar ${orphan.email}:`, error);
        failedDeletes.push({
          email: orphan.email,
          id: orphan.id,
          error: error.message
        });
      }
    }

    // 5. Registrar em auditoria
    console.log('📝 [CLEANUP] Registrando em auditoria...');
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
          action_type: 'ORPHAN_USERS_CLEANUP',
          entity_type: 'system',
          entity_id: null,
          action_description: `Limpeza de ${deletedOrphans.length} usuários órfãos do auth`,
          metadata: {
            total_orphans_found: orphanUsers.length,
            deleted_successfully: deletedOrphans.length,
            failed_deletes: failedDeletes.length,
            deleted_orphans: deletedOrphans,
            failed_orphans: failedDeletes,
            performed_by: performedByEmail,
            performed_by_id: performedById,
            timestamp: new Date().toISOString()
          }
        });

      if (auditError) {
        console.error('❌ [CLEANUP] Erro ao registrar auditoria:', auditError);
      } else {
        console.log('✅ [CLEANUP] Auditoria registrada com sucesso');
      }
    } catch (auditError) {
      console.error('💥 [CLEANUP] Erro crítico na auditoria:', auditError);
    }

    // Resposta final
    console.log('🎉 [CLEANUP] Limpeza concluída!');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Limpeza de usuários órfãos concluída',
        totalAuth: authUsers.length,
        totalDb: dbUsers.length,
        orphansFound: orphanUsers.length,
        orphansDeleted: deletedOrphans.length,
        failedDeletes: failedDeletes.length,
        deletedUsers: deletedOrphans,
        failedUsers: failedDeletes,
        performedBy: performedByEmail
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [CLEANUP] Erro crítico não tratado:', error);
    
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
