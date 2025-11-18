import { supabase } from "@/integrations/supabase/client";
import { videoLogger } from "./logger/VideoActionLogger";

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                          */
/* -------------------------------------------------------------------------- */

export type SetBaseVideoResult = {
  success: boolean;
  timestamp: string;
  pedido_video_id?: string | null;
  video_id?: string | null;
  message: string;
};

type PedidoVideosRow = {
  id: string;
  pedido_id?: string;
  video_id?: string | null;
  slot_position?: number | null;
  approval_status?: string | null;
  pedidos?: { lista_predios?: string[] } | null;
  videos?: { id?: string; nome?: string; url?: string } | null;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const now = () => new Date().toISOString();

const extractTitulo = (videoPathOrName?: string | null): string | null => {
  if (!videoPathOrName) return null;
  // se vier com path, pega último segmento
  const base = String(videoPathOrName).split("/").pop() || "";
  // remove query/hash e última extensão (.mp4, .mov etc)
  const noQueryHash = base.split("?")[0].split("#")[0];
  const cleaned = noQueryHash.replace(/\.[^.]+$/, "").trim();
  return cleaned || null;
};

// 🔍 Busca todos os slots com vídeo de um pedido específico
const fetchAllPedidoSlots = async (pedidoId: string) => {
  console.log("🔍 [FETCH_SLOTS] Buscando todos os slots do pedido:", pedidoId);
  
  const { data, error } = await supabase
    .from('pedido_videos')
    .select(`
      id,
      video_id,
      slot_position,
      pedidos!inner ( lista_predios ),
      videos ( nome, url )
    `)
    .eq('pedido_id', pedidoId)
    .not('video_id', 'is', null); // Apenas slots com vídeo

  if (error) {
    console.error("❌ [FETCH_SLOTS] Erro ao buscar slots:", error);
    return { data: null, error };
  }

  console.log(`✅ [FETCH_SLOTS] Encontrados ${data?.length || 0} slots com vídeo`);
  return { data, error: null };
};

// 🔔 Notificar API externa sobre mudança de vídeos
const notifyExternalAPI = async (pedidoId: string, activeVideoId: string) => {
  try {
    console.log('🔔 [NOTIFY_API] ====== INÍCIO ======');
    console.log('🔔 [NOTIFY_API] Pedido:', pedidoId);
    console.log('🔔 [NOTIFY_API] Video ativo:', activeVideoId);
    console.log('🔔 [NOTIFY_API] Supabase client:', !!supabase);
    console.log('🔔 [NOTIFY_API] Supabase functions:', !!supabase.functions);
    
    videoLogger.log("info", "NOTIFY_API_START", "Iniciando notificação API externa", { pedidoId, activeVideoId });

    const { data: allSlots, error: slotsError } = await fetchAllPedidoSlots(pedidoId);
    
    if (slotsError || !allSlots || allSlots.length === 0) {
      console.error('❌ [NOTIFY_API] Erro ao buscar slots:', slotsError);
      throw new Error(`Erro ao buscar slots: ${JSON.stringify(slotsError)}`);
    }

    console.log('✅ [NOTIFY_API] Slots encontrados:', allSlots.length);

    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .select('lista_predios')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedidoData?.lista_predios) {
      console.error('❌ [NOTIFY_API] Erro ao buscar prédios:', pedidoError);
      throw new Error(`Erro ao buscar prédios: ${JSON.stringify(pedidoError)}`);
    }

    const buildingIds = pedidoData.lista_predios;
    console.log('✅ [NOTIFY_API] Prédios:', buildingIds);

    let finalActiveVideoId = activeVideoId;
    if (!finalActiveVideoId || !(allSlots as PedidoVideosRow[]).some(s => s.video_id === activeVideoId)) {
      finalActiveVideoId = (allSlots as PedidoVideosRow[])[0]?.video_id;
      console.warn(`⚠️ [NOTIFY_API] Fallback para:`, finalActiveVideoId);
    }

    // Passo 1: Desativar TODOS
    const deactivateActions: Array<{ titulo: string; ativo: boolean; predio_id: string }> = [];
    buildingIds.forEach((buildingId: string) => {
      (allSlots as PedidoVideosRow[]).forEach(slot => {
        const titulo = extractTitulo(slot.videos?.url);
        if (!titulo) return;
        deactivateActions.push({ titulo, ativo: false, predio_id: buildingId });
      });
    });

    console.log('🔔 [NOTIFY_API] PASSO 1: Desativando', deactivateActions.length, 'vídeos');
    const deactivateResult = await supabase.functions.invoke("notify-video-toggle", {
      body: { actions: deactivateActions }
    });

    console.log('🔔 [NOTIFY_API] Resposta desativar:', deactivateResult);
    if (deactivateResult.error) {
      console.error('❌ [NOTIFY_API] Erro ao desativar:', deactivateResult.error);
      throw new Error(`Erro ao desativar: ${JSON.stringify(deactivateResult.error)}`);
    }

    // Passo 2: Ativar apenas UM
    const activateActions: Array<{ titulo: string; ativo: boolean; predio_id: string }> = [];
    buildingIds.forEach((buildingId: string) => {
      (allSlots as PedidoVideosRow[]).forEach(slot => {
        const titulo = extractTitulo(slot.videos?.url);
        if (!titulo || slot.video_id !== finalActiveVideoId) return;
        activateActions.push({ titulo, ativo: true, predio_id: buildingId });
      });
    });

    console.log('🔔 [NOTIFY_API] PASSO 2: Ativando', activateActions.length, 'vídeo(s)');
    const activateResult = await supabase.functions.invoke("notify-video-toggle", {
      body: { actions: activateActions }
    });

    console.log('🔔 [NOTIFY_API] Resposta ativar:', activateResult);
    if (activateResult.error) {
      console.error('❌ [NOTIFY_API] Erro ao ativar:', activateResult.error);
      throw new Error(`Erro ao ativar: ${JSON.stringify(activateResult.error)}`);
    }

    console.log('✅ [NOTIFY_API] ====== SUCESSO ======');
    return { success: true, data: activateResult.data };
    
  } catch (err: any) {
    console.error('💥 [NOTIFY_API] EXCEÇÃO:', err.message);
    throw err;
  }
};

/* -------------------------------------------------------------------------- */
/* Fallback: atualização direta no banco (quando RPCs falharem)               */
/* -------------------------------------------------------------------------- */

const fallbackDirectUpdate = async (slotId: string): Promise<SetBaseVideoResult> => {
  videoLogger.log("warn", "FALLBACK_START", "Iniciando fallback direto no banco", { slotId });

  // 1) Buscar dados do slot (pedido_id, video_id, approval_status)
  const { data: pv, error: pvErr } = await supabase
    .from("pedido_videos")
    .select(
      `
      id,
      pedido_id,
      video_id,
      slot_position,
      approval_status,
      videos ( id, nome, url )
    `,
    )
    .eq("id", slotId)
    .maybeSingle();

  if (pvErr || !pv) {
    videoLogger.log("error", "FALLBACK_FETCH_SLOT_ERR", "Erro ao buscar slot para fallback", { pvErr });
    return { success: false, timestamp: now(), message: "Erro ao buscar dados do slot" };
  }

  if (pv.approval_status !== "approved") {
    videoLogger.log("error", "FALLBACK_NOT_APPROVED", "Vídeo não aprovado", { approval_status: pv.approval_status });
    return { success: false, timestamp: now(), message: "Vídeo não está aprovado" };
  }

  // 2) Desmarcar TODOS os vídeos do pedido
  const { error: clearErr } = await supabase
    .from("pedido_videos")
    .update({ is_base_video: false, selected_for_display: false, updated_at: now() })
    .eq("pedido_id", pv.pedido_id);

  if (clearErr) {
    videoLogger.log("error", "FALLBACK_CLEAR_ERR", "Erro ao desmarcar vídeos do pedido", { clearErr });
    return { success: false, timestamp: now(), message: "Erro ao desmarcar vídeos" };
  }

  // 3) Marcar este slot como base
  const { error: upErr } = await supabase
    .from("pedido_videos")
    .update({ is_base_video: true, selected_for_display: true, is_active: true, updated_at: now() })
    .eq("id", slotId);

  if (upErr) {
    videoLogger.log("error", "FALLBACK_MARK_ERR", "Erro ao marcar vídeo como base", { upErr });
    return { success: false, timestamp: now(), message: "Erro ao marcar vídeo como principal" };
  }

  // 4) Desativar regras de agendamento relacionadas
  try {
    const { data: scheds, error: schedFetchErr } = await supabase
      .from("campaign_video_schedules")
      .select("id")
      .eq("video_id", pv.video_id);

    if (schedFetchErr) {
      videoLogger.log("warn", "FALLBACK_SCHED_FETCH_ERR", "Erro ao buscar schedules", { schedFetchErr });
    } else if (scheds && Array.isArray(scheds) && scheds.length > 0) {
      const ids = scheds.map((s: any) => s.id);
      const { error: schedUpdErr } = await supabase
        .from("campaign_schedule_rules")
        .update({ is_active: false, updated_at: now() })
        .in("campaign_video_schedule_id", ids)
        .eq("is_active", true);

      if (schedUpdErr) {
        videoLogger.log("warn", "FALLBACK_SCHED_UPD_ERR", "Não foi possível desativar algumas regras", { schedUpdErr });
      }
    }
  } catch (err) {
    videoLogger.log("warn", "FALLBACK_SCHED_ERR", "Erro ao processar schedules", { err });
  }

  videoLogger.log("info", "FALLBACK_DONE", "Fallback direto concluído com sucesso", { slotId });

  return {
    success: true,
    timestamp: now(),
    message: "Vídeo definido como principal (fallback direto)",
    pedido_video_id: slotId,
    video_id: pv.video_id || null,
  };
};

/* -------------------------------------------------------------------------- */
/* Main: setBaseVideo                                                           */
/* -------------------------------------------------------------------------- */

export const setBaseVideo = async (slotId: string): Promise<SetBaseVideoResult> => {
  console.log('⭐ [SET_BASE_VIDEO] Iniciando troca de vídeo principal:', {
    slotId,
    timestamp: now()
  });
  
  videoLogger.logRPC('set_base_video_init', 'Iniciando setBaseVideo', { 
    slotId, 
    timestamp: now() 
  });

  try {
    // Chamar nova RPC safe_set_base_video (com proteção contra remoção do último base)
    console.log('🔄 [SET_BASE_VIDEO] Chamando RPC safe_set_base_video...');
    videoLogger.logRPC('set_base_video_rpc_call', 'Chamando RPC safe_set_base_video', { slotId });
    
    const { data, error } = await supabase.rpc('safe_set_base_video', {
      p_slot_id: slotId  // Nome correto do parâmetro
    });
    
    videoLogger.logRPC('set_base_video_rpc_response', 'Resposta da RPC recebida', { 
      slotId, 
      hasError: !!error,
      hasData: !!data,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      } : null
    });

    if (error) {
      console.error('❌ [SET_BASE_VIDEO] Erro na RPC:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      videoLogger.logRPC('set_base_video_rpc_error', 'Erro na chamada RPC', { 
        slotId, 
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        }
      });
      return {
        success: false,
        timestamp: now(),
        message: error.message || 'Erro ao chamar RPC'
      };
    }

    console.log('📦 [SET_BASE_VIDEO] Resposta da RPC recebida:', data);

    const result = data as any;

    if (!result?.success) {
      const errorMsg = result?.error || result?.message || 'Falha ao definir vídeo como principal';
      console.error('❌ [SET_BASE_VIDEO] RPC retornou falha:', {
        result,
        success: result?.success,
        error: result?.error,
        message: result?.message,
        errorMsg
      });
      videoLogger.logRPC('set_base_video_rpc_failed', 'RPC retornou falha', { 
        slotId, 
        result,
        errorMsg
      });
      
      // Registrar no sistema de debug
      if (typeof window !== 'undefined' && (window as any).__captureToast) {
        (window as any).__captureToast('error', errorMsg);
      }
      
      return {
        success: false,
        timestamp: now(),
        message: errorMsg
      };
    }

    console.log('✅ [SET_BASE_VIDEO] Sucesso na troca de vídeo principal:', {
      result,
      new_base_id: result.new_base_id,
      old_base_id: result.old_base_id,
      pedido_id: result.pedido_id,
      schedules_removed: result.schedules_removed
    });
    
    videoLogger.logRPC('set_base_video_success', 'Vídeo definido como principal com sucesso', { 
      slotId, 
      new_base_id: result.new_base_id,
      old_base_id: result.old_base_id,
      pedido_id: result.pedido_id,
      schedules_removed: result.schedules_removed
    });
    
    // 🔔 NOTIFICAR API EXTERNA - Centralizado via notify-video-toggle
    console.log('🔔 [SET_BASE_VIDEO] Iniciando notificação da API externa...');
    
    try {
      // Buscar pedido_id e video_id do novo vídeo base
      const { data: currentSlot, error: slotError } = await supabase
        .from('pedido_videos')
        .select('pedido_id, video_id')
        .eq('id', slotId)
        .single();
      
      if (slotError || !currentSlot?.pedido_id || !currentSlot?.video_id) {
        console.error('❌ [SET_BASE_VIDEO] Erro ao buscar dados do slot:', slotError);
        // Não bloquear o retorno - API externa é secundária
        return {
          success: true,
          timestamp: now(),
          pedido_video_id: result.new_base_id,
          video_id: result.new_base_id,
          message: 'Vídeo definido como principal (notificação externa falhou)'
        };
      }

      console.log('🔔 [SET_BASE_VIDEO] Notificando API externa:', {
        pedidoId: currentSlot.pedido_id,
        activeVideoId: currentSlot.video_id
      });

      // Chamar função centralizada de notificação
      console.log('🔔 [SET_BASE_VIDEO] Chamando notifyExternalAPI...');
      const notifyResult = await notifyExternalAPI(currentSlot.pedido_id, currentSlot.video_id);
      console.log('✅ [SET_BASE_VIDEO] API externa notificada com sucesso:', notifyResult);
    } catch (err: any) {
      console.error('❌ [SET_BASE_VIDEO] ERRO CRÍTICO ao notificar API externa:', err);
      console.error('❌ [SET_BASE_VIDEO] Erro detalhado:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      
      // MOSTRAR ERRO PARA O USUÁRIO
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "⚠️ Vídeo definido, mas API externa não foi atualizada",
        description: `Erro: ${err.message}. Entre em contato com o suporte.`,
        variant: "destructive"
      });
    }
    
    return {
      success: true,
      timestamp: now(),
      message: result.message || 'Vídeo definido como principal',
      pedido_video_id: result.new_base_id,
      video_id: null // A nova RPC não retorna video_id diretamente
    };

  } catch (err: any) {
    console.error('💥 [SET_BASE_VIDEO] Erro geral ao trocar vídeo principal:', {
      error: err,
      message: err.message,
      stack: err.stack
    });
    videoLogger.logRPC('set_base_video_exception', 'Exceção geral ao trocar vídeo', { 
      slotId, 
      error: err.message,
      stack: err.stack
    });
    return {
      success: false,
      timestamp: now(),
      message: err.message || 'Unknown error'
    };
  }
};

/* -------------------------------------------------------------------------- */
/* getCurrentDisplayVideo (refatorado)                                        */
/* -------------------------------------------------------------------------- */

export const getCurrentDisplayVideo = async (orderId: string) => {
  videoLogger.log("debug", "GET_CURRENT_DISPLAY_VIDEO", "Obtendo vídeo atual", { orderId });

  try {
    const { data, error } = await supabase.rpc("get_current_display_video", { p_pedido_id: orderId });
    if (error) {
      videoLogger.log("error", "RPC_GET_CURRENT_ERR", "Erro ao obter vídeo atual", { error });
      throw error;
    }

    videoLogger.log("info", "RPC_GET_CURRENT_OK", "Vídeo atual obtido", { orderId, data });
    return data;
  } catch (err) {
    videoLogger.log("error", "GET_CURRENT_THROW", "Erro geral ao obter vídeo atual", { err });
    return null;
  }
};
