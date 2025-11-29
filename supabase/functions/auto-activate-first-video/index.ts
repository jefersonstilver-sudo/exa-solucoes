import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { pedido_video_id } = await req.json();
    
    console.log('🎯 [AUTO-ACTIVATE] Iniciando ativação automática para pedido_video_id:', pedido_video_id);

    // 1. Buscar informações do vídeo e pedido
    const { data: videoData, error: videoError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        pedido_id,
        video_id,
        slot_position,
        approval_status,
        is_base_video,
        is_active,
        selected_for_display,
        videos (
          nome
        ),
        pedidos (
          lista_predios
        )
      `)
      .eq('id', pedido_video_id)
      .single();

    if (videoError || !videoData) {
      console.error('❌ [AUTO-ACTIVATE] Erro ao buscar vídeo:', videoError);
      throw new Error(`Vídeo não encontrado: ${videoError?.message}`);
    }

    console.log('📋 [AUTO-ACTIVATE] Dados do vídeo:', {
      id: videoData.id,
      pedido_id: videoData.pedido_id,
      slot_position: videoData.slot_position,
      is_base_video: videoData.is_base_video,
      is_active: videoData.is_active,
      selected_for_display: videoData.selected_for_display,
      video_name: videoData.videos?.nome,
      predios: videoData.pedidos?.lista_predios
    });

    // 2. Verificar se é o primeiro vídeo aprovado
    const { data: approvedVideos, error: countError } = await supabase
      .from('pedido_videos')
      .select('id')
      .eq('pedido_id', videoData.pedido_id)
      .eq('approval_status', 'approved');

    if (countError) {
      console.error('❌ [AUTO-ACTIVATE] Erro ao contar vídeos aprovados:', countError);
      throw new Error(`Erro ao verificar vídeos: ${countError.message}`);
    }

    console.log(`📊 [AUTO-ACTIVATE] Total de vídeos aprovados no pedido: ${approvedVideos?.length || 0}`);

    if (!approvedVideos || approvedVideos.length !== 1) {
      console.log('⚠️ [AUTO-ACTIVATE] Não é o primeiro vídeo aprovado. Pulando ativação automática.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Não é o primeiro vídeo - ativação não necessária',
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verificar se o vídeo já foi marcado corretamente pelo trigger
    if (!videoData.is_base_video || !videoData.is_active || !videoData.selected_for_display) {
      console.error('❌ [AUTO-ACTIVATE] Vídeo não foi marcado corretamente pelo trigger!', {
        is_base_video: videoData.is_base_video,
        is_active: videoData.is_active,
        selected_for_display: videoData.selected_for_display
      });
      throw new Error('Vídeo não foi configurado corretamente pelo sistema');
    }

    console.log('✅ [AUTO-ACTIVATE] Vídeo está corretamente marcado como base/ativo/exibição');

    // 4. Obter lista de prédios
    const predios = videoData.pedidos?.lista_predios || [];
    
    if (predios.length === 0) {
      console.warn('⚠️ [AUTO-ACTIVATE] Nenhum prédio associado ao pedido');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum prédio para ativar',
          warning: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🏢 [AUTO-ACTIVATE] Ativando vídeo em ${predios.length} prédios:`, predios);

    // 5. Chamar sync-video-status-to-aws para sincronizar com a API externa
    console.log(`📤 [AUTO-ACTIVATE] Chamando sync-video-status-to-aws`);
    
    try {
      const { data: syncData, error: syncError } = await supabase.functions.invoke(
        'sync-video-status-to-aws',
        {
          body: {
            pedidoId: videoData.pedido_id,
            activeVideoId: videoData.video_id,
            previousVideoId: null // Primeiro vídeo, sem anterior
          }
        }
      );

      if (syncError) {
        console.error(`❌ [AUTO-ACTIVATE] Erro ao sincronizar com AWS:`, syncError);
        throw new Error(`Falha na sincronização: ${syncError.message}`);
      }

      console.log(`✅ [AUTO-ACTIVATE] Vídeo sincronizado com sucesso na AWS:`, syncData);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Primeiro vídeo ativado e sincronizado com AWS`,
          sync_result: syncData,
          video_info: {
            id: videoData.id,
            title: videoData.videos?.nome,
            slot: videoData.slot_position,
            predios_count: predios.length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (err: any) {
      console.error(`❌ [AUTO-ACTIVATE] Exceção ao sincronizar:`, err);
      return new Response(
        JSON.stringify({
          success: false,
          error: err.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }


  } catch (error: any) {
    console.error('💥 [AUTO-ACTIVATE] Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
