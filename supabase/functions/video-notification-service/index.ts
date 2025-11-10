import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('🔔 [VIDEO-NOTIFICATION] === INÍCIO ===');
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Não autorizado',
        success: false 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return new Response(JSON.stringify({ 
        error: 'Não autorizado',
        success: false 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { action, pedido_id, video_id, video_title, rejection_reason } = await req.json();
    
    console.log('📦 Payload:', { action, pedido_id: pedido_id?.substring(0, 8), video_id: video_id?.substring(0, 8) });

    if (!action || !pedido_id) {
      return new Response(JSON.stringify({ 
        error: 'action e pedido_id são obrigatórios',
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const validActions = ['video_submitted', 'video_approved', 'video_rejected'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ 
        error: `Ação inválida. Use: ${validActions.join(', ')}`,
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check user role
    console.log('🔍 Verificando permissões...');
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userRole && ['admin', 'super_admin'].includes(userRole.role);

    // Buscar pedido COM RETRY
    console.log('🔍 Buscando pedido...');
    let pedido: any = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (!pedido && retryCount < maxRetries) {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, client_id, lista_predios, data_inicio, data_fim, status, plano_meses')
        .eq('id', pedido_id)
        .single();

      if (error) {
        console.error(`❌ Erro buscar pedido (tentativa ${retryCount + 1}):`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } else {
        pedido = data;
      }
    }

    if (!pedido) {
      throw new Error('Pedido não encontrado após múltiplas tentativas');
    }

    // Validate ownership
    if (!isAdmin && pedido.client_id !== user.id) {
      return new Response(JSON.stringify({ 
        error: 'Acesso negado',
        success: false 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Buscar usuário COM RETRY
    console.log('👤 Buscando cliente...');
    let userData: any = null;
    retryCount = 0;

    while (!userData && retryCount < maxRetries) {
      const { data, error } = await supabase
        .from('users')
        .select('email, nome')
        .eq('id', pedido.client_id)
        .single();

      if (error) {
        console.error(`❌ Erro buscar usuário (tentativa ${retryCount + 1}):`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } else {
        userData = data;
      }
    }

    if (!userData) {
      throw new Error('Usuário não encontrado após múltiplas tentativas');
    }

    const userEmail = userData.email;
    const userName = userData.nome || userData.email?.split('@')[0] || 'Cliente';
    const videoTitleFinal = video_title || 'Seu Vídeo';

    console.log('✅ Dados coletados:', { userEmail, userName, action });

    // Buscar nomes dos prédios
    console.log('🏢 Buscando prédios...');
    const buildingIds = pedido.lista_predios || [];
    let buildingNames: string[] = [];
    
    if (buildingIds.length > 0) {
      const { data: buildings } = await supabase
        .from('buildings')
        .select('nome')
        .in('id', buildingIds);

      buildingNames = buildings?.map((b: any) => b.nome) || [];
      console.log('✅ Prédios encontrados:', buildingNames.length);
    }

    // Preparar payload para unified-email-service NO FORMATO CORRETO
    const emailPayload = {
      action,
      user: {
        email: userEmail,
        user_metadata: {
          name: userName
        }
      },
      video_data: {
        video_title: videoTitleFinal,
        order_id: pedido_id,
        buildings: buildingNames,
        start_date: pedido.data_inicio || new Date().toISOString().split('T')[0],
        end_date: pedido.data_fim || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ...(rejection_reason && { rejection_reason: rejection_reason || 'Não especificado' })
      }
    };

    console.log('📧 Payload preparado:', {
      action,
      user_email: userEmail,
      video_title: videoTitleFinal,
      buildings_count: buildingNames.length
    });
    console.log('📧 Chamando unified-email-service...');

    // Chamar unified-email-service COM RETRY
    retryCount = 0;
    let emailResult: any = null;

    while (!emailResult && retryCount < maxRetries) {
      try {
        const response = await supabase.functions.invoke('unified-email-service', {
          body: emailPayload,
        });

        if (response.error) {
          console.error(`❌ Erro email (tentativa ${retryCount + 1}):`, response.error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          }
        } else {
          emailResult = response.data;
          console.log('✅ Email enviado!');
        }
      } catch (error) {
        console.error(`❌ Exceção (tentativa ${retryCount + 1}):`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
      }
    }

    // Criar notificação in-app
    const notificationType = action === 'video_submitted' ? 'video_enviado' :
                            action === 'video_approved' ? 'video_aprovado' :
                            'video_rejeitado';
    
    const notificationTitle = action === 'video_submitted' ? '🎬 Vídeo Recebido' :
                             action === 'video_approved' ? '🎉 Vídeo Aprovado' :
                             '⚠️ Vídeo Precisa de Ajustes';
    
    const notificationMessage = action === 'video_submitted' 
      ? `Seu vídeo "${videoTitleFinal}" foi recebido e está em análise.`
      : action === 'video_approved'
      ? `Seu vídeo "${videoTitleFinal}" foi aprovado e entrará em exibição em até 20 minutos!`
      : `Seu vídeo "${videoTitleFinal}" precisa de ajustes: ${rejection_reason || 'Verifique o email para detalhes.'}`;

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: pedido.client_id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        metadata: {
          pedido_id,
          video_title: videoTitleFinal,
          rejection_reason: action === 'video_rejected' ? rejection_reason : null
        }
      });

    if (notifError) {
      console.warn('⚠️ Erro criar notificação:', notifError);
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ Tempo: ${duration}ms`);
    console.log('🔔 === FIM ===');

    return new Response(JSON.stringify({ 
      message: 'Notificação processada',
      email_sent: !!emailResult,
      notification_created: !notifError,
      duration_ms: duration,
      retries: retryCount,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 ERRO FATAL:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao processar notificação',
      message: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});