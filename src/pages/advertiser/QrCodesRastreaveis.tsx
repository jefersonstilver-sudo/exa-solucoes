import React, { useEffect, useMemo, useState } from 'react';
import { useEffectiveAuth as useAuth } from '@/hooks/useEffectiveAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  QrCode,
  Search,
  Building2,
  Video as VideoIcon,
  Calendar,
  Loader2,
  Link as LinkIcon,
  Clock,
  ChevronDown,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { getImageUrl } from '@/services/buildingStoreService';

interface QrLog {
  cliente_id?: string;
  nome_cliente?: string;
  titulo?: string;
  link?: string;
  data_hora?: string;
}

interface BuildingMini {
  id: string;
  nome: string;
  bairro?: string;
  foto?: string;
  cid: string;
}

interface VideoMini {
  id: string;
  nome: string;
  url: string;
  created_at: string;
}

interface Pedido {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  plano_meses: number;
  lista_predios: string[];
  videos: VideoMini[];
}

const SUPABASE_URL = 'https://aakenoljsycyrcrchgxj.supabase.co';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/qrcode-logs-proxy`;

const buildProxyUrl = (cids: string[], titulo: string) => {
  const url = new URL(PROXY_URL);
  url.searchParams.set('cliente_ids', cids.join(','));
  if (titulo.trim()) url.searchParams.set('titulo', titulo.trim());
  return url.toString();
};

/**
 * Interpreta o `data_hora` vindo da API externa de scans (18.228.252.149:8000),
 * que grava horário local de Brasília mas rotula como `+00:00` (UTC).
 * Solução: descartar o sufixo de fuso e tratar o valor como horário local.
 * NÃO usar para timestamps do nosso Postgres (esses já são UTC corretos).
 */
const parseScanDate = (iso?: string): Date | null => {
  if (!iso) return null;
  const naive = iso.replace(/(?:Z|[+-]\d{2}:?\d{2})$/, '');
  const d = new Date(naive);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateBR = (iso?: string) => {
  if (!iso) return '-';
  const d = parseScanDate(iso);
  if (!d) return iso || '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateShort = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const timeAgo = (iso?: string): string => {
  if (!iso) return '—';
  const d = parseScanDate(iso);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  return `há ${years} ano${years > 1 ? 's' : ''}`;
};

const daysSince = (iso?: string): number => {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
};

const ageBadge = (days: number) => {
  if (days <= 30) return { label: 'Recente', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  if (days <= 60)
    return { label: 'Considere renovar', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Vídeo antigo', cls: 'bg-[#C7141A]/10 text-[#C7141A] border-[#C7141A]/20' };
};

const deriveClienteId = (buildingUuid: string) =>
  buildingUuid.replace(/-/g, '').substring(0, 4);

const normalize = (s?: string) => (s || '').toLowerCase().trim();

const isPedidoAtivo = (p: Pedido): boolean => {
  if (!['ativo', 'video_aprovado', 'video_enviado', 'aguardando_video'].includes(p.status))
    return false;
  if (!p.data_fim) return true;
  return new Date(p.data_fim).getTime() >= Date.now();
};

const QrCodesRastreaveis: React.FC = () => {
  const { userProfile } = useAuth();
  const userId = userProfile?.id;

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [buildingsById, setBuildingsById] = useState<Record<string, BuildingMini>>({});
  const [buildingsByCid, setBuildingsByCid] = useState<Record<string, BuildingMini>>({});
  const [titulo, setTitulo] = useState('');
  const [predioFiltro, setPredioFiltro] = useState<string>('all');
  const [statusFiltro, setStatusFiltro] = useState<string>('all');
  const [logs, setLogs] = useState<QrLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega pedidos + vídeos + prédios do cliente
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoadingMeta(true);
      try {
        const { data: pedidosRaw } = await supabase
          .from('pedidos')
          .select('id, data_inicio, data_fim, status, plano_meses, lista_predios')
          .eq('client_id', userId)
          .order('data_inicio', { ascending: false });

        const pedidosArr = (pedidosRaw || []) as any[];
        const allBuildingIds = new Set<string>();
        pedidosArr.forEach((p) => (p.lista_predios || []).forEach((id: string) => allBuildingIds.add(id)));

        // Buscar buildings
        const { data: buildings } = await supabase
          .from('buildings')
          .select('id, nome, bairro, imagem_principal, imageurl, image_urls')
          .in('id', Array.from(allBuildingIds));

        const bById: Record<string, BuildingMini> = {};
        const bByCid: Record<string, BuildingMini> = {};
        (buildings || []).forEach((b: any) => {
          const rawFoto = b.imagem_principal || b.imageurl || (b.image_urls && b.image_urls[0]) || null;
          const cid = deriveClienteId(b.id);
          const mini: BuildingMini = {
            id: b.id,
            nome: b.nome,
            bairro: b.bairro,
            foto: rawFoto ? (getImageUrl(rawFoto) || undefined) : undefined,
            cid,
          };
          bById[b.id] = mini;
          bByCid[cid] = mini;
        });
        setBuildingsById(bById);
        setBuildingsByCid(bByCid);

        // Buscar pedido_videos + videos — só os marcados com QR rastreável (qr_config.enabled = true)
        const pedidoIds = pedidosArr.map((p) => p.id);
        let pedidoVideos: any[] = [];
        if (pedidoIds.length) {
          const { data } = await supabase
            .from('pedido_videos')
            .select('pedido_id, qr_config, videos(id, nome, url, created_at)')
            .in('pedido_id', pedidoIds);
          pedidoVideos = (data || []) as any[];
        }

        const videosByPedido: Record<string, VideoMini[]> = {};
        pedidoVideos.forEach((pv) => {
          const v = pv.videos;
          if (!v) return;
          // ⚡ Só vídeos marcados como QR rastreável no upload
          const qr = pv.qr_config as any;
          if (!qr || qr.enabled !== true) return;

          if (!videosByPedido[pv.pedido_id]) videosByPedido[pv.pedido_id] = [];
          if (!videosByPedido[pv.pedido_id].some((x) => x.id === v.id)) {
            videosByPedido[pv.pedido_id].push({
              id: v.id,
              nome: v.nome || 'Sem título',
              url: v.url || '',
              created_at: v.created_at,
            });
          }
        });

        // Pedidos sem nenhum vídeo rastreável são descartados
        const built: Pedido[] = pedidosArr
          .map((p) => ({
            id: p.id,
            data_inicio: p.data_inicio,
            data_fim: p.data_fim,
            status: p.status,
            plano_meses: p.plano_meses || 0,
            lista_predios: p.lista_predios || [],
            videos: videosByPedido[p.id] || [],
          }))
          .filter((p) => p.videos.length > 0);

        setPedidos(built);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar pedidos');
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [userId]);

  // Busca logs (todos os cid do cliente)
  useEffect(() => {
    const cids = Object.keys(buildingsByCid);
    if (cids.length === 0) {
      setLogs([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildProxyUrl(cids, titulo), { signal: controller.signal });
        const data = await res.json().catch(() => []);
        setLogs(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message || 'Erro ao buscar logs');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [buildingsByCid, titulo]);

  // Lista de prédios para filtro
  const prediosDisponiveis = useMemo(() => {
    return Object.values(buildingsById)
      .map((b) => ({ id: b.id, nome: b.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [buildingsById]);

  // Pedidos filtrados (por status / busca de título / prédio)
  const pedidosVisiveis = useMemo(() => {
    const tNorm = normalize(titulo);
    return pedidos.filter((p) => {
      // status
      if (statusFiltro === 'ativo' && !isPedidoAtivo(p)) return false;
      if (statusFiltro === 'encerrado' && isPedidoAtivo(p)) return false;

      // prédio (precisa estar contratado nesse pedido)
      if (predioFiltro !== 'all' && !p.lista_predios.includes(predioFiltro)) return false;

      // título (algum vídeo do pedido deve casar)
      if (tNorm) {
        const ok = p.videos.some((v) => normalize(v.nome).includes(tNorm));
        if (!ok) return false;
      }
      return true;
    });
  }, [pedidos, statusFiltro, predioFiltro, titulo]);

  // Estrutura agregada: pedido → vídeo → ranking de prédios
  type VideoStats = {
    video: VideoMini;
    scans: QrLog[];
    porPredio: { building: BuildingMini | null; nome: string; count: number }[];
    ultimoScan?: string;
  };
  type PedidoStats = {
    pedido: Pedido;
    totalScans: number;
    ultimoScan?: string;
    prediosComScan: number;
    videosStats: VideoStats[];
  };

  const dataset: PedidoStats[] = useMemo(() => {
    return pedidosVisiveis.map((p) => {
      const inicio = p.data_inicio ? new Date(p.data_inicio).getTime() : 0;
      const fim = p.data_fim ? new Date(p.data_fim).getTime() + 86400000 : Date.now() + 86400000;

      // Scans deste pedido = logs cujo título bate com algum vídeo do pedido E
      // cujo data_hora está no período do pedido
      const videosNorm = p.videos.map((v) => normalize(v.nome));

      const scansPedido = logs.filter((l) => {
        const t = normalize(l.titulo);
        if (!t) return false;
        const matchVideo = videosNorm.some((vn) => vn === t || vn.includes(t) || t.includes(vn));
        if (!matchVideo) return false;
        const ts = l.data_hora ? new Date(l.data_hora).getTime() : 0;
        if (!ts) return false;
        return ts >= inicio && ts <= fim;
      });

      // VideosStats
      const videosStats: VideoStats[] = p.videos.map((v) => {
        const vNorm = normalize(v.nome);
        const scans = scansPedido.filter((l) => {
          const t = normalize(l.titulo);
          return t === vNorm || vNorm.includes(t) || t.includes(vNorm);
        });

        // Ranking por prédio (todos os prédios do pedido)
        const porPredio = p.lista_predios.map((bid) => {
          const b = buildingsById[bid] || null;
          const cid = b?.cid || deriveClienteId(bid);
          const count = scans.filter((s) => s.cliente_id === cid).length;
          return { building: b, nome: b?.nome || 'Prédio', count };
        });
        porPredio.sort((a, b) => b.count - a.count);

        const ultimoScan = scans
          .map((s) => s.data_hora)
          .filter(Boolean)
          .sort()
          .pop();

        return { video: v, scans, porPredio, ultimoScan };
      });

      const ultimoScan = scansPedido
        .map((s) => s.data_hora)
        .filter(Boolean)
        .sort()
        .pop();

      const prediosComScan = new Set(scansPedido.map((s) => s.cliente_id).filter(Boolean)).size;

      return {
        pedido: p,
        totalScans: scansPedido.length,
        ultimoScan,
        prediosComScan,
        videosStats,
      };
    });
  }, [pedidosVisiveis, logs, buildingsById]);

  // Stats globais
  const globalStats = useMemo(() => {
    const totalScans = dataset.reduce((acc, d) => acc + d.totalScans, 0);
    const pedidosAtivos = dataset.filter((d) => isPedidoAtivo(d.pedido)).length;
    const prediosComScan = new Set(
      dataset.flatMap((d) => d.videosStats.flatMap((v) => v.scans.map((s) => s.cliente_id))).filter(Boolean),
    ).size;
    return { totalScans, pedidosAtivos, prediosComScan };
  }, [dataset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#C7141A]/10 text-[#C7141A]">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                QR Codes Rastreáveis
              </h1>
              <p className="text-sm text-slate-500">
                Veja onde seu público está engajando — agrupado por pedido e vídeo.
              </p>
            </div>
          </div>
        </div>

        {/* Stats globais */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-5 shadow-sm border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total de Scans</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{globalStats.totalScans}</p>
          </Card>
          <Card className="p-5 shadow-sm border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Pedidos Ativos</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{globalStats.pedidosAtivos}</p>
          </Card>
          <Card className="p-5 shadow-sm border-slate-200 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Prédios Engajados</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{globalStats.prediosComScan}</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4 shadow-sm border-slate-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por título do vídeo..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="pl-10 h-11 border-slate-200"
              />
            </div>
            <div className="md:w-56">
              <Select value={predioFiltro} onValueChange={setPredioFiltro}>
                <SelectTrigger className="h-11 border-slate-200">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <SelectValue placeholder="Filtrar por prédio" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os prédios</SelectItem>
                  {prediosDisponiveis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-44">
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="encerrado">Encerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="p-4 border-red-200 bg-red-50 text-red-700 text-sm">{error}</Card>
        )}

        {/* Lista de Pedidos */}
        {loading || loadingMeta ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#C7141A]" />
          </div>
        ) : dataset.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300 bg-white/50">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm text-slate-400 mt-1">
              Quando seus QR Codes forem escaneados, os dados aparecerão aqui agrupados por pedido.
            </p>
          </Card>
        ) : (
          <div className="space-y-5">
            {dataset.map((ps) => (
              <PedidoCard key={ps.pedido.id} ps={ps} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =================== PEDIDO CARD ===================
const PedidoCard: React.FC<{
  ps: {
    pedido: Pedido;
    totalScans: number;
    ultimoScan?: string;
    prediosComScan: number;
    videosStats: {
      video: VideoMini;
      scans: QrLog[];
      porPredio: { building: BuildingMini | null; nome: string; count: number }[];
      ultimoScan?: string;
    }[];
  };
}> = ({ ps }) => {
  const ativo = isPedidoAtivo(ps.pedido);
  const totalPredios = ps.pedido.lista_predios.length;
  const alcance = totalPredios > 0 ? Math.round((ps.prediosComScan / totalPredios) * 100) : 0;
  const shortId = ps.pedido.id.substring(0, 8);

  return (
    <Card className="p-6 shadow-sm border-slate-200 bg-white">
      {/* Header do pedido */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-slate-900">
              Pedido <span className="font-mono text-slate-500 text-base">#{shortId}</span>
            </h2>
            <Badge
              className={
                ativo
                  ? 'bg-[#C7141A]/10 text-[#C7141A] border-[#C7141A]/20 hover:bg-[#C7141A]/10'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  ativo ? 'bg-[#C7141A]' : 'bg-slate-400'
                }`}
              />
              {ativo ? 'Ativo' : 'Encerrado'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {formatDateShort(ps.pedido.data_inicio)} → {formatDateShort(ps.pedido.data_fim)}
            {ps.pedido.plano_meses ? ` · ${ps.pedido.plano_meses} mês(es)` : ''} ·{' '}
            {totalPredios} prédio(s) contratado(s)
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <Metric label="Scans no pedido" value={String(ps.totalScans)} />
        <Metric label="Último scan" value={ps.ultimoScan ? timeAgo(ps.ultimoScan) : '—'} />
        <Metric
          label="Prédios c/ scan"
          value={`${ps.prediosComScan} / ${totalPredios}`}
        />
        <Metric label="Alcance" value={`${alcance}%`} />
      </div>

      {/* Vídeos */}
      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
          Vídeos deste pedido ({ps.videosStats.length})
        </p>
        {ps.videosStats.length === 0 ? (
          <Card className="p-6 text-center border-dashed border-slate-200 bg-slate-50">
            <VideoIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhum vídeo associado a este pedido.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {ps.videosStats.map((vs) => (
              <VideoBlock key={vs.video.id} vs={vs} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{label}</p>
    <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
  </div>
);

// =================== VIDEO BLOCK ===================
const VideoBlock: React.FC<{
  vs: {
    video: VideoMini;
    scans: QrLog[];
    porPredio: { building: BuildingMini | null; nome: string; count: number }[];
    ultimoScan?: string;
  };
}> = ({ vs }) => {
  const [openTimeline, setOpenTimeline] = useState(false);
  const [openSemScan, setOpenSemScan] = useState(false);
  const days = daysSince(vs.video.created_at);
  const age = ageBadge(days);

  const comScan = vs.porPredio.filter((p) => p.count > 0);
  const semScan = vs.porPredio.filter((p) => p.count === 0);
  const maxCount = comScan[0]?.count || 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Thumb */}
        <div className="flex-shrink-0 w-full md:w-32 h-32 md:h-24 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
          {vs.video.url ? (
            <video
              src={vs.video.url}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <VideoIcon className="w-8 h-8 text-slate-500" />
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{vs.video.nome}</h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {days} dia(s) no sistema · subido em {formatDateShort(vs.video.created_at)}
              </p>
            </div>
            <Badge variant="outline" className={`${age.cls} text-[10px]`}>
              {age.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-[#C7141A]" />
              {vs.scans.length} scan(s)
            </span>
            <span className="text-slate-500 text-xs">
              último {vs.ultimoScan ? timeAgo(vs.ultimoScan) : '— sem registro'}
            </span>
          </div>

          {/* Ranking de prédios */}
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Onde foi escaneado
            </p>

            {comScan.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Ainda não houve scans deste vídeo no período do pedido.
              </p>
            ) : (
              <div className="space-y-1.5">
                {comScan.map((p, i) => {
                  const pct = vs.scans.length ? Math.round((p.count / vs.scans.length) * 100) : 0;
                  const barPct = (p.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-700 truncate font-medium">{p.nome}</span>
                          <span className="text-slate-500 tabular-nums flex-shrink-0 ml-2">
                            {p.count} · {pct}%
                          </span>
                        </div>
                        <Progress value={barPct} className="h-1.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sem scans (collapsible) */}
            {semScan.length > 0 && (
              <Collapsible open={openSemScan} onOpenChange={setOpenSemScan} className="mt-3">
                <CollapsibleTrigger className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors">
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${openSemScan ? 'rotate-180' : ''}`}
                  />
                  {semScan.length} prédio(s) contratado(s) sem scan ainda
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 pl-4 border-l-2 border-slate-100">
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {semScan.map((p, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100"
                      >
                        {p.nome}
                      </span>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Linha do tempo */}
          {vs.scans.length > 0 && (
            <Collapsible open={openTimeline} onOpenChange={setOpenTimeline} className="mt-4">
              <CollapsibleTrigger className="text-xs text-[#C7141A] hover:underline flex items-center gap-1">
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${openTimeline ? 'rotate-180' : ''}`}
                />
                Linha do tempo dos {vs.scans.length} scan(s)
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <Timeline scans={vs.scans} />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
};

// =================== TIMELINE ===================
const Timeline: React.FC<{ scans: QrLog[] }> = ({ scans }) => {
  const grouped = useMemo(() => {
    const map: Record<string, QrLog[]> = {};
    [...scans]
      .sort((a, b) => (b.data_hora || '').localeCompare(a.data_hora || ''))
      .forEach((s) => {
        const d = s.data_hora ? new Date(s.data_hora) : null;
        const key = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : 'Sem data';
        if (!map[key]) map[key] = [];
        map[key].push(s);
      });
    return Object.entries(map);
  }, [scans]);

  return (
    <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
      {grouped.map(([day, items]) => (
        <div key={day}>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
            {day}
          </p>
          <div className="space-y-1">
            {items.map((s, i) => {
              const d = s.data_hora ? new Date(s.data_hora) : null;
              const hora = d
                ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                : '—';
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-slate-600 py-1 border-b border-slate-50 last:border-0"
                >
                  <span className="font-mono text-slate-400 w-12">{hora}</span>
                  <span className="text-slate-300">→</span>
                  <span className="truncate">{s.nome_cliente || '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QrCodesRastreaveis;
