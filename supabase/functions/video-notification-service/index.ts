import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('🔔 [VIDEO-NOTIFICATION] Requisição recebida:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { action, pedido_id, video_title, rejection_reason } = await req.json();
    
    console.log('📦 [VIDEO-NOTIFICATION] Dados recebidos:', { 
      action, 
      pedido_id: pedido_id?.substring(0, 8), 
      video_title 
    });

    if (!action || !pedido_id) {
      return new Response(JSON.stringify({ 
        error: 'action e pedido_id são obrigatórios',
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validar ações permitidas
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

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do pedido
    console.log('🔍 [VIDEO-NOTIFICATION] Buscando dados do pedido...');
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('client_id, lista_paineis, plano_meses, created_at')
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [VIDEO-NOTIFICATION] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    // Buscar dados do cliente
    console.log('👤 [VIDEO-NOTIFICATION] Buscando dados do cliente...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', pedido.client_id)
      .single();

    if (userError || !userData) {
      console.error('❌ [VIDEO-NOTIFICATION] Usuário não encontrado:', userError);
      throw new Error('Usuário não encontrado');
    }

    const userEmail = userData.email;
    const userName = userData.name || userData.email?.split('@')[0] || 'Cliente';
    const videoTitleFinal = video_title || 'Seu Vídeo';

    console.log('✅ [VIDEO-NOTIFICATION] Dados coletados:', {
      userEmail,
      userName,
      videoTitle: videoTitleFinal,
      action
    });

    // Preparar dados para o email service
    let emailData: any = {
      action,
      user: {
        email: userEmail,
        user_metadata: {
          name: userName
        }
      },
      video_data: {
        video_title: videoTitleFinal,
        order_id: pedido_id
      }
    };

    // Adicionar dados específicos por tipo de ação
    if (action === 'video_approved') {
      const buildings = pedido.lista_paineis || [];
      const startDate = new Date().toLocaleDateString('pt-BR');
      const endDate = new Date(Date.now() + (pedido.plano_meses || 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
      
      emailData.video_data.buildings = buildings;
      emailData.video_data.start_date = startDate;
      emailData.video_data.end_date = endDate;
      
      console.log('✅ [VIDEO-NOTIFICATION] Dados de aprovação:', {
        buildings: buildings.length,
        startDate,
        endDate
      });
    } else if (action === 'video_rejected') {
      emailData.video_data.rejection_reason = rejection_reason || 'Não especificado';
      
      console.log('⚠️ [VIDEO-NOTIFICATION] Motivo da rejeição:', rejection_reason);
    }

    // Chamar unified-email-service
    console.log('📧 [VIDEO-NOTIFICATION] Chamando unified-email-service...');
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/unified-email-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(emailData)
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error('❌ [VIDEO-NOTIFICATION] Erro ao enviar email:', emailResult);
      throw new Error(`Erro ao enviar email: ${emailResult.error || 'Desconhecido'}`);
    }

    console.log('✅ [VIDEO-NOTIFICATION] Email enviado com sucesso!', emailResult);

    // Registrar notificação no banco
    const notificationType = action === 'video_submitted' ? 'video_enviado' :
                            action === 'video_approved' ? 'video_aprovado' :
                            'video_rejeitado';
    
    const notificationTitle = action === 'video_submitted' ? '🎬 Vídeo Recebido' :
                             action === 'video_approved' ? '🎉 Vídeo Aprovado' :
                             '⚠️ Vídeo Precisa de Ajustes';
    
    const notificationMessage = action === 'video_submitted' 
      ? `Seu vídeo "${videoTitleFinal}" foi recebido e está em análise.`
      : action === 'video_approved'
      ? `Seu vídeo "${videoTitleFinal}" foi aprovado e está em exibição!`
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
      console.warn('⚠️ [VIDEO-NOTIFICATION] Erro ao criar notificação:', notifError);
    } else {
      console.log('✅ [VIDEO-NOTIFICATION] Notificação criada no banco');
    }

    return new Response(JSON.stringify({ 
      message: 'Email e notificação enviados com sucesso',
      email_result: emailResult,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 [VIDEO-NOTIFICATION] Erro:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao processar notificação de vídeo',
      message: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
