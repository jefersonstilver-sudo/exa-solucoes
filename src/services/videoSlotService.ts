import { supabase } from '@/integrations/supabase/client';
import { VideoSlot } from '@/types/videoManagement';

/**
 * Slots de vídeo de um pedido.
 * Antes: 1 consulta + 2 por vídeo (videos + agendamentos), repetida por até 3 hooks ao abrir a página.
 * Agora: 3 consultas no total (pedido_videos, videos, agendamentos), um só hook carrega, e o último
 * resultado fica guardado para a página abrir na hora.
 */

const CACHE = 'exa-slots:';

/** Último resultado salvo deste pedido (abre a página sem esperar o banco; o banco atualiza em seguida). */
export const slotsEmCache = (orderId: string): VideoSlot[] | null => {
  try {
    const s = sessionStorage.getItem(CACHE + orderId) || localStorage.getItem(CACHE + orderId);
    return s ? (JSON.parse(s) as VideoSlot[]) : null;
  } catch { return null; }
};
const guardar = (orderId: string, slots: VideoSlot[]) => {
  try { const t = JSON.stringify(slots); sessionStorage.setItem(CACHE + orderId, t); localStorage.setItem(CACHE + orderId, t); } catch { /* cheio ou bloqueado */ }
};

const vazio = (position: number): VideoSlot => ({
  slot_position: position,
  is_active: false,
  selected_for_display: false,
  is_base_video: false,
  approval_status: 'pending' as const,
});

async function buscar(orderId: string, safeMaxSlots: number): Promise<VideoSlot[]> {
  const { data: pedidoVideos, error: pedidoError } = await supabase
    .from('pedido_videos')
    .select('*')
    .eq('pedido_id', orderId);
  if (pedidoError) throw pedidoError;

  const pvs = (pedidoVideos || []).filter((pv) => pv.video_id);
  const ids = [...new Set(pvs.map((pv) => pv.video_id as string))];

  const [videosR, agendR] = ids.length
    ? await Promise.all([
        supabase.from('videos').select('*').in('id', ids),
        supabase
          .from('campaign_video_schedules')
          .select('id, video_id, campaign_id, slot_position, campaign_schedule_rules ( id, days_of_week, start_time, end_time, is_active, is_all_day )')
          .in('video_id', ids),
      ])
    : [{ data: [], error: null } as any, { data: [], error: null } as any];

  if (videosR.error) console.error('[VIDEO_SLOTS] videos:', videosR.error);
  if (agendR.error) console.error('[VIDEO_SLOTS] agendamentos:', agendR.error);

  const videoPorId = new Map<string, any>((videosR.data || []).map((v: any) => [v.id, v]));
  const regrasPorVideo = new Map<string, any[]>();
  for (const s of (agendR.data || []) as any[]) {
    const ativas = (s.campaign_schedule_rules || []).filter((r: any) => r.is_active);
    regrasPorVideo.set(s.video_id, [...(regrasPorVideo.get(s.video_id) || []), ...ativas]);
  }

  return Array.from({ length: safeMaxSlots }, (_, i) => i + 1).map((position) => {
    const pedidoVideo = pvs.find((pv) => pv.slot_position === position);
    if (!pedidoVideo) return vazio(position);

    // vídeo base SEMPRE ativo e em exibição (normaliza dados inconsistentes)
    const isBase = pedidoVideo.is_base_video || false;
    const base = {
      id: pedidoVideo.id,
      slot_position: position,
      video_id: pedidoVideo.video_id,
      is_active: isBase ? true : (pedidoVideo.is_active || false),
      selected_for_display: isBase ? true : (pedidoVideo.selected_for_display || false),
      is_base_video: isBase,
      approval_status: ((pedidoVideo.approval_status as 'pending' | 'approved' | 'rejected') || 'pending'),
      rejection_reason: pedidoVideo.rejection_reason,
      qr_config: (pedidoVideo as any).qr_config ?? null,
    };
    const video = videoPorId.get(pedidoVideo.video_id as string);
    // sem a linha do vídeo (upload recente): aparece como "aguardando"
    if (!video) return { ...base, video_data: undefined, schedule_rules: [] } as VideoSlot;
    return {
      ...base,
      video_data: {
        id: video.id,
        nome: video.nome,
        url: video.url,
        duracao: video.duracao,
        orientacao: video.orientacao,
        tem_audio: video.tem_audio,
        tamanho_arquivo: video.tamanho_arquivo,
        formato: video.formato,
      },
      schedule_rules: regrasPorVideo.get(video.id) || [],
    } as VideoSlot;
  });
}

export const loadVideoSlots = async (orderId: string, maxSlots: number = 10): Promise<VideoSlot[]> => {
  const safeMaxSlots = Math.min(maxSlots, 10);
  if (!orderId) return [];

  try {
    const slots = await buscar(orderId, safeMaxSlots);
    guardar(orderId, slots);
    return slots;
  } catch (error) {
    console.error('[VIDEO_SLOTS] Erro geral:', error);
    // nunca derruba a página: usa o último resultado salvo ou slots vazios
    return slotsEmCache(orderId) || Array.from({ length: safeMaxSlots }, (_, i) => vazio(i + 1));
  }
};
