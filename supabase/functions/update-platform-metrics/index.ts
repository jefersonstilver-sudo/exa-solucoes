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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting platform metrics update...');

    // Buscar todos os usuários com role 'client'
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'client');

    if (usersError) throw usersError;

    console.log(`📊 Processing ${users.length} clients...`);

    for (const user of users) {
      try {
        // Calcular frequência de login (últimos 7 dias)
        const { data: recentLogins } = await supabase
          .from('client_activity_events')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('event_type', 'login')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const loginFrequency = recentLogins ? recentLogins.length / 7 : 0;

        // Contar vídeos pendentes de aprovação
        const { count: pendingVideos } = await supabase
          .from('pedido_videos')
          .select('id', { count: 'exact' })
          .eq('approval_status', 'pending')
          .in('pedido_id', 
            supabase.from('pedidos').select('id').eq('client_id', user.id)
          );

        // Contar vídeos aprovados
        const { count: approvedVideos } = await supabase
          .from('pedido_videos')
          .select('id', { count: 'exact' })
          .eq('approval_status', 'approved')
          .in('pedido_id',
            supabase.from('pedidos').select('id').eq('client_id', user.id)
          );

        // Contar pedidos ativos
        const { data: activeOrders } = await supabase
          .from('pedidos')
          .select('id, data_fim')
          .eq('client_id', user.id)
          .in('status', ['ativo', 'pago', 'pago_pendente_video', 'video_aprovado'])
          .gte('data_fim', new Date().toISOString().split('T')[0]);

        // Calcular data de renovação mais próxima
        let nearestRenewalDate = null;
        let daysUntilRenewal = null;

        if (activeOrders && activeOrders.length > 0) {
          const renewalDates = activeOrders
            .map(o => new Date(o.data_fim))
            .filter(d => d > new Date())
            .sort((a, b) => a.getTime() - b.getTime());

          if (renewalDates.length > 0) {
            nearestRenewalDate = renewalDates[0].toISOString().split('T')[0];
            daysUntilRenewal = Math.floor(
              (renewalDates[0].getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
          }
        }

        // Calcular engagement score (0-100)
        const engagementScore = Math.min(
          100,
          Math.floor(
            (loginFrequency * 10) + // Até 70 pontos por logins
            ((approvedVideos || 0) * 5) + // Até 5 pontos por vídeo aprovado (máx 20 vídeos = 100)
            ((activeOrders?.length || 0) * 5) // Até 5 pontos por pedido ativo
          )
        );

        // Atualizar client_platform_activity
        await supabase.from('client_platform_activity').upsert({
          user_id: user.id,
          login_frequency: loginFrequency,
          videos_pending_approval: pendingVideos || 0,
          videos_approved: approvedVideos || 0,
          active_orders_count: activeOrders?.length || 0,
          nearest_renewal_date: nearestRenewalDate,
          days_until_renewal: daysUntilRenewal,
          platform_engagement_score: engagementScore,
          updated_at: new Date().toISOString(),
        });

        // Calcular lifecycle stage usando a função do banco
        const { data: lifecycleStage } = await supabase.rpc(
          'calculate_lifecycle_stage',
          { p_user_id: user.id }
        );

        // Atualizar client_behavior_analytics
        await supabase
          .from('client_behavior_analytics')
          .update({
            lifecycle_stage: lifecycleStage,
            has_active_plan: (activeOrders?.length || 0) > 0,
            plan_end_date: nearestRenewalDate,
            days_until_renewal: daysUntilRenewal,
            platform_usage_score: engagementScore,
          })
          .eq('user_id', user.id);

        console.log(`✅ Updated metrics for user ${user.id} - Score: ${engagementScore}, Stage: ${lifecycleStage}`);
      } catch (userError) {
        console.error(`❌ Error processing user ${user.id}:`, userError);
        // Continue processando outros usuários
        continue;
      }
    }

    console.log('✅ Platform metrics update completed');

    return new Response(
      JSON.stringify({
        success: true,
        processed_users: users.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('💥 Error in update-platform-metrics:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
