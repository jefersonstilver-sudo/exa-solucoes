import { supabase } from "@/integrations/supabase/client";
import { videoLogger } from "./logger/VideoActionLogger";

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                          */
/* -------------------------------------------------------------------------- */

type SetBaseVideoResult = {
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

const extractTitulo = (videoNome?: string | null): string | null => {
  if (!videoNome) return null;
  // se vier com path, pega último segmento
  const base = String(videoNome).split("/").pop() || "";
  // remove última extensão (.mp4, .mov etc) e trim
  const cleaned = base.replace(/\.[^.]+$/, "").trim();
  return cleaned || null;
};

const safeInvokeNotifyActive = async (buildingUuid: string, titulo: string, ativo = true) => {
  try {
    const clientId = String(buildingUuid).substring(0, 4);
    const payload = { clientId, buildingUuid, titulo, ativo };

    videoLogger.log("debug", "NOTIFY_INVOKE", "Invoking notify-active", { payload });

    const { data: fnData, error: fnError } = await supabase.functions.invoke("notify-active", {
      // garantir raw JSON
      body: JSON.stringify(payload),
    });

    if (fnError) {
      videoLogger.log("error", "NOTIFY_ERROR", "notify-active returned error", { fnError, buildingUuid });
      return { success: false, error: fnError };
    }

    videoLogger.log("info", "NOTIFY_OK", "notify-active success", { buildingUuid, fnData });
    return { success: true, data: fnData };
  } catch (err) {
    videoLogger.log("warn", "NOTIFY_THROW", "notify-active threw", { err, buildingUuid });
    return { success: false, error: err };
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
  videoLogger.logProcessStart("SET_BASE_VIDEO", { slotId });
  videoLogger.setContext({ slotId });

  try {
    console.log("⭐ [VIDEO_BASE] Definindo vídeo base:", slotId);

    // Buscar dados essenciais do pedido/slot/video
    const { data: pvData, error: pvError } = await supabase
      .from("pedido_videos")
      .select(
        `
        pedido_id,
        video_id,
        pedidos!inner ( lista_predios ),
        videos!inner ( nome )
      `,
      )
      .eq("id", slotId)
      .maybeSingle();

    if (pvError) {
      videoLogger.log("error", "FETCH_PV_ERR", "Erro ao buscar dados do pedido_videos", { pvError });
    }

    const listaPredios = pvData?.pedidos?.lista_predios || [];
    const videoNome = pvData?.videos?.nome || null;
    const tituloSemExtensao = extractTitulo(videoNome);

    console.log("🏢 [VIDEO_BASE] Lista de prédios:", listaPredios);
    console.log("🎬 [VIDEO_BASE] Nome do vídeo:", videoNome);
    console.log("📝 [VIDEO_BASE] Título sem extensão:", tituloSemExtensao);

    // 🔥 SEMPRE: tentar notificar API externa primeiro (mas não falha o fluxo)
    if (listaPredios.length > 0 && tituloSemExtensao) {
      // optar por notificar todos os prédios (ou só o primeiro se preferir)
      for (const buildingUuid of listaPredios) {
        const notifyRes = await safeInvokeNotifyActive(buildingUuid, tituloSemExtensao, true);
        if (!notifyRes.success) {
          // logs já feitos internamente; prosseguir com a execução
          console.warn("[VIDEO_BASE] notify-active falhou para", buildingUuid);
        }
      }
    } else {
      console.warn("[VIDEO_BASE] Dados insuficientes para chamar API externa", {
        temPredios: listaPredios.length > 0,
        temTitulo: !!tituloSemExtensao,
      });
    }

    // Tentar RPC principal
    videoLogger.log("debug", "RPC_CALL", "Calling set_base_video_enhanced", { slotId });
    console.log("📞 [VIDEO_BASE] Chamando RPC set_base_video_enhanced:", { slotId });

    const { data, error } = await supabase.rpc("set_base_video_enhanced", {
      p_pedido_video_id: slotId,
    });

    videoLogger.logRPC("set_base_video_enhanced", { slotId }, data, error);

    if (error) {
      videoLogger.log("error", "RPC_ERR_ENHANCED", "Erro RPC set_base_video_enhanced", { error });

      // tentar RPC legacy como compatibilidade
      try {
        const { data: legacyData, error: legacyError } = await supabase.rpc("set_base_video", {
          p_pedido_video_id: slotId,
        });

        if (legacyError) {
          videoLogger.log("error", "RPC_ERR_LEGACY", "Erro RPC legacy set_base_video", { legacyError });
          // partir para fallback direto
          return await fallbackDirectUpdate(slotId);
        }

        if (legacyData === true) {
          videoLogger.log("info", "RPC_LEGACY_OK", "Vídeo definido via legacy RPC", { slotId });
          videoLogger.logProcessEnd("SET_BASE_VIDEO", true);
          videoLogger.clearContext();
          return {
            success: true,
            timestamp: now(),
            message: "Vídeo definido como principal (fallback legacy)",
            pedido_video_id: slotId,
            video_id: null,
          };
        }

        // legacy retornou falsy -> fallback direto
        return await fallbackDirectUpdate(slotId);
      } catch (legacyCatchErr) {
        videoLogger.log("error", "RPC_LEGACY_THROW", "Legacy RPC throw", { legacyCatchErr });
        return await fallbackDirectUpdate(slotId);
      }
    }

    const result = data as any;
    videoLogger.log("debug", "RPC_RESULT", "Resultado RPC", { result });

    if (!result || !result.success) {
      videoLogger.log("error", "RPC_LOGIC_FAIL", "Falha lógica na RPC", { result });
      // tentar fallback direto
      return await fallbackDirectUpdate(slotId);
    }

    videoLogger.logProcessEnd("SET_BASE_VIDEO", true);
    videoLogger.clearContext();

    return {
      success: true,
      timestamp: now(),
      pedido_video_id: result?.pedido_video_id || slotId,
      video_id: result?.video_id || null,
      message: "Vídeo definido como principal",
    };
  } catch (err) {
    videoLogger.log("error", "SET_BASE_VIDEO_THROW", "Erro geral", { err });
    videoLogger.logProcessEnd("SET_BASE_VIDEO", false, null, err);
    videoLogger.clearContext();

    return { success: false, timestamp: now(), message: "Erro geral: " + (err?.message || "erro desconhecido") };
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
