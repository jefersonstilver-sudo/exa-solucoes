import { supabase } from '@/integrations/supabase/client';
import { videoLogger } from './logger/VideoActionLogger';

export const setBaseVideo = async (slotId: string): Promise<{
  success: boolean;
  timestamp: string;
  pedido_video_id?: string;
  video_id?: string;
  message: string;
}> => {
  videoLogger.logProcessStart('SET_BASE_VIDEO', { slotId });
  
  try {
    console.log('⭐ [VIDEO_BASE] Definindo vídeo base (RPC):', slotId);
    videoLogger.setContext({ slotId });

    // Buscar o client_id do pedido e dados do vídeo
    const { data: pvData, error: pvError } = await supabase
      .from('pedido_videos')
      .select(`
        pedido_id,
        video_id,
        pedidos!inner (
          client_id
        ),
        videos!inner (
          nome
        )
      `)
      .eq('id', slotId)
      .single();

    const clientId = pvData?.pedidos?.client_id;
    const videoNome = pvData?.videos?.nome;
    
    // Remover extensão .mp4 do nome do vídeo
    const tituloSemExtensao = videoNome?.replace(/\.mp4$/i, '').trim();
    
    console.log('🔍 [VIDEO_BASE] Client ID encontrado:', clientId);
    console.log('🔍 [VIDEO_BASE] Nome do vídeo:', videoNome);
    console.log('🔍 [VIDEO_BASE] Título sem extensão:', tituloSemExtensao);

    // Helper fallback direto no banco quando RPCs falharem
    const fallbackDirectUpdate = async () => {
      console.warn('🛟 [VIDEO_BASE] Iniciando fallback direto no banco para set base video');

      // 1) Buscar dados do slot (pedido_id, video_id, status)
      const { data: pv, error: pvErr } = await supabase
        .from('pedido_videos')
        .select(`
          id, 
          pedido_id, 
          video_id, 
          slot_position, 
          approval_status,
          videos (
            id,
            nome,
            url
          )
        `)
        .eq('id', slotId)
        .single();

      if (pvErr || !pv) {
        console.error('❌ [VIDEO_BASE] Fallback: erro ao buscar slot:', pvErr);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Erro ao buscar dados do slot'
        };
      }

      if (pv.approval_status !== 'approved') {
        console.error('❌ [VIDEO_BASE] Fallback: vídeo não aprovado:', pv.approval_status);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Vídeo não está aprovado'
        };
      }

      // 2) PRIMEIRO: Desmarcar TODOS os vídeos do pedido no banco
      const { error: clearErr } = await supabase
        .from('pedido_videos')
        .update({ is_base_video: false, selected_for_display: false, updated_at: new Date().toISOString() })
        .eq('pedido_id', pv.pedido_id);

      if (clearErr) {
        console.error('❌ [VIDEO_BASE] Fallback: erro ao desmarcar vídeos:', clearErr);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Erro ao desmarcar vídeos'
        };
      }

      // 3) Marcar este slot como base, selecionado e ativo
      const { error: upErr } = await supabase
        .from('pedido_videos')
        .update({ is_base_video: true, selected_for_display: true, is_active: true, updated_at: new Date().toISOString() })
        .eq('id', slotId);

      if (upErr) {
        console.error('❌ [VIDEO_BASE] Fallback: erro ao marcar vídeo como base:', upErr);
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Erro ao marcar vídeo como principal'
        };
      }

      // 4) Desativar regras de agendamento para este vídeo (se existirem)
      const { data: scheds, error: schedFetchErr } = await supabase
        .from('campaign_video_schedules')
        .select('id')
        .eq('video_id', pv.video_id);

      if (schedFetchErr) {
        console.warn('⚠️ [VIDEO_BASE] Fallback: erro ao buscar schedules, seguindo sem desativar:', schedFetchErr);
      } else if (scheds && scheds.length > 0) {
        const ids = scheds.map(s => s.id);
        const { error: schedUpdErr } = await supabase
          .from('campaign_schedule_rules')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('campaign_video_schedule_id', ids)
          .eq('is_active', true);
        if (schedUpdErr) {
          console.warn('⚠️ [VIDEO_BASE] Fallback: não foi possível desativar algumas regras:', schedUpdErr);
        }
      }

      console.log('✅ [VIDEO_BASE] Fallback: Banco atualizado com sucesso');
      console.log('✅ [VIDEO_BASE] Fallback direto concluído com sucesso');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Vídeo definido como principal (fallback direto)',
        pedido_video_id: slotId,
        video_id: pv.video_id
      };
    };

    console.log('📞 [VIDEO_BASE] Chamando RPC set_base_video_enhanced:', { slotId });
    videoLogger.log('debug', 'RPC_CALL', 'Calling set_base_video_enhanced', { slotId });
    
    const { data, error } = await supabase.rpc('set_base_video_enhanced', {
      p_pedido_video_id: slotId
    });
    
    console.log('📦 [VIDEO_BASE] Resposta RPC:', { data, error });
    videoLogger.logRPC('set_base_video_enhanced', { slotId }, data, error);

    if (error) {
      console.error('❌ [VIDEO_BASE] RPC erro (enhanced):', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // Fallback: tentar função antiga (compatibilidade) em caso de erro (ex: read-only)
      const isReadOnly = (error as any)?.message && /read[- ]?only/i.test((error as any).message);
      try {
        const { data: legacyData, error: legacyError } = await supabase.rpc('set_base_video', {
          p_pedido_video_id: slotId
        });

        if (legacyError) {
          console.error('❌ [VIDEO_BASE] RPC erro (legacy):', legacyError);
          console.warn('🛟 [VIDEO_BASE] Partindo para fallback direto (DB)');
          return await fallbackDirectUpdate();
        }

        if (legacyData === true) {
          console.log('✅ [VIDEO_BASE] Vídeo definido via fallback legacy (RPC antiga)');
          return {
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Vídeo definido como principal (fallback legacy)',
            pedido_video_id: slotId,
            video_id: null
          };
        }

        console.warn('🛟 [VIDEO_BASE] Legacy retornou falso. Tentando fallback direto.');
        return await fallbackDirectUpdate();
      } catch (fallbackErr) {
        console.error('💥 [VIDEO_BASE] Fallback (legacy) falhou:', fallbackErr);
        console.warn('🛟 [VIDEO_BASE] Tentando fallback direto após falha no legacy.');
        return await fallbackDirectUpdate();
      }
    }

    const result = data as any;
    console.log('🔍 [VIDEO_BASE] Analisando resultado:', { 
      result, 
      success: result?.success,
      type: typeof result,
      isArray: Array.isArray(result)
    });

    if (!result?.success) {
      console.error('❌ [VIDEO_BASE] Falha lógica na RPC:', { 
        result,
        error: result?.error,
        detalhes_completos: JSON.stringify(result)
      });
      // Tentar fallback direto para garantir troca
      console.log('🛟 [VIDEO_BASE] Tentando fallback direto...');
      return await fallbackDirectUpdate();
    }

    console.log('✅ [VIDEO_BASE] Vídeo base definido via RPC:', result);
    
    // Chamar API externa com o client_id (simples, sem body)
    if (clientId) {
      try {
        console.log('📞 [VIDEO_BASE] Chamando API externa (PATCH):', `http://15.228.8.3:8000/ativo/${clientId}`);
        
        const response = await fetch(`http://15.228.8.3:8000/ativo/${clientId}`, {
          method: 'PATCH',
        });
        
        console.log('✅ [VIDEO_BASE] Resposta da API externa:', response.status);
      } catch (apiError) {
        console.error('⚠️ [VIDEO_BASE] Erro ao chamar API externa (não bloqueante):', apiError);
      }
    }
    
    videoLogger.logProcessEnd('SET_BASE_VIDEO', true);
    videoLogger.clearContext();
    return {
      success: true,
      timestamp: new Date().toISOString(),
      pedido_video_id: result.pedido_video_id || slotId,
      video_id: result.video_id || null,
      message: 'Vídeo definido como principal'
    };
  } catch (error) {
    console.error('💥 [VIDEO_BASE] Erro geral:', error);
    videoLogger.logProcessEnd('SET_BASE_VIDEO', false, null, error);
    videoLogger.clearContext();
    return {
      success: false,
      timestamp: new Date().toISOString(),
      message: 'Erro geral: ' + (error?.message || 'erro desconhecido')
    };
  }
};

export const getCurrentDisplayVideo = async (orderId: string) => {
  try {
    console.log('📺 [VIDEO_DISPLAY] Obtendo vídeo atual para exibição:', orderId);
    
    const { data, error } = await supabase.rpc('get_current_display_video', {
      p_pedido_id: orderId
    });

    if (error) {
      console.error('❌ [VIDEO_DISPLAY] Erro ao obter vídeo atual:', error);
      throw error;
    }

    console.log('✅ [VIDEO_DISPLAY] Vídeo atual obtido:', data);
    return data;
  } catch (error) {
    console.error('💥 [VIDEO_DISPLAY] Erro geral:', error);
    return null;
  }
};
