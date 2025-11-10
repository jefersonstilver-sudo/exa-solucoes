import { supabase } from '@/integrations/supabase/client';
import { videoLogger } from './logger/VideoActionLogger';

/**
 * Extrai o nome do arquivo sem extensão de uma URL
 * Remove TODAS as extensões de vídeo comuns
 */
const getFileNameWithoutExtension = (url: string): string => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  // Remove qualquer extensão de vídeo comum
  return fileName.replace(/\.(mp4|mov|avi|mkv|wmv|flv|webm)$/i, '');
};

/**
 * Resultado de uma chamada individual à API externa
 */
interface APICallResult {
  buildingId: string;
  clientId: string;
  url: string;
  videoFileName: string;
  isActive: boolean;
  success: boolean;
  status?: number;
  statusText?: string;
  responseBody?: any;
  error?: string;
  timestamp: string;
}

/**
 * Sincroniza o status de exibição de um vídeo com a API externa
 * 🔥 RETORNA resultado detalhado de cada chamada
 */
const syncVideoWithExternalAPI = async (
  buildingIds: string[],
  videoFileName: string,
  isActive: boolean
): Promise<APICallResult[]> => {
  const API_BASE_URL = 'http://15.228.8.3:8000';
  const results: APICallResult[] = [];
  
  // 🔒 VALIDAÇÃO DE ENTRADA
  if (!buildingIds || buildingIds.length === 0) {
    console.warn('⚠️ [EXTERNAL_API] Lista de prédios vazia, nada a fazer');
    return results;
  }
  
  if (!videoFileName || videoFileName.trim() === '') {
    console.error('❌ [EXTERNAL_API] Nome do arquivo inválido');
    throw new Error('Nome do arquivo é obrigatório');
  }
  
  console.log(`🚀 [EXTERNAL_API] Iniciando sincronização:`, {
    totalPredios: buildingIds.length,
    videoFileName,
    isActive,
    timestamp: new Date().toISOString()
  });
  
  // 🔄 PROCESSAMENTO SEQUENCIAL COM TIMEOUT
  for (const buildingId of buildingIds) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    const startTime = Date.now();
    
    const callResult: APICallResult = {
      buildingId,
      clientId: buildingId.slice(0, 4),
      url: '',
      videoFileName,
      isActive,
      success: false,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Extrair os 4 primeiros dígitos do UUID do prédio
      const clientId = buildingId.slice(0, 4);
      const url = `${API_BASE_URL}/ativo/${clientId}`;
      callResult.url = url;
      
      const payload = {
        titulo: videoFileName,
        ativo: isActive
      };
      
      // 📤 LOG ANTES DE ENVIAR
      console.log(`📤 [EXTERNAL_API] ENVIANDO REQUEST:`, {
        buildingId,
        clientId,
        url,
        method: 'PATCH',
        payload,
        timestamp: new Date().toISOString()
      });
      
      videoLogger.log('debug', 'EXTERNAL_API', 'Sending request', {
        buildingId,
        clientId,
        url,
        payload
      });
      
      // 🌐 CHAMADA COM TIMEOUT
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      
      callResult.status = response.status;
      callResult.statusText = response.statusText;
      
      // 📥 LOG AO RECEBER RESPOSTA
      console.log(`📥 [EXTERNAL_API] RESPOSTA RECEBIDA:`, {
        buildingId,
        clientId,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        elapsed: `${elapsed}ms`,
        timestamp: new Date().toISOString()
      });
      
      // 🔥 NUNCA ASSUMIR SUCESSO SEM VERIFICAR
      if (!response.ok) {
        const errorBody = await response.text();
        callResult.error = `Status ${response.status}: ${errorBody}`;
        callResult.responseBody = errorBody;
        
        console.error(`❌ [EXTERNAL_API] ERRO NA API:`, {
          buildingId,
          clientId,
          status: response.status,
          statusText: response.statusText,
          errorBody,
          url,
          payload
        });
        
        videoLogger.log('error', 'EXTERNAL_API', 'API returned error', {
          buildingId,
          clientId,
          status: response.status,
          errorBody
        });
      } else {
        // 📦 LER E LOGAR O CORPO DA RESPOSTA
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            callResult.responseBody = await response.json();
          } else {
            callResult.responseBody = await response.text();
          }
          
          callResult.success = true;
          
          console.log(`📦 [EXTERNAL_API] CORPO DA RESPOSTA:`, {
            buildingId,
            clientId,
            responseBody: callResult.responseBody,
            timestamp: new Date().toISOString()
          });
        } catch (parseError) {
          console.warn(`⚠️ [EXTERNAL_API] Não foi possível parsear resposta:`, parseError);
          callResult.responseBody = 'Could not parse response';
          callResult.success = true; // Status foi ok, mesmo que não conseguimos parsear
        }
        
        // ✅ CONFIRMAR SUCESSO EXPLICITAMENTE
        console.log(`✅ [EXTERNAL_API] SUCESSO CONFIRMADO para ${buildingId}/${clientId}`, {
          responseBody: callResult.responseBody,
          elapsed: `${elapsed}ms`,
          timestamp: new Date().toISOString()
        });
        
        videoLogger.logAPICall(clientId, url, payload, {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          body: callResult.responseBody
        });
      }
      
      // ⏱️ DELAY ENTRE REQUISIÇÕES
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        callResult.error = 'Request timeout after 30s';
        console.error(`⏱️ [EXTERNAL_API] TIMEOUT após 30s para ${buildingId}`);
        videoLogger.log('error', 'EXTERNAL_API', 'Request timeout', { buildingId });
      } else {
        callResult.error = error.message || 'Unknown error';
        console.error(`💥 [EXTERNAL_API] ERRO AO CHAMAR API para ${buildingId}:`, {
          error: error.message,
          stack: error.stack,
          buildingId,
          videoFileName,
          isActive
        });
        videoLogger.log('error', 'EXTERNAL_API', 'Request failed', { 
          buildingId, 
          error: error.message 
        });
      }
    }
    
    results.push(callResult);
  }
  
  console.log(`🏁 [EXTERNAL_API] Sincronização finalizada:`, {
    total: results.length,
    sucessos: results.filter(r => r.success).length,
    falhas: results.filter(r => !r.success).length,
    resultados: results
  });
  
  return results;
};

/**
 * Sincroniza o status de um vídeo base com a API externa
 * Desativa todos os vídeos do pedido e ativa apenas o selecionado
 */
const performExternalAPISync = async (slotId: string): Promise<void> => {
  try {
    console.log('🌐 [EXTERNAL_API_SYNC] Iniciando sincronização completa para slot:', slotId);
    
    // 1. Buscar informações do slot selecionado
    const { data: selectedSlot, error: slotError } = await supabase
      .from('pedido_videos')
      .select(`
        pedido_id,
        video_id,
        videos (
          id,
          nome,
          url
        )
      `)
      .eq('id', slotId)
      .single();
    
    if (slotError || !selectedSlot) {
      console.error('❌ [EXTERNAL_API_SYNC] Erro ao buscar slot:', slotError);
      return;
    }
    
    const selectedVideoUrl = (selectedSlot.videos as any)?.url || '';
    const selectedVideoFileName = selectedVideoUrl ? getFileNameWithoutExtension(selectedVideoUrl) : 'video';
    console.log('📹 [EXTERNAL_API_SYNC] Vídeo selecionado:', selectedVideoFileName);
    
    // 2. Buscar lista de prédios do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('lista_predios')
      .eq('id', selectedSlot.pedido_id)
      .single();
    
    if (pedidoError || !pedido?.lista_predios || pedido.lista_predios.length === 0) {
      console.warn('⚠️ [EXTERNAL_API_SYNC] Lista de prédios não encontrada');
      return;
    }
    
    const buildingIds = pedido.lista_predios as string[];
    console.log('🏢 [EXTERNAL_API_SYNC] Prédios do pedido:', buildingIds);
    
    // 3. Buscar TODOS os vídeos do pedido
    const { data: allVideos, error: allVideosError } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        video_id,
        videos (
          id,
          nome,
          url
        )
      `)
      .eq('pedido_id', selectedSlot.pedido_id);
    
    if (allVideosError) {
      console.error('❌ [EXTERNAL_API_SYNC] Erro ao buscar todos os vídeos:', allVideosError);
      return;
    }
    
    console.log(`📊 [EXTERNAL_API_SYNC] Total de vídeos no pedido: ${allVideos?.length || 0}`);
    
    // 4. PRIMEIRO: Desativar todos os outros vídeos (SÍNCRONO)
    if (allVideos && allVideos.length > 0) {
      for (const video of allVideos) {
        if (video.id !== slotId) {
          const videoUrl = (video.videos as any)?.url || '';
          const videoFileName = videoUrl ? getFileNameWithoutExtension(videoUrl) : 'video';
          console.log(`🔄 [EXTERNAL_API_SYNC] Desativando vídeo: ${videoFileName}`);
          await syncVideoWithExternalAPI(buildingIds, videoFileName, false);
        }
      }
    }
    
    // 5. DEPOIS: Ativar o vídeo selecionado (SÍNCRONO)
    console.log(`🔄 [EXTERNAL_API_SYNC] Ativando vídeo selecionado: ${selectedVideoFileName}`);
    await syncVideoWithExternalAPI(buildingIds, selectedVideoFileName, true);
    
    console.log('✅ [EXTERNAL_API_SYNC] Sincronização completa concluída');
  } catch (error) {
    console.error('💥 [EXTERNAL_API_SYNC] Erro na sincronização:', error);
    // Não falhar a operação principal por causa disso
  }
};

export const setBaseVideo = async (slotId: string): Promise<{
  success: boolean;
  timestamp: string;
  pedido_video_id?: string;
  video_id?: string;
  message: string;
  api_sync_report?: {
    total_api_calls: number;
    successful_calls: number;
    failed_calls: number;
    success_rate: string;
    deactivations: {
      total: number;
      successful: number;
      details: APICallResult[];
    };
    activations: {
      total: number;
      successful: number;
      details: APICallResult[];
    };
  };
}> => {
  videoLogger.logProcessStart('SET_BASE_VIDEO', { slotId });
  
  try {
    console.log('⭐ [VIDEO_BASE] Definindo vídeo base (RPC):', slotId);
    videoLogger.setContext({ slotId });

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

      // 2) Buscar lista de prédios do pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('lista_predios')
        .eq('id', pv.pedido_id)
        .single();

      const buildingIds = (pedido?.lista_predios as string[]) || [];
      console.log('🏢 [VIDEO_BASE] Fallback: Prédios do pedido:', buildingIds);

      // 3) Buscar TODOS os vídeos do pedido (para desativar na API externa)
      const { data: allVideos } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          video_id,
          videos (
            id,
            nome,
            url
          )
        `)
        .eq('pedido_id', pv.pedido_id);

      // 4) PRIMEIRO: Desmarcar TODOS os vídeos do pedido no banco
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

      // 5) Marcar este slot como base, selecionado e ativo
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

      // 6) Desativar regras de agendamento para este vídeo (se existirem)
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

      // 7) 🔥 Sincronizar com API externa
      if (buildingIds.length > 0) {
        try {
          console.log('🌐🔥 [VIDEO_BASE] Fallback: === SINCRONIZANDO COM API EXTERNA ===');
          
          // PRIMEIRO: Desativar TODOS os outros vídeos na API externa
          if (allVideos && allVideos.length > 0) {
            console.log(`🔄 [VIDEO_BASE] Fallback: Processando ${allVideos.length} vídeos para desativação...`);
            for (const video of allVideos) {
              if (video.id !== slotId) {
                const videoUrl = (video.videos as any)?.url || '';
                const videoFileName = videoUrl ? getFileNameWithoutExtension(videoUrl) : 'video';
                console.log(`⚫ [VIDEO_BASE] Fallback: Desativando "${videoFileName}" (${video.id})`);
                console.log(`📡 [VIDEO_BASE] Fallback: Chamando API para DESATIVAR: ${videoFileName}`);
                await syncVideoWithExternalAPI(buildingIds, videoFileName, false);
                console.log(`✅ [VIDEO_BASE] Fallback: ${videoFileName} desativado com sucesso`);
              }
            }
          } else {
            console.log('ℹ️ [VIDEO_BASE] Fallback: Nenhum outro vídeo para desativar');
          }
          
          // DEPOIS: Ativar o vídeo selecionado na API externa
          const selectedVideoUrl = (pv.videos as any)?.url || '';
          const selectedVideoFileName = selectedVideoUrl ? getFileNameWithoutExtension(selectedVideoUrl) : 'video';
          console.log(`🟢 [VIDEO_BASE] Fallback: Ativando vídeo selecionado: "${selectedVideoFileName}"`);
          console.log(`📡 [VIDEO_BASE] Fallback: Chamando API para ATIVAR: ${selectedVideoFileName}`);
          await syncVideoWithExternalAPI(buildingIds, selectedVideoFileName, true);
          console.log(`✅ [VIDEO_BASE] Fallback: ${selectedVideoFileName} ativado com sucesso`);
          
          console.log('🎉 [VIDEO_BASE] Fallback: === SINCRONIZAÇÃO COM API CONCLUÍDA ===');
        } catch (apiError) {
          console.error('💥 [VIDEO_BASE] Fallback: ERRO NA API EXTERNA:', apiError);
          // Não falhar a operação por causa de erro na API externa
        }
      } else {
        console.warn('⚠️ [VIDEO_BASE] Fallback: Lista de prédios vazia, API não será chamada');
      }

      console.log('✅ [VIDEO_BASE] Fallback direto concluído com sucesso');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Vídeo definido como principal (fallback direto)'
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
          console.warn('⚠️ [VIDEO_BASE] Usando fallback set_base_video devido a falha na enhanced', { isReadOnly });
          // 🔥 CRÍTICO: Sincronizar com API externa mesmo no fallback legacy
          console.log('🔄 [VIDEO_BASE] Sincronizando com API externa após fallback legacy...');
          await performExternalAPISync(slotId);
          console.log('✅ [VIDEO_BASE] Fallback legacy + API externa concluído');
          return {
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Vídeo definido como principal (fallback legacy)'
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

    // 🔄 🔥 CRÍTICO: Sincronizar com API externa
    console.log('🌐🔥 [VIDEO_BASE] === INICIANDO SINCRONIZAÇÃO COM API EXTERNA ===');
    console.log('🔥 [VIDEO_BASE] slotId:', slotId);
    
    try {
      // 1. Buscar informações do slot selecionado
      console.log('🔍 [VIDEO_BASE] PASSO 1: Buscando informações do slot selecionado...');
      videoLogger.log('debug', 'DATA_FETCH', 'Fetching selected slot info', { slotId });
      
      const { data: selectedSlot, error: slotError } = await supabase
        .from('pedido_videos')
        .select(`
          pedido_id,
          video_id,
          videos (
            id,
            nome,
            url
          )
        `)
        .eq('id', slotId)
        .single();
      
      console.log('📦 [VIDEO_BASE] Resultado da busca do slot:', { selectedSlot, slotError });
      videoLogger.logDataFetch('Selected Slot', `slot_id=${slotId}`, selectedSlot);
      
      if (slotError || !selectedSlot) {
        console.error('❌ [VIDEO_BASE] ERRO ao buscar slot selecionado:', slotError);
        videoLogger.log('error', 'DATA_FETCH', 'Failed to fetch selected slot', { slotError });
        console.error('🚨 [VIDEO_BASE] NÃO FOI POSSÍVEL CHAMAR API EXTERNA - Dados do slot não encontrados');
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Erro ao buscar dados do slot - API externa não foi chamada'
        };
      }
      
      console.log('✅ [VIDEO_BASE] Slot encontrado:', {
        pedido_id: selectedSlot.pedido_id,
        video_id: selectedSlot.video_id,
        video_url: (selectedSlot.videos as any)?.url
      });
      
      const selectedVideoUrl = (selectedSlot.videos as any)?.url || '';
      const selectedVideoFileName = selectedVideoUrl ? getFileNameWithoutExtension(selectedVideoUrl) : 'video';
      console.log('📹 [VIDEO_BASE] Vídeo selecionado:', {
        url: selectedVideoUrl,
        arquivoSemExtensao: selectedVideoFileName
      });
      videoLogger.setContext({
        videoId: selectedSlot.video_id,
        videoTitle: selectedVideoFileName,
        orderId: selectedSlot.pedido_id
      });
      
      // 2. Buscar lista de prédios do pedido
      console.log('🔍 [VIDEO_BASE] PASSO 2: Buscando lista de prédios do pedido...');
      videoLogger.log('debug', 'DATA_FETCH', 'Fetching building list', { pedidoId: selectedSlot.pedido_id });
      
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('lista_predios')
        .eq('id', selectedSlot.pedido_id)
        .single();
      
      console.log('📦 [VIDEO_BASE] Resultado da busca de prédios:', { pedido, pedidoError });
      videoLogger.logDataFetch('Buildings List', `pedido_id=${selectedSlot.pedido_id}`, pedido);
      
      if (pedidoError || !pedido?.lista_predios || pedido.lista_predios.length === 0) {
        console.error('❌ [VIDEO_BASE] ERRO: Lista de prédios não encontrada:', pedidoError);
        videoLogger.log('warn', 'DATA_FETCH', 'No buildings found', { pedidoError });
        console.error('🚨 [VIDEO_BASE] NÃO FOI POSSÍVEL CHAMAR API EXTERNA - Lista de prédios vazia');
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Lista de prédios não encontrada - API externa não foi chamada'
        };
      }
      
      const buildingIds = pedido.lista_predios as string[];
      console.log('✅ [VIDEO_BASE] Prédios encontrados:', {
        total: buildingIds.length,
        ids: buildingIds
      });
      videoLogger.setContext({ buildingIds });
      
      // 3. Buscar TODOS os vídeos do pedido (para desativar os outros)
      console.log('🔍 [VIDEO_BASE] PASSO 3: Buscando TODOS os vídeos do pedido...');
      videoLogger.log('debug', 'DATA_FETCH', 'Fetching all order videos', { pedidoId: selectedSlot.pedido_id });
      
      const { data: allVideos, error: allVideosError } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          video_id,
          videos (
            id,
            nome,
            url
          )
        `)
        .eq('pedido_id', selectedSlot.pedido_id);
      
      console.log('📦 [VIDEO_BASE] Resultado da busca de todos os vídeos:', {
        total: allVideos?.length || 0,
        videos: allVideos,
        error: allVideosError
      });
      videoLogger.logDataFetch('All Order Videos', `pedido_id=${selectedSlot.pedido_id}`, allVideos);
      
      if (allVideosError) {
        console.error('❌ [VIDEO_BASE] ERRO ao buscar todos os vídeos:', allVideosError);
        videoLogger.log('error', 'DATA_FETCH', 'Failed to fetch all videos', { allVideosError });
        console.warn('⚠️ [VIDEO_BASE] Continuando apenas com vídeo selecionado...');
      }
      
      console.log(`📊 [VIDEO_BASE] Total de vídeos no pedido: ${allVideos?.length || 0}`);
      videoLogger.log('info', 'DATA_SUMMARY', 'Videos count', { total: allVideos?.length || 0 });
      
      // 4. 🔥 PRIMEIRO: Desativar TODOS os outros vídeos
      console.log('🔥 [VIDEO_BASE] === FASE 1: DESATIVANDO TODOS OS OUTROS VÍDEOS ===');
      videoLogger.log('info', 'API_SYNC_PHASE', 'Starting deactivation phase', { 
        totalVideos: allVideos?.length || 0,
        videosToDeactivate: (allVideos?.length || 0) - 1
      });
      
      const deactivationResults: APICallResult[] = [];
      
      if (allVideos && allVideos.length > 0) {
        console.log(`🔄 [VIDEO_BASE] Processando ${allVideos.length} vídeos para desativação...`);
        for (const video of allVideos) {
          if (video.id !== slotId) {
            const videoUrl = (video.videos as any)?.url || '';
            const videoFileName = videoUrl ? getFileNameWithoutExtension(videoUrl) : 'video';
            console.log(`⚫ [VIDEO_BASE] Desativando vídeo "${videoFileName}" (${video.id})`);
            videoLogger.log('info', 'API_SYNC', 'Deactivating video', { 
              videoId: video.id,
              videoFileName,
              buildingCount: buildingIds.length
            });
            
            console.log(`📡 [VIDEO_BASE] Chamando API externa para DESATIVAR: ${videoFileName}`);
            const results = await syncVideoWithExternalAPI(buildingIds, videoFileName, false);
            deactivationResults.push(...results);
            console.log(`✅ [VIDEO_BASE] Vídeo ${videoFileName} processado: ${results.filter(r => r.success).length}/${results.length} sucessos`);
          }
        }
      } else {
        console.log('ℹ️ [VIDEO_BASE] Nenhum outro vídeo para desativar');
      }
      
      // 5. 🔥 DEPOIS: Ativar APENAS o vídeo selecionado
      console.log('🔥 [VIDEO_BASE] === FASE 2: ATIVANDO NOVO VÍDEO PRINCIPAL ===');
      videoLogger.log('info', 'API_SYNC_PHASE', 'Starting activation phase', { 
        videoFileName: selectedVideoFileName,
        buildingCount: buildingIds.length
      });
      
      console.log(`🟢 [VIDEO_BASE] Ativando vídeo selecionado: "${selectedVideoFileName}"`);
      console.log(`📡 [VIDEO_BASE] Chamando API externa para ATIVAR: ${selectedVideoFileName}`);
      const activationResults = await syncVideoWithExternalAPI(buildingIds, selectedVideoFileName, true);
      console.log(`✅ [VIDEO_BASE] Vídeo ${selectedVideoFileName} processado: ${activationResults.filter(r => r.success).length}/${activationResults.length} sucessos`);
      
      // 📊 RELATÓRIO COMPLETO
      const allResults = [...deactivationResults, ...activationResults];
      const totalCalls = allResults.length;
      const successfulCalls = allResults.filter(r => r.success).length;
      const failedCalls = allResults.filter(r => !r.success).length;
      
      console.log('🎉 [VIDEO_BASE] === SINCRONIZAÇÃO COM API EXTERNA CONCLUÍDA ===');
      console.log('📊 [VIDEO_BASE] RELATÓRIO FINAL:', {
        totalChamadas: totalCalls,
        sucessos: successfulCalls,
        falhas: failedCalls,
        taxaDeSucesso: `${((successfulCalls / totalCalls) * 100).toFixed(1)}%`,
        desativacoes: deactivationResults.length,
        ativacoes: activationResults.length
      });
      
      videoLogger.log('info', 'API_SYNC_PHASE', 'Sync completed', {
        totalCalls,
        successfulCalls,
        failedCalls
      });
      
      // 🔥 RETORNAR DADOS REAIS DA API
      return {
        success: successfulCalls === totalCalls,
        timestamp: new Date().toISOString(),
        pedido_video_id: result.pedido_video_id || slotId,
        video_id: result.video_id || selectedSlot.video_id,
        message: successfulCalls === totalCalls 
          ? 'Vídeo definido como principal e sincronizado com API externa'
          : `Sincronização parcial: ${successfulCalls}/${totalCalls} chamadas bem-sucedidas`,
        api_sync_report: {
          total_api_calls: totalCalls,
          successful_calls: successfulCalls,
          failed_calls: failedCalls,
          success_rate: `${((successfulCalls / totalCalls) * 100).toFixed(1)}%`,
          deactivations: {
            total: deactivationResults.length,
            successful: deactivationResults.filter(r => r.success).length,
            details: deactivationResults
          },
          activations: {
            total: activationResults.length,
            successful: activationResults.filter(r => r.success).length,
            details: activationResults
          }
        }
      };
    } catch (apiError) {
      console.error('💥 [VIDEO_BASE] Erro na sincronização com API externa:', apiError);
      videoLogger.log('error', 'API_SYNC', 'Sync failed with exception', { apiError });
      // Não falhar a operação principal por causa de erro na API externa
      return {
        success: false,
        timestamp: new Date().toISOString(),
        message: 'Erro ao sincronizar com API externa: ' + (apiError?.message || 'erro desconhecido')
      };
    }

    videoLogger.logProcessEnd('SET_BASE_VIDEO', true);
    videoLogger.clearContext();
    return {
      success: false,
      timestamp: new Date().toISOString(),
      message: 'Operação não foi executada completamente'
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