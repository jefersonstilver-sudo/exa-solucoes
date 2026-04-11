import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 3 deletions per hour per IP (very restrictive for account deletion)
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 3,
    windowMs: 3600000, // 1 hour
    blockDurationMs: 7200000 // 2 hours block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [DELETE-USER] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
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

    // 2. REGISTRAR AUDITORIA ANTES DE DELETAR (para manter integridade)
    console.log('📝 [DELETE-USER] Registrando auditoria ANTES da deleção...');
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

    // Registrar log ANTES de deletar
    try {
      if (performedById) {
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
      }
    } catch (auditError) {
      console.error('💥 [DELETE-USER] Erro crítico na auditoria:', auditError);
    }

    // 3. TRATAR PEDIDOS E PROPOSALS (foreign key constraint)
    console.log('📦 [DELETE-USER] Tratando pedidos e proposals...');
    
    // 3a. Buscar pedidos do usuário
    const { data: userPedidos } = await supabaseAdmin
      .from('pedidos')
      .select('id')
      .eq('client_id', userId);
    
    if (userPedidos && userPedidos.length > 0) {
      const pedidoIds = userPedidos.map(p => p.id);
      console.log(`📦 [DELETE-USER] Encontrados ${pedidoIds.length} pedidos para tratar`);
      
      // 3b. Limpar referências em proposals (set converted_order_id = null)
      const { error: proposalsUpdateError } = await supabaseAdmin
        .from('proposals')
        .update({ converted_order_id: null })
        .in('converted_order_id', pedidoIds);
      
      if (proposalsUpdateError) {
        console.warn('⚠️ [DELETE-USER] Erro ao limpar proposals:', proposalsUpdateError.message);
      } else {
        console.log('✅ [DELETE-USER] Referências de proposals limpas');
      }
      
      // 3c. Deletar contratos relacionados aos pedidos
      const { error: contratosError } = await supabaseAdmin
        .from('contratos')
        .delete()
        .in('pedido_id', pedidoIds);
      
      if (contratosError) {
        console.warn('⚠️ [DELETE-USER] Erro ao deletar contratos:', contratosError.message);
      } else {
        console.log('✅ [DELETE-USER] Contratos deletados');
      }
      
      // 3d. Deletar parcelas relacionadas aos pedidos
      const { error: parcelasError } = await supabaseAdmin
        .from('parcelas')
        .delete()
        .in('pedido_id', pedidoIds);
      
      if (parcelasError) {
        console.warn('⚠️ [DELETE-USER] Erro ao deletar parcelas:', parcelasError.message);
      } else {
        console.log('✅ [DELETE-USER] Parcelas deletadas');
      }
      
      // 3e. Deletar os pedidos
      const { error: pedidosError } = await supabaseAdmin
        .from('pedidos')
        .delete()
        .eq('client_id', userId);
      
      if (pedidosError) {
        console.warn('⚠️ [DELETE-USER] Erro ao deletar pedidos:', pedidosError.message);
      } else {
        console.log('✅ [DELETE-USER] Pedidos deletados');
      }
    }
    
    // 3f. Deletar proposals criadas pelo usuário
    const { error: userProposalsError } = await supabaseAdmin
      .from('proposals')
      .delete()
      .eq('created_by', userId);
    
    if (userProposalsError) {
      console.warn('⚠️ [DELETE-USER] Erro ao deletar proposals do usuário:', userProposalsError.message);
    } else {
      console.log('✅ [DELETE-USER] Proposals do usuário deletadas');
    }

    // 4. DELETAR DADOS RELACIONADOS (exceto user_activity_logs que não deletamos)
    console.log('🧹 [DELETE-USER] Deletando dados relacionados...');
    
    const relatedTables = [
      'user_custom_permissions',
      'user_roles',
      'user_sessions',
      'permission_change_logs',
      'role_change_audit',
      // 'user_activity_logs', // NÃO deletar - mantemos histórico
      'building_action_logs',
      'client_activity_events',
      'client_behavior_analytics',
      'client_platform_activity',
      'coupon_security_events',
      'cupom_aplicacoes',
      'cupom_usos',
      'financial_audit_logs',
      'financial_data_audit_logs',
      'lead_data_access_logs',
      'notifications',
      'panel_access_logs',
      'system_activity_feed',
      'transaction_sessions',
      'campanhas',
      'videos',
      'contratos_legais',
      'cobranca_logs',
      'client_crm_notes',
      'auth_detailed_logs',
      'active_sessions_monitor'
    ];

    let deletedCount = 0;
    for (const table of relatedTables) {
      try {
        const { error: deleteError } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          // Tentar com client_id se user_id falhar
          const { error: clientIdError } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('client_id', userId);
          
          if (clientIdError) {
            console.warn(`⚠️ [DELETE-USER] Erro ao deletar de ${table}:`, deleteError.message);
          } else {
            deletedCount++;
            console.log(`✅ [DELETE-USER] Deletado de ${table} (via client_id)`);
          }
        } else {
          deletedCount++;
          console.log(`✅ [DELETE-USER] Deletado de ${table}`);
        }
      } catch (err) {
        console.warn(`⚠️ [DELETE-USER] Erro ao processar ${table}:`, err);
      }
    }

    console.log(`✅ [DELETE-USER] Deletados dados de ${deletedCount}/${relatedTables.length} tabelas`);

    // 5. Deletar da tabela users primeiro
    console.log('🗑️ [DELETE-USER] Deletando da tabela users...');
    await supabaseAdmin.from('users').delete().eq('id', userId);
    console.log('✅ [DELETE-USER] Tabela users limpa');

    // 5. Deletar do auth.users
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
