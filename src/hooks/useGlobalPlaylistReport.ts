import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReportVideoRow {
  pedido_video_id: string;
  pedido_id: string;
  video_id: string;
  video_nome: string;
  video_url: string;
  video_duracao: number | null;
  orientacao: 'horizontal' | 'vertical' | 'desconhecida';
  slot_position: number;
  approval_status: string;
  is_active: boolean;
  selected_for_display: boolean;
  qr_enabled: boolean;
  qr_url: string | null;
  selecionado_em: string | null; // ISO
  dias_em_exibicao: number;
  schedule_summary: string;
  // pedido
  plano_meses: number | null;
  valor_total: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  // client
  client_id: string;
  client_name: string;
  client_email: string;
}

export interface ReportBuilding {
  id: string;
  nome: string;
  codigo: string | null;
  bairro: string | null;
  endereco: string | null;
  status: string;
  quantidade_telas: number;
  online: boolean;
  online_label: string;
  videosH: ReportVideoRow[];
  videosV: ReportVideoRow[];
  pedidos_ativos_count: number;
}

export interface ReportClient {
  client_id: string;
  client_name: string;
  client_email: string;
  predios: { id: string; nome: string }[];
  total_videos: number;
  total_videos_h: number;
  total_videos_v: number;
  pedidos: {
    pedido_id: string;
    plano_meses: number | null;
    valor_total: number | null;
    data_inicio: string | null;
    data_fim: string | null;
  }[];
}

export interface ReportAlert {
  type: 'pedido_sem_video' | 'predio_offline_com_pedido';
  severity: 'red' | 'yellow';
  title: string;
  description: string;
  context: Record<string, any>;
}

export interface ReportActiveOrder {
  pedido_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  plano_meses: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  predios_count: number;
  videos_total: number;
  videos_h: number;
  videos_v: number;
  has_display: boolean;
}

export interface PlaylistReport {
  generatedAt: string;
  buildings: ReportBuilding[];
  clients: ReportClient[];
  activeOrders: ReportActiveOrder[];
  kpis: {
    totalPredios: number;
    totalClientes: number;
    totalVideos: number;
    totalVideosH: number;
    totalVideosV: number;
    totalPedidos: number;
    totalAlertas: number;
    tempoMedioDias: number;
  };
  rankings: {
    topClientes: { client_id: string; nome: string; predios_count: number; videos_count: number }[];
    topPredios: { id: string; nome: string; videos_count: number }[];
  };
  alerts: ReportAlert[];
}

const OFFLINE_THRESHOLD_MIN = 10;
const ACTIVE_STATUSES = ['ativo', 'video_aprovado'];

function diffDays(fromIso: string | null): number {
  if (!fromIso) return 0;
  const from = new Date(fromIso).getTime();
  return Math.max(0, Math.floor((Date.now() - from) / 86_400_000));
}

function inferOrientacao(o?: string | null): ReportVideoRow['orientacao'] {
  const v = (o || '').toLowerCase();
  if (v.startsWith('h')) return 'horizontal';
  if (v.startsWith('v')) return 'vertical';
  return 'desconhecida';
}

function buildClientName(u: any): string {
  if (!u) return 'Cliente';
  return (
    u.nome ||
    [u.primeiro_nome, u.sobrenome].filter(Boolean).join(' ').trim() ||
    (u.email ? u.email.split('@')[0] : 'Cliente')
  );
}

export function useGlobalPlaylistReport() {
  const [data, setData] = useState<PlaylistReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1) Prédios elegíveis
      const { data: buildingsRaw, error: bErr } = await (supabase as any)
        .from('buildings')
        .select(
          'id, nome, codigo_predio, bairro, endereco, status, quantidade_telas'
        )
        .in('status', ['ativo', 'instalação', 'instalacao']);
      if (bErr) throw bErr;
      const buildings = buildingsRaw || [];
      const buildingIds = buildings.map((b: any) => b.id);

      if (buildingIds.length === 0) {
        setData({
          generatedAt: new Date().toISOString(),
          buildings: [],
          clients: [],
          activeOrders: [],
          kpis: {
            totalPredios: 0, totalClientes: 0, totalVideos: 0, totalVideosH: 0,
            totalVideosV: 0, totalPedidos: 0, totalAlertas: 0, tempoMedioDias: 0,
          },
          rankings: { topClientes: [], topPredios: [] },
          alerts: [],
        });
        return;
      }

      // 2) Pedidos ativos que afetam estes prédios
      const { data: pedidosRaw, error: pErr } = await (supabase as any)
        .from('pedidos')
        .select(
          'id, client_id, valor_total, data_inicio, data_fim, status, plano_meses, lista_predios'
        )
        .in('status', ACTIVE_STATUSES)
        .gte('data_fim', today);
      if (pErr) throw pErr;
      const pedidosFiltered = (pedidosRaw || []).filter((p: any) =>
        Array.isArray(p.lista_predios) &&
        p.lista_predios.some((id: string) => buildingIds.includes(id))
      );
      const pedidoIds = pedidosFiltered.map((p: any) => p.id);

      // 3) Paralelo: pedido_videos + users + devices + campanhas (campaigns_advanced)
      const [pvRes, usersRes, devicesRes, campAdvRes] = await Promise.all([
        pedidoIds.length
          ? (supabase as any)
              .from('pedido_videos')
              .select(
                'id, pedido_id, video_id, slot_position, is_active, approval_status, selected_for_display, qr_config, created_at, updated_at, approved_at, is_base_video, videos:videos ( id, nome, url, duracao, orientacao )'
              )
              .in('pedido_id', pedidoIds)
          : Promise.resolve({ data: [], error: null }),

        (supabase as any)
          .from('users')
          .select('id, nome, primeiro_nome, sobrenome, email')
          .in('id', Array.from(new Set(pedidosFiltered.map((p: any) => p.client_id).filter(Boolean)))),
        (supabase as any)
          .from('devices')
          .select('id, building_id, status, last_online_at')
          .in('building_id', buildingIds)
          .eq('is_active', true),
        pedidoIds.length
          ? (supabase as any)
              .from('campaigns_advanced')
              .select('id, pedido_id')
              .in('pedido_id', pedidoIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (pvRes.error) throw pvRes.error;
      if (usersRes.error) throw usersRes.error;
      if (devicesRes.error) throw devicesRes.error;

      const pedidoVideos = pvRes.data || [];
      const usersById = new Map<string, any>(
        (usersRes.data || []).map((u: any) => [u.id, u])
      );
      const devices = devicesRes.data || [];

      // 3.1) Buscar agendamentos (campaign_video_schedules + campaign_schedule_rules)
      const campAdv = (campAdvRes as any)?.data || [];
      const campaignIds = campAdv.map((c: any) => c.id);
      const pedidoByCampaign = new Map<string, string>(
        campAdv.map((c: any) => [c.id, c.pedido_id])
      );

      const [cvsRes, rulesRes] = await Promise.all([
        campaignIds.length
          ? (supabase as any)
              .from('campaign_video_schedules')
              .select('id, campaign_id, video_id')
              .in('campaign_id', campaignIds)
          : Promise.resolve({ data: [] }),
        Promise.resolve({ data: [] as any[] }),
      ]);

      const cvs = (cvsRes as any)?.data || [];
      const cvsIds = cvs.map((c: any) => c.id);
      const { data: rulesRaw } = cvsIds.length
        ? await (supabase as any)
            .from('campaign_schedule_rules')
            .select('campaign_video_schedule_id, days_of_week, start_time, end_time, is_active, is_all_day')
            .in('campaign_video_schedule_id', cvsIds)
        : { data: [] };
      const rules = rulesRaw || [];
      console.debug('[PlaylistReport] schedules', {
        campaigns: campAdv.length,
        videoSchedules: cvs.length,
        rules: rules.length,
      });

      // Map (pedido_id::video_id) -> rules[]
      const scheduleKey = (pid: string, vid: string) => `${pid}::${vid}`;
      const rulesByPedidoVideo = new Map<string, any[]>();
      for (const r of rules) {
        if (r.is_active === false) continue;
        const link = cvs.find((c: any) => c.id === r.campaign_video_schedule_id);
        if (!link) continue;
        const pid = pedidoByCampaign.get(link.campaign_id);
        if (!pid) continue;
        const k = scheduleKey(pid, link.video_id);
        if (!rulesByPedidoVideo.has(k)) rulesByPedidoVideo.set(k, []);
        rulesByPedidoVideo.get(k)!.push(r);
      }

      const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '');
      const summarizeRules = (rs: any[]): string => {
        if (!rs || rs.length === 0) return 'Sem agendamento configurado';
        const parts = rs.map((r) => {
          const days = Array.isArray(r.days_of_week) && r.days_of_week.length
            ? r.days_of_week.map((d: number) => DAY_LABELS[d] ?? d).join('/')
            : 'Todos';
          const time = r.is_all_day ? '24h' : `${hhmm(r.start_time)}–${hhmm(r.end_time)}`;
          return `${days} ${time}`;
        });
        return parts.join(' · ');
      };


      // 5) Construir mapa de building -> online (mesma regra do useBuildingsPanelsStatus)
      type BuildingNet = { online: boolean; total: number; label: string };
      const buildingNet = new Map<string, BuildingNet>();
      buildings.forEach((b: any) => {
        const bd = devices.filter((d: any) => d.building_id === b.id);
        if (bd.length === 0) {
          buildingNet.set(b.id, { online: false, total: 0, label: 'Sem painel' });
          return;
        }
        const online = bd.some((d: any) => (d.status || '').toLowerCase() === 'online');
        buildingNet.set(b.id, {
          online,
          total: bd.length,
          label: online ? 'Online' : 'Offline',
        });
      });

      // 6) Montar linhas de vídeo (apenas selected_for_display)
      const pedidosById = new Map<string, any>(pedidosFiltered.map((p: any) => [p.id, p]));
      const allRows: ReportVideoRow[] = [];

      for (const pv of pedidoVideos) {
        const pedido = pedidosById.get(pv.pedido_id);
        if (!pedido) continue;
        if (!pv.selected_for_display) continue;
        const user = usersById.get(pedido.client_id);
        const qr = pv.qr_config || {};
        const selecionadoEm = pv.updated_at || pv.created_at || null;
        const video = pv.videos || {};
        const row: ReportVideoRow = {
          pedido_video_id: pv.id,
          pedido_id: pedido.id,
          video_id: pv.video_id,
          video_nome: video.nome || 'Sem título',
          video_url: video.url || '',
          video_duracao: video.duracao ?? null,
          orientacao: inferOrientacao(video.orientacao),
          slot_position: pv.slot_position ?? 0,
          approval_status: pv.approval_status || 'pending',
          is_active: !!pv.is_active,
          selected_for_display: true,
          qr_enabled: !!qr.enabled,
          qr_url: qr.redirect_url || null,
          selecionado_em: selecionadoEm,
          dias_em_exibicao: diffDays(selecionadoEm),
          schedule_summary: summarizeRules(rulesByPedidoVideo.get(scheduleKey(pedido.id, pv.video_id)) || []),
          plano_meses: pedido.plano_meses ?? null,
          valor_total: pedido.valor_total ?? null,
          data_inicio: pedido.data_inicio ?? null,
          data_fim: pedido.data_fim ?? null,
          client_id: pedido.client_id,
          client_name: buildClientName(user),
          client_email: user?.email || '—',
        };
        // Espalhar para cada prédio do pedido que esteja na lista elegível
        for (const buildingId of pedido.lista_predios || []) {
          if (!buildingIds.includes(buildingId)) continue;
          allRows.push({ ...row, pedido_video_id: `${pv.id}::${buildingId}` });
          // hack: garantir unicidade ao agrupar por prédio
          (allRows[allRows.length - 1] as any).__building_id = buildingId;
        }
      }

      // 7) Agrupar por prédio
      const buildingsReport: ReportBuilding[] = buildings.map((b: any) => {
        const rows = allRows.filter((r: any) => r.__building_id === b.id);
        const videosH = rows.filter((r) => r.orientacao === 'horizontal' || r.orientacao === 'desconhecida');
        const videosV = rows.filter((r) => r.orientacao === 'vertical');
        const pedidosAtivos = new Set(
          pedidosFiltered
            .filter((p: any) => (p.lista_predios || []).includes(b.id))
            .map((p: any) => p.id)
        );
        const net = buildingNet.get(b.id) ?? { online: false, total: 0, label: 'Sem painel' };
        return {
          id: b.id,
          nome: b.nome,
          codigo: b.codigo_predio || null,
          bairro: b.bairro || null,
          endereco: b.endereco || null,
          status: b.status,
          quantidade_telas: net.total || b.quantidade_telas || 0,
          online: net.online,
          online_label: net.label,
          videosH,
          videosV,
          pedidos_ativos_count: pedidosAtivos.size,
        };
      });

      // 8) Agrupar por cliente
      const clientsMap = new Map<string, ReportClient>();
      const clientVideoIds = new Map<string, Set<string>>();
      for (const r of allRows) {
        let c = clientsMap.get(r.client_id);
        if (!c) {
          c = {
            client_id: r.client_id,
            client_name: r.client_name,
            client_email: r.client_email,
            predios: [],
            total_videos: 0,
            total_videos_h: 0,
            total_videos_v: 0,
            pedidos: [],
          };
          clientsMap.set(r.client_id, c);
          clientVideoIds.set(r.client_id, new Set());
        }
        const bId = (r as any).__building_id;
        if (bId && !c.predios.find((p) => p.id === bId)) {
          const b = buildings.find((x: any) => x.id === bId);
          if (b) c.predios.push({ id: b.id, nome: b.nome });
        }
        // Conta vídeo único (1 vídeo em N prédios = 1 vídeo, não N)
        const seen = clientVideoIds.get(r.client_id)!;
        const pvKey = `${r.pedido_id}::${r.video_id}`;
        if (!seen.has(pvKey)) {
          seen.add(pvKey);
          c.total_videos += 1;
          if (r.orientacao === 'vertical') c.total_videos_v += 1;
          else c.total_videos_h += 1;
        }
        if (!c.pedidos.find((p) => p.pedido_id === r.pedido_id)) {
          c.pedidos.push({
            pedido_id: r.pedido_id,
            plano_meses: r.plano_meses,
            valor_total: r.valor_total,
            data_inicio: r.data_inicio,
            data_fim: r.data_fim,
          });
        }
      }
      const clients = Array.from(clientsMap.values()).sort(
        (a, b) => b.predios.length - a.predios.length
      );


      // 9) Alertas
      const alerts: ReportAlert[] = [];
      // Pedidos sem vídeo em exibição
      const pedidoHasDisplay = new Set(
        pedidoVideos.filter((pv: any) => pv.selected_for_display).map((pv: any) => pv.pedido_id)
      );
      for (const p of pedidosFiltered) {
        if (!pedidoHasDisplay.has(p.id)) {
          const u = usersById.get(p.client_id);
          alerts.push({
            type: 'pedido_sem_video',
            severity: 'red',
            title: `Pedido ativo sem vídeo em exibição`,
            description: `Cliente ${buildClientName(u)} (${u?.email || '—'}) — Pedido ${p.id.slice(0, 8)}…`,
            context: { pedido_id: p.id, client_id: p.client_id },
          });
        }
      }
      // Prédio offline com pedido ativo
      for (const b of buildingsReport) {
        if (!b.online && b.quantidade_telas > 0 && b.pedidos_ativos_count > 0) {
          alerts.push({
            type: 'predio_offline_com_pedido',
            severity: 'red',
            title: `Prédio offline com ${b.pedidos_ativos_count} pedido(s) ativo(s)`,
            description: `${b.nome}${b.codigo ? ` (${b.codigo})` : ''} — ${b.bairro || ''}`,
            context: { building_id: b.id },
          });
        }
      }

      // 10) KPIs e rankings — vídeos contados como ÚNICOS (1 vídeo em N prédios = 1)
      const uniqueDisplayed = pedidoVideos.filter((pv: any) => pv.selected_for_display);
      const totalVideos = uniqueDisplayed.length;
      const totalVideosV = uniqueDisplayed.filter(
        (pv: any) => inferOrientacao(pv.videos?.orientacao) === 'vertical'
      ).length;
      const totalVideosH = totalVideos - totalVideosV;
      const uniqueRowsWithDays = uniqueDisplayed
        .map((pv: any) => diffDays(pv.updated_at || pv.created_at))
        .filter((d: number) => d > 0);
      const tempoMedioDias = uniqueRowsWithDays.length
        ? Math.round(uniqueRowsWithDays.reduce((s: number, d: number) => s + d, 0) / uniqueRowsWithDays.length)
        : 0;

      const topClientes = clients
        .slice(0, 10)
        .map((c) => ({
          client_id: c.client_id,
          nome: c.client_name,
          predios_count: c.predios.length,
          videos_count: c.total_videos,
        }));
      const topPredios = [...buildingsReport]
        .sort((a, b) => b.videosH.length + b.videosV.length - (a.videosH.length + a.videosV.length))
        .slice(0, 10)
        .map((b) => ({
          id: b.id,
          nome: b.nome,
          videos_count: b.videosH.length + b.videosV.length,
        }));

      // 10.1) Pedidos ativos resumidos (contagem única H/V por pedido+video)
      const activeOrders: ReportActiveOrder[] = pedidosFiltered.map((p: any) => {
        const u = usersById.get(p.client_id);
        const pvs = (pedidoVideos as any[]).filter(
          (pv: any) => pv.pedido_id === p.id && pv.selected_for_display
        );
        const seenVid = new Set<string>();
        let h = 0, v = 0;
        for (const pv of pvs) {
          if (seenVid.has(pv.video_id)) continue;
          seenVid.add(pv.video_id);
          if (inferOrientacao(pv.videos?.orientacao) === 'vertical') v++;
          else h++;
        }
        const prediosCount = (p.lista_predios || []).filter((id: string) =>
          buildingIds.includes(id)
        ).length;
        return {
          pedido_id: p.id,
          client_id: p.client_id,
          client_name: buildClientName(u),
          client_email: u?.email || '—',
          plano_meses: p.plano_meses ?? null,
          data_inicio: p.data_inicio ?? null,
          data_fim: p.data_fim ?? null,
          predios_count: prediosCount,
          videos_total: h + v,
          videos_h: h,
          videos_v: v,
          has_display: h + v > 0,
        };
      }).sort((a, b) => b.videos_total - a.videos_total);

      const report: PlaylistReport = {
        generatedAt: new Date().toISOString(),
        buildings: buildingsReport.sort((a, b) => a.nome.localeCompare(b.nome)),
        clients,
        activeOrders,
        kpis: {
          totalPredios: buildingsReport.filter((b) => b.videosH.length + b.videosV.length > 0).length,
          totalClientes: clients.length,
          totalVideos,
          totalVideosH,
          totalVideosV,
          totalPedidos: pedidosFiltered.length,
          totalAlertas: alerts.length,
          tempoMedioDias,
        },
        rankings: { topClientes, topPredios },
        alerts,
      };

      setData(report);

      // 11) Auditoria (best-effort, não bloqueia)
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user?.id) {
          await (supabase as any).from('system_activity_feed').insert({
            user_id: auth.user.id,
            activity_type: 'report',
            action: 'playlist_report_generated',
            entity_type: 'playlist_report',
            details: {
              total_buildings: report.kpis.totalPredios,
              total_videos: report.kpis.totalVideos,
              total_alerts: report.kpis.totalAlertas,
              generated_at: report.generatedAt,
            },
            severity: 'info',
          });
        }
      } catch (e) {
        console.warn('[PlaylistReport] auditoria falhou (não bloqueante):', e);
      }
    } catch (e: any) {
      console.error('[useGlobalPlaylistReport] erro:', e);
      setError(e?.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}
