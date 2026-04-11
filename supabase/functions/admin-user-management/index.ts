import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 10 user management operations per 5 minutes per IP
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 10,
    windowMs: 300000, // 5 minutes
    blockDurationMs: 900000 // 15 minutes block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [ADMIN-USER-MGMT] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
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

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is super_admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'super_admin') {
      console.error('Permission denied - user role:', userData?.role);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId, data } = await req.json();

    console.log('Admin action:', action, 'for user:', userId);

    let result;

    switch (action) {
      case 'block_user': {
        const banUntil = new Date();
        banUntil.setFullYear(banUntil.getFullYear() + 1); // Ban for 1 year
        
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none',
          user_metadata: { banned_until: banUntil.toISOString() }
        });

        if (error) throw error;

        // Log the action
        await supabaseClient
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'USER_BLOCKED',
            descricao: `Admin ${user.id} blocked user ${userId} until ${banUntil.toISOString()}`
          });

        result = { success: true, message: 'User blocked successfully' };
        break;
      }

      case 'unblock_user': {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { banned_until: null }
        });

        if (error) throw error;

        // Log the action
        await supabaseClient
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'USER_UNBLOCKED',
            descricao: `Admin ${user.id} unblocked user ${userId}`
          });

        result = { success: true, message: 'User unblocked successfully' };
        break;
      }

      case 'delete_user': {
        console.log('🗑️ [DELETE-USER] Iniciando deleção do usuário:', userId);
        
        // 1. Buscar informações do usuário antes de deletar
        const { data: authUser, error: fetchAuthError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (fetchAuthError) {
          console.error('❌ [DELETE-USER] Erro ao buscar usuário:', fetchAuthError);
          throw new Error('Usuário não encontrado no auth');
        }

        const userEmail = authUser?.user?.email || 'unknown';
        console.log('📧 [DELETE-USER] Email do usuário:', userEmail);

        // 2. PRIMEIRO: Deletar registros de auditoria (role_change_audit)
        console.log('📋 [DELETE-USER] Deletando registros de role_change_audit...');
        
        // Deletar onde o usuário foi modificado (user_id)
        const { error: deleteAuditUserError } = await supabaseAdmin
          .from('role_change_audit')
          .delete()
          .eq('user_id', userId);

        if (deleteAuditUserError) {
          console.warn('⚠️ [DELETE-USER] Aviso ao deletar auditoria (user_id):', deleteAuditUserError);
        }

        // Deletar onde o usuário foi o modificador (changed_by)
        const { error: deleteAuditChangedByError } = await supabaseAdmin
          .from('role_change_audit')
          .delete()
          .eq('changed_by', userId);

        if (deleteAuditChangedByError) {
          console.warn('⚠️ [DELETE-USER] Aviso ao deletar auditoria (changed_by):', deleteAuditChangedByError);
        }

        console.log('✅ [DELETE-USER] Registros de auditoria deletados');

        // 3. SEGUNDO: Deletar da tabela users (remove constraints)
        console.log('🗄️ [DELETE-USER] Deletando da tabela users...');
        const { error: deleteUsersError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', userId);

        if (deleteUsersError) {
          console.error('❌ [DELETE-USER] Erro ao deletar da tabela users:', deleteUsersError);
          throw new Error(`Erro ao deletar da tabela users: ${deleteUsersError.message}`);
        }
        console.log('✅ [DELETE-USER] Deletado da tabela users');

        // 4. TERCEIRO: Deletar do auth.users (libera o email)
        console.log('🔐 [DELETE-USER] Deletando do auth.users...');
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteAuthError) {
          console.error('❌ [DELETE-USER] Erro ao deletar do auth:', deleteAuthError);
          throw new Error(`Erro ao deletar usuário do auth: ${deleteAuthError.message}`);
        }
        console.log('✅ [DELETE-USER] Deletado do auth com sucesso');

        // 4. Log da ação
        console.log('📝 [DELETE-USER] Registrando em log_eventos_sistema...');
        await supabaseClient
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'USER_DELETED',
            descricao: `Admin ${user.id} deletou usuário ${userId} (${userEmail})`
          });

        console.log('🎉 [DELETE-USER] Usuário deletado completamente!');
        result = { 
          success: true, 
          message: 'Usuário deletado com sucesso',
          email: userEmail 
        };
        break;
      }

      case 'update_metadata': {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: data.user_metadata
        });

        if (error) throw error;

        // Log the action
        await supabaseClient
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'USER_METADATA_UPDATED',
            descricao: `Admin ${user.id} updated metadata for user ${userId}`
          });

        result = { success: true, message: 'User metadata updated successfully' };
        break;
      }

      case 'reset_password': {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: data.password
        });

        if (error) throw error;

        // Log the action
        await supabaseClient
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'USER_PASSWORD_RESET',
            descricao: `Admin ${user.id} reset password for user ${userId}`
          });

        result = { success: true, message: 'Password reset successfully' };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-user-management:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
