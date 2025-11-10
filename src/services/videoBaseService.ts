import { supabase } from '@/integrations/supabase/client';

/**
 * Sincroniza o status de exibição de um vídeo com a API externa
 */
const syncVideoWithExternalAPI = async (
  buildingIds: string[],
  videoTitle: string,
  isActive: boolean
): Promise<void> => {
  const API_BASE_URL = 'http://15.228.8.3:8000';
  
  console.log(`🔄 [EXTERNAL_API] Sincronizando vídeo "${videoTitle}" (ativo: ${isActive})`);
  
  for (const buildingId of buildingIds) {
    try {
      // Extrair os 4 primeiros dígitos do UUID do prédio
      const clientId = buildingId.slice(0, 4);
      const url = `${API_BASE_URL}/ativo/${clientId}`;
      
      const payload = {
        titulo: videoTitle,
        ativo: isActive
      };
      
      console.log(`📤 [EXTERNAL_API] POST ${url}`, payload);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error(`❌ [EXTERNAL_API] Erro ao sincronizar para prédio ${buildingId}:`, response.status, response.statusText);
      } else {
        console.log(`✅ [EXTERNAL_API] Vídeo sincronizado com sucesso para prédio ${buildingId}`);
      }
    } catch (error) {
      console.error(`💥 [EXTERNAL_API] Erro ao chamar API para prédio ${buildingId}:`, error);
    }
  }
};

export const setBaseVideo = async (slotId: string): Promise<boolean> => {
  try {
    console.log('⭐ [VIDEO_BASE] Definindo vídeo base (RPC):', slotId);

    // Helper fallback direto no banco quando RPCs falharem
    const fallbackDirectUpdate = async (): Promise<boolean> => {
      console.warn('🛟 [VIDEO_BASE] Iniciando fallback direto no banco para set base video');

      // 1) Buscar dados do slot (pedido_id, video_id, status)
      const { data: pv, error: pvErr } = await supabase
        .from('pedido_videos')
        .select('id, pedido_id, video_id, slot_position, approval_status')
        .eq('id', slotId)
        .single();

      if (pvErr || !pv) {
        console.error('❌ [VIDEO_BASE] Fallback: erro ao buscar slot:', pvErr);
        return false;
      }

      if (pv.approval_status !== 'approved') {
        console.error('❌ [VIDEO_BASE] Fallback: vídeo não aprovado:', pv.approval_status);
        return false;
      }

      // 2) Desmarcar outros vídeos base e selecionados do mesmo pedido
      const { error: clearErr } = await supabase
        .from('pedido_videos')
        .update({ is_base_video: false, selected_for_display: false, updated_at: new Date().toISOString() })
        .eq('pedido_id', pv.pedido_id)
        .neq('id', slotId);

      if (clearErr) {
        console.error('❌ [VIDEO_BASE] Fallback: erro ao desmarcar outros vídeos:', clearErr);
        return false;
      }

      // 3) Marcar este slot como base, selecionado e ativo
      const { error: upErr } = await supabase
        .from('pedido_videos')
        .update({ is_base_video: true, selected_for_display: true, is_active: true, updated_at: new Date().toISOString() })
        .eq('id', slotId);

      if (upErr) {
        console.error('❌ [VIDEO_BASE] Fallback: erro ao marcar vídeo como base:', upErr);
        return false;
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

      console.log('✅ [VIDEO_BASE] Fallback direto concluído com sucesso');
      return true;
    };

    console.log('📞 [VIDEO_BASE] Chamando RPC set_base_video_enhanced:', { slotId });
    const { data, error } = await supabase.rpc('set_base_video_enhanced', {
      p_pedido_video_id: slotId
    });
    console.log('📦 [VIDEO_BASE] Resposta RPC:', { data, error });

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
          console.warn('⚠️ [VIDEO_BASE] Usando fallback set_base_video devido a falha na enhanced', { isReadOnly });
          return true;
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
      const ok = await fallbackDirectUpdate();
      console.log('📊 [VIDEO_BASE] Resultado do fallback:', ok);
      if (ok) return true;
      return false;
    }

    console.log('✅ [VIDEO_BASE] Vídeo base definido via RPC:', result);

    // 🔄 NOVA LÓGICA: Sincronizar com API externa
    try {
      console.log('🌐 [VIDEO_BASE] Iniciando sincronização com API externa...');
      
      // 1. Buscar informações do slot selecionado
      const { data: selectedSlot, error: slotError } = await supabase
        .from('pedido_videos')
        .select(`
          pedido_id,
          video_id,
          videos (
            id,
            nome
          )
        `)
        .eq('id', slotId)
        .single();
      
      if (slotError || !selectedSlot) {
        console.error('❌ [VIDEO_BASE] Erro ao buscar slot selecionado:', slotError);
        return true; // Não falhar a operação principal por causa disso
      }
      
      const selectedVideoTitle = (selectedSlot.videos as any)?.nome || 'Video sem titulo';
      console.log('📹 [VIDEO_BASE] Vídeo selecionado:', selectedVideoTitle);
      
      // 2. Buscar lista de prédios do pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('lista_predios')
        .eq('id', selectedSlot.pedido_id)
        .single();
      
      if (pedidoError || !pedido?.lista_predios || pedido.lista_predios.length === 0) {
        console.warn('⚠️ [VIDEO_BASE] Lista de prédios não encontrada:', pedidoError);
        return true; // Não falhar a operação principal
      }
      
      const buildingIds = pedido.lista_predios as string[];
      console.log('🏢 [VIDEO_BASE] Prédios do pedido:', buildingIds);
      
      // 3. Buscar TODOS os vídeos do pedido (para desativar os outros)
      const { data: allVideos, error: allVideosError } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          video_id,
          videos (
            id,
            nome
          )
        `)
        .eq('pedido_id', selectedSlot.pedido_id);
      
      if (allVideosError) {
        console.error('❌ [VIDEO_BASE] Erro ao buscar todos os vídeos:', allVideosError);
        return true; // Não falhar a operação principal
      }
      
      console.log(`📊 [VIDEO_BASE] Total de vídeos no pedido: ${allVideos?.length || 0}`);
      
      // 4. PRIMEIRO: Desativar todos os outros vídeos
      if (allVideos && allVideos.length > 0) {
        for (const video of allVideos) {
          if (video.id !== slotId) { // Não processar o vídeo selecionado ainda
            const videoTitle = (video.videos as any)?.nome || 'Video sem titulo';
            console.log(`🔄 [VIDEO_BASE] Desativando vídeo: ${videoTitle}`);
            await syncVideoWithExternalAPI(buildingIds, videoTitle, false);
          }
        }
      }
      
      // 5. DEPOIS: Ativar o vídeo selecionado
      console.log(`🔄 [VIDEO_BASE] Ativando vídeo selecionado: ${selectedVideoTitle}`);
      await syncVideoWithExternalAPI(buildingIds, selectedVideoTitle, true);
      
      console.log('✅ [VIDEO_BASE] Sincronização com API externa concluída');
    } catch (apiError) {
      console.error('💥 [VIDEO_BASE] Erro na sincronização com API externa:', apiError);
      // Não falhar a operação principal por causa de erro na API externa
    }

    return true;
  } catch (error) {
    console.error('💥 [VIDEO_BASE] Erro geral:', error);
    return false;
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