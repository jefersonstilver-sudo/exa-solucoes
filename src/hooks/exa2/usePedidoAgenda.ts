import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VideoSlot } from '@/types/videoManagement';
import {
  AgendaRule,
  AgendaSlot,
  findConflicts,
  RuleType,
} from '@/lib/agenda/agendaEngine';

export interface NovaProgramacao {
  slotId: string;
  rule_type: Exclude<RuleType, 'principal'>;
  label?: string;
  start_date?: string | null;
  end_date?: string | null;
  days_of_week?: number[];
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
  is_override?: boolean;
}

export interface HistoricoItem {
  id: string;
  video_nome: string | null;
  thumbnail_url: string | null;
  resumo_uso: string | null;
  periodo: string | null;
  arquivo_excluido: boolean;
  excluido_em: string | null;
  created_at: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Agenda do pedido: regras (recorrente / data / override) dos vídeos do pedido + histórico.
 * Toda escrita passa por checagem de conflito — conflito nunca é resolvido sozinho.
 */
export function usePedidoAgenda(pedidoId: string, clientId: string | undefined, videoSlots: VideoSlot[]) {
  const [rules, setRules] = useState<AgendaRule[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const slots: AgendaSlot[] = useMemo(
    () =>
      videoSlots
        .filter((s) => s.id && s.video_id)
        .map((s) => ({
          id: s.id as string,
          videoId: s.video_id,
          slot_position: s.slot_position,
          is_base_video: !!s.is_base_video,
          approved: s.approval_status === 'approved',
          nome: s.video_data?.nome,
          url: s.video_data?.url,
        })),
    [videoSlots],
  );

  const videoKey = slots.map((s) => `${s.id}:${s.videoId}`).join(',');

  const load = useCallback(async () => {
    const byVideo = new Map(slots.map((s) => [s.videoId, s]));
    const videoIds = slots.map((s) => s.videoId).filter(Boolean) as string[];
    try {
      if (videoIds.length) {
        const { data, error } = await supabase
          .from('campaign_schedule_rules')
          .select(
            'id, days_of_week, start_time, end_time, is_all_day, is_active, rule_type, start_date, end_date, is_override, label, campaign_video_schedules!inner(video_id)',
          )
          .in('campaign_video_schedules.video_id', videoIds);
        if (error) throw error;
        const mapped: AgendaRule[] = (data || [])
          .map((r: any) => {
            const slot = byVideo.get(r.campaign_video_schedules?.video_id);
            if (!slot) return null;
            return {
              id: r.id,
              slotId: slot.id,
              videoId: slot.videoId as string,
              rule_type: r.rule_type,
              days_of_week: r.days_of_week,
              start_time: r.start_time,
              end_time: r.end_time,
              is_all_day: r.is_all_day,
              is_active: r.is_active,
              start_date: r.start_date,
              end_date: r.end_date,
              is_override: r.is_override,
              label: r.label,
            } as AgendaRule;
          })
          .filter(Boolean) as AgendaRule[];
        setRules(mapped);
      } else {
        setRules([]);
      }

      const { data: hist } = await supabase
        .from('pedido_videos_historico')
        .select('id, video_nome, thumbnail_url, resumo_uso, periodo, arquivo_excluido, excluido_em, created_at')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: false })
        .limit(30);
      setHistorico((hist as HistoricoItem[]) || []);
    } catch (e) {
      console.error('[EXA2][agenda] erro ao carregar agenda', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId, videoKey]);

  useEffect(() => {
    if (pedidoId) load();
  }, [pedidoId, load]);

  /** Garante o "trilho" de agendamento do vídeo (campanha + schedule) e devolve o id. */
  const ensureVideoSchedule = useCallback(
    async (slot: AgendaSlot): Promise<string> => {
      const { data: existing } = await supabase
        .from('campaign_video_schedules')
        .select('id')
        .eq('video_id', slot.videoId as string)
        .limit(1);
      if (existing && existing.length) return existing[0].id;

      if (!clientId) throw new Error('Cliente não identificado');
      const { data: camp, error: campErr } = await supabase
        .from('campaigns_advanced')
        .insert({
          client_id: clientId,
          pedido_id: pedidoId,
          name: `Programação · ${slot.nome || 'vídeo ' + slot.slot_position}`,
          description: 'Criada pela Agenda do pedido (EXA 2.0)',
          start_date: today(),
          end_date: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
          status: 'active',
        } as any)
        .select('id')
        .single();
      if (campErr || !camp) throw campErr || new Error('Não foi possível criar a programação');

      const { data: cvs, error: cvsErr } = await supabase
        .from('campaign_video_schedules')
        .insert({ campaign_id: camp.id, video_id: slot.videoId as string, slot_position: slot.slot_position, priority: 1 })
        .select('id')
        .single();
      if (cvsErr || !cvs) throw cvsErr || new Error('Não foi possível criar a programação');
      return cvs.id;
    },
    [clientId, pedidoId],
  );

  /** Retorna os conflitos da nova programação (vazio = pode salvar direto). */
  const checarConflitos = useCallback(
    (nova: NovaProgramacao): AgendaRule[] => {
      const candidate: AgendaRule = {
        id: '__nova__',
        slotId: nova.slotId,
        videoId: '',
        rule_type: nova.rule_type,
        days_of_week: nova.days_of_week || null,
        start_time: nova.is_all_day ? '00:00' : nova.start_time,
        end_time: nova.is_all_day ? '23:59' : nova.end_time,
        is_all_day: nova.is_all_day,
        is_active: true,
        start_date: nova.start_date || null,
        end_date: nova.end_date || nova.start_date || null,
      };
      return findConflicts(rules, candidate, new Date(), 130, slots);
    },
    [rules, slots],
  );

  /** Salva a programação. Só chamar com override=true se o CLIENTE escolheu sobrepor. */
  const salvarProgramacao = useCallback(
    async (nova: NovaProgramacao) => {
      const slot = slots.find((s) => s.id === nova.slotId);
      if (!slot) throw new Error('Vídeo não encontrado');
      if (!slot.approved) throw new Error('Este vídeo ainda está em aprovação pela EXA');
      setSaving(true);
      try {
        const cvsId = await ensureVideoSchedule(slot);
        const { error } = await supabase.from('campaign_schedule_rules').insert({
          campaign_video_schedule_id: cvsId,
          rule_type: nova.rule_type,
          label: nova.label || null,
          start_date: nova.rule_type === 'data' ? nova.start_date : null,
          end_date: nova.rule_type === 'data' ? nova.end_date || nova.start_date : null,
          days_of_week: nova.rule_type === 'recorrente' ? nova.days_of_week || [] : nova.days_of_week || [],
          is_all_day: nova.is_all_day,
          start_time: nova.is_all_day ? '00:00:00' : `${nova.start_time}:00`,
          end_time: nova.is_all_day ? '23:59:00' : `${nova.end_time}:00`,
          is_override: !!nova.is_override,
          is_active: true,
        });
        if (error) throw error;
        await load();
      } finally {
        setSaving(false);
      }
    },
    [slots, ensureVideoSchedule, load],
  );

  const removerProgramacao = useCallback(
    async (ruleId: string) => {
      setSaving(true);
      try {
        const { error } = await supabase.from('campaign_schedule_rules').delete().eq('id', ruleId);
        if (error) throw error;
        await load();
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  return { slots, rules, historico, loading, saving, reload: load, checarConflitos, salvarProgramacao, removerProgramacao };
}
