import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  QrCode,
  Search,
  Loader2,
  Download,
  RefreshCw,
  Building2,
  Video as VideoIcon,
  Users,
  Calendar,
  AlertTriangle,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import {
  QrScanLog,
  deriveClienteId,
  parseScanDate,
  formatDateBR,
  timeAgo,
  normalize,
  toCSV,
  downloadCSV,
} from '@/utils/qrScans';

const SUPABASE_URL = 'https://aakenoljsycyrcrchgxj.supabase.co';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/qrcode-logs-proxy`;

interface BuildingMini {
  id: string;
  nome: string;
  bairro?: string;
  cidade?: string;
  cid: string;
}
interface VideoMini {
  id: string;
  nome: string;
  pedido_id: string;
}
interface PedidoMini {
  id: string;
  client_id?: string;
  nome_pedido?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  lista_predios: string[];
}
interface ClienteMini {
  id: string;
  nome?: string;
  email?: string;
}

interface ResolvedScan extends QrScanLog {
  buildings: BuildingMini[]; // pode ter +1 por colisão de CID
  matchedVideos: VideoMini[];
  matchedPedidos: PedidoMini[];
  clientes: ClienteMini[];
  orphan: boolean;
  dt: Date | null;
}

const STATUS_COLORS: Record<string, string> = {
  ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  encerrado: 'bg-slate-100 text-slate-600 border-slate-200',
};

const QrScansAdminPage: React.FC = () => {
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingScans, setLoadingScans] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [buildings, setBuildings] = useState<BuildingMini[]>([]);
  const [videos, setVideos] = useState<VideoMini[]>([]);
  const [pedidos, setPedidos] = useState<PedidoMini[]>([]);
  const [clientes, setClientes] = useState<ClienteMini[]>([]);
  const [scans, setScans] = useState<QrScanLog[]>([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState<string>('all');
  const [predioFiltro, setPredioFiltro] = useState<string>('all');
  const [tituloFiltro, setTituloFiltro] = useState<string>('');
  const [periodo, setPeriodo] = useState<'7' | '30' | '90' | '365' | 'all'>('all');
  const [refreshTick, setRefreshTick] = useState(0);

  // 1) Carrega metadados
  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      try {
        // pedido_videos com qr_config.enabled = true
        const { data: pvs } = await (supabase as any)
          .from('pedido_videos')
          .select('pedido_id, qr_config, videos(id, nome)')
          .not('qr_config', 'is', null);

        const pvList = (pvs || []).filter(
          (pv: any) => pv.qr_config && pv.qr_config.enabled === true && pv.videos,
        );

        const videosArr: VideoMini[] = [];
        const pedidoIds = new Set<string>();
        const seenVid = new Set<string>();
        pvList.forEach((pv: any) => {
          pedidoIds.add(pv.pedido_id);
          const k = `${pv.pedido_id}:${pv.videos.id}`;
          if (seenVid.has(k)) return;
          seenVid.add(k);
          videosArr.push({
            id: pv.videos.id,
            nome: pv.videos.nome || 'Sem título',
            pedido_id: pv.pedido_id,
          });
        });

        // pedidos correspondentes
        let pedidosArr: PedidoMini[] = [];
        if (pedidoIds.size > 0) {
          const { data: pedidosRaw } = await (supabase as any)
            .from('pedidos')
            .select('id, client_id, nome_pedido, data_inicio, data_fim, status, lista_predios')
            .in('id', Array.from(pedidoIds));
          pedidosArr = (pedidosRaw || []).map((p: any) => ({
            id: p.id,
            client_id: p.client_id,
            nome_pedido: p.nome_pedido,
            data_inicio: p.data_inicio,
            data_fim: p.data_fim,
            status: p.status,
            lista_predios: p.lista_predios || [],
          }));
        }

        // buildings de todos esses pedidos
        const allBuildingIds = new Set<string>();
        pedidosArr.forEach((p) => p.lista_predios.forEach((id) => allBuildingIds.add(id)));

        let buildingsArr: BuildingMini[] = [];
        if (allBuildingIds.size > 0) {
          const { data: bs } = await (supabase as any)
            .from('buildings')
            .select('id, nome, bairro, cidade')
            .in('id', Array.from(allBuildingIds));
          buildingsArr = (bs || []).map((b: any) => ({
            id: b.id,
            nome: b.nome,
            bairro: b.bairro,
            cidade: b.cidade,
            cid: deriveClienteId(b.id),
          }));
        }

        // clientes
        const clientIds = Array.from(
          new Set(pedidosArr.map((p) => p.client_id).filter(Boolean)),
        ) as string[];
        let clientesArr: ClienteMini[] = [];
        if (clientIds.length > 0) {
          const { data: us } = await (supabase as any)
            .from('users')
            .select('id, nome, email')
            .in('id', clientIds);
          clientesArr = (us || []).map((u: any) => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
          }));
        }

        setVideos(videosArr);
        setPedidos(pedidosArr);
        setBuildings(buildingsArr);
        setClientes(clientesArr);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar metadados');
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  // 2) Carrega scans (todos os cids do sistema)
  useEffect(() => {
    if (buildings.length === 0) return;
    const cids = Array.from(new Set(buildings.map((b) => b.cid)));
    if (cids.length === 0) return;

    const ctrl = new AbortController();
    (async () => {
      setLoadingScans(true);
      setError(null);
      try {
        const url = new URL(PROXY_URL);
        url.searchParams.set('cliente_ids', cids.join(','));
        const res = await fetch(url.toString(), { signal: ctrl.signal });
        const data = await res.json().catch(() => []);
        setScans(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e?.message || 'Erro ao carregar scans');
      } finally {
        setLoadingScans(false);
      }
    })();
    return () => ctrl.abort();
  }, [buildings, refreshTick]);

  // Auto-refresh a cada 60s
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Índices
  const buildingsByCid = useMemo(() => {
    const map: Record<string, BuildingMini[]> = {};
    buildings.forEach((b) => {
      (map[b.cid] = map[b.cid] || []).push(b);
    });
    return map;
  }, [buildings]);

  const buildingById = useMemo(() => {
    const map: Record<string, BuildingMini> = {};
    buildings.forEach((b) => (map[b.id] = b));
    return map;
  }, [buildings]);

  const clienteById = useMemo(() => {
    const map: Record<string, ClienteMini> = {};
    clientes.forEach((c) => (map[c.id] = c));
    return map;
  }, [clientes]);

  const pedidosByBuildingId = useMemo(() => {
    const map: Record<string, PedidoMini[]> = {};
    pedidos.forEach((p) => {
      p.lista_predios.forEach((bid) => {
        (map[bid] = map[bid] || []).push(p);
      });
    });
    return map;
  }, [pedidos]);

  const videosByPedidoId = useMemo(() => {
    const map: Record<string, VideoMini[]> = {};
    videos.forEach((v) => {
      (map[v.pedido_id] = map[v.pedido_id] || []).push(v);
    });
    return map;
  }, [videos]);

  // Resolução de scans
  const resolvedAll: ResolvedScan[] = useMemo(() => {
    return scans.map((s) => {
      const dt = parseScanDate(s.data_hora);
      const cidBuildings = buildingsByCid[s.cliente_id || ''] || [];
      const tNorm = normalize(s.titulo);

      // Match videos pelos prédios encontrados via cid
      const matchedPedidos: PedidoMini[] = [];
      const matchedVideos: VideoMini[] = [];
      const seenPed = new Set<string>();
      const seenVid = new Set<string>();
      cidBuildings.forEach((b) => {
        (pedidosByBuildingId[b.id] || []).forEach((p) => {
          const vs = videosByPedidoId[p.id] || [];
          // janela do pedido
          const inicio = p.data_inicio ? new Date(p.data_inicio).getTime() : 0;
          const fim = p.data_fim
            ? new Date(p.data_fim).getTime() + 86400000
            : Date.now() + 86400000;
          const ts = dt ? dt.getTime() : 0;
          const dentro = ts === 0 || (ts >= inicio && ts <= fim);

          vs.forEach((v) => {
            const vn = normalize(v.nome);
            const ok = vn && tNorm && (vn === tNorm || vn.includes(tNorm) || tNorm.includes(vn));
            if (ok && dentro) {
              if (!seenPed.has(p.id)) {
                seenPed.add(p.id);
                matchedPedidos.push(p);
              }
              if (!seenVid.has(v.id)) {
                seenVid.add(v.id);
                matchedVideos.push(v);
              }
            }
          });
        });
      });

      const clientesSet = new Set<string>();
      const clientesArr: ClienteMini[] = [];
      matchedPedidos.forEach((p) => {
        if (p.client_id && !clientesSet.has(p.client_id)) {
          clientesSet.add(p.client_id);
          clientesArr.push(clienteById[p.client_id] || { id: p.client_id });
        }
      });

      const orphan = cidBuildings.length === 0 || matchedVideos.length === 0;

      return {
        ...s,
        buildings: cidBuildings,
        matchedVideos,
        matchedPedidos,
        clientes: clientesArr,
        orphan,
        dt,
      };
    });
  }, [scans, buildingsByCid, pedidosByBuildingId, videosByPedidoId, clienteById]);

  // Aplica filtros
  const resolved: ResolvedScan[] = useMemo(() => {
    const now = Date.now();
    const cutoff =
      periodo === 'all' ? 0 : now - parseInt(periodo, 10) * 86400000;
    const sNorm = normalize(search);
    const tNorm = normalize(tituloFiltro);

    return resolvedAll.filter((r) => {
      if (cutoff > 0) {
        if (!r.dt || r.dt.getTime() < cutoff) return false;
      }
      if (clienteFiltro !== 'all') {
        if (!r.clientes.some((c) => c.id === clienteFiltro)) return false;
      }
      if (predioFiltro !== 'all') {
        if (!r.buildings.some((b) => b.id === predioFiltro)) return false;
      }
      if (tNorm) {
        if (!normalize(r.titulo).includes(tNorm)) return false;
      }
      if (sNorm) {
        const hay = [
          r.titulo,
          r.link,
          r.cliente_id,
          r.nome_cliente,
          ...r.buildings.map((b) => b.nome),
          ...r.buildings.map((b) => b.bairro),
          ...r.matchedVideos.map((v) => v.nome),
          ...r.clientes.map((c) => c.nome),
          ...r.clientes.map((c) => c.email),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(sNorm)) return false;
      }
      return true;
    });
  }, [resolvedAll, periodo, clienteFiltro, predioFiltro, tituloFiltro, search]);

  const resolvedSorted = useMemo(
    () =>
      [...resolved].sort((a, b) => {
        const ta = a.dt?.getTime() || 0;
        const tb = b.dt?.getTime() || 0;
        return tb - ta;
      }),
    [resolved],
  );

  // KPIs
  const kpis = useMemo(() => {
    const now = Date.now();
    const total = resolved.length;
    const hoje = resolved.filter((r) => {
      if (!r.dt) return false;
      const d = r.dt;
      const today = new Date();
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }).length;
    const d7 = resolved.filter((r) => r.dt && r.dt.getTime() >= now - 7 * 86400000).length;
    const d30 = resolved.filter((r) => r.dt && r.dt.getTime() >= now - 30 * 86400000).length;
    const prediosSet = new Set<string>();
    const videosSet = new Set<string>();
    const clientesSet = new Set<string>();
    resolved.forEach((r) => {
      r.buildings.forEach((b) => prediosSet.add(b.id));
      r.matchedVideos.forEach((v) => videosSet.add(v.id));
      r.clientes.forEach((c) => clientesSet.add(c.id));
    });
    const orphans = resolved.filter((r) => r.orphan).length;
    return {
      total,
      hoje,
      d7,
      d30,
      predios: prediosSet.size,
      videos: videosSet.size,
      clientes: clientesSet.size,
      orphans,
    };
  }, [resolved]);

  // Rankings
  const rankClientes = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; email?: string; count: number; last?: Date | null }>();
    resolved.forEach((r) => {
      r.clientes.forEach((c) => {
        const k = c.id;
        const cur = map.get(k) || { id: c.id, nome: c.nome || '(sem nome)', email: c.email, count: 0, last: null };
        cur.count++;
        if (r.dt && (!cur.last || r.dt > cur.last)) cur.last = r.dt;
        map.set(k, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [resolved]);

  const rankPredios = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; bairro?: string; cid: string; count: number; last?: Date | null }>();
    resolved.forEach((r) => {
      r.buildings.forEach((b) => {
        const cur = map.get(b.id) || {
          id: b.id,
          nome: b.nome,
          bairro: b.bairro,
          cid: b.cid,
          count: 0,
          last: null,
        };
        // divide o scan entre os prédios que compartilham CID? Não — contamos cheio.
        cur.count++;
        if (r.dt && (!cur.last || r.dt > cur.last)) cur.last = r.dt;
        map.set(b.id, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [resolved]);

  const rankVideos = useMemo(() => {
    const map = new Map<string, { titulo: string; count: number; last?: Date | null }>();
    resolved.forEach((r) => {
      const key = normalize(r.titulo) || '(sem título)';
      const cur = map.get(key) || { titulo: r.titulo || '(sem título)', count: 0, last: null };
      cur.count++;
      if (r.dt && (!cur.last || r.dt > cur.last)) cur.last = r.dt;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [resolved]);

  // Export CSV (todos os scans filtrados)
  const exportCSV = () => {
    const rows = resolvedSorted.map((r) => ({
      data_hora: r.data_hora || '',
      data_local: r.dt ? formatDateBR(r.data_hora) : '',
      cid: r.cliente_id || '',
      titulo: r.titulo || '',
      link: r.link || '',
      predios: r.buildings.map((b) => b.nome).join(' | '),
      bairros: r.buildings.map((b) => b.bairro || '').join(' | '),
      videos: r.matchedVideos.map((v) => v.nome).join(' | '),
      clientes: r.clientes.map((c) => c.nome || c.email || c.id).join(' | '),
      orphan: r.orphan ? 'sim' : 'não',
    }));
    const csv = toCSV(rows, [
      'data_hora',
      'data_local',
      'cid',
      'titulo',
      'link',
      'predios',
      'bairros',
      'videos',
      'clientes',
      'orphan',
    ]);
    downloadCSV(`qr-scans-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  // UI
  const prediosOrdenados = useMemo(
    () => [...buildings].sort((a, b) => a.nome.localeCompare(b.nome)),
    [buildings],
  );
  const clientesOrdenados = useMemo(
    () => [...clientes].sort((a, b) => (a.nome || a.email || '').localeCompare(b.nome || b.email || '')),
    [clientes],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-[1500px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#C7141A]/10 text-[#C7141A]">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Scans de QR Code
              </h1>
              <p className="text-sm text-slate-500">
                Todos os scans rastreados — clientes, prédios e vídeos. Atualiza a cada 60s.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRefreshTick((x) => x + 1)} disabled={loadingScans}>
              {loadingScans ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Atualizar</span>
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={resolved.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard label="Total" value={kpis.total} />
          <KpiCard label="Hoje" value={kpis.hoje} />
          <KpiCard label="7 dias" value={kpis.d7} />
          <KpiCard label="30 dias" value={kpis.d30} />
          <KpiCard label="Prédios" value={kpis.predios} icon={<Building2 className="w-4 h-4" />} />
          <KpiCard label="Vídeos" value={kpis.videos} icon={<VideoIcon className="w-4 h-4" />} />
          <KpiCard label="Clientes" value={kpis.clientes} icon={<Users className="w-4 h-4" />} />
        </div>

        {/* Filtros */}
        <Card className="p-4 shadow-sm border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar (cliente, prédio, vídeo, cid, link)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Filtrar por título do vídeo"
              value={tituloFiltro}
              onChange={(e) => setTituloFiltro(e.target.value)}
            />
            <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos clientes</SelectItem>
                {clientesOrdenados.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome || c.email || c.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={predioFiltro} onValueChange={setPredioFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Prédio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos prédios</SelectItem>
                {prediosOrdenados.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nome} {b.bairro ? `· ${b.bairro}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {error && (
          <Card className="p-4 border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </Card>
        )}

        {loadingMeta ? (
          <Card className="p-10 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Carregando metadados…
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="all">Todos os scans ({resolved.length})</TabsTrigger>
              <TabsTrigger value="clientes">Por cliente ({rankClientes.length})</TabsTrigger>
              <TabsTrigger value="predios">Por prédio ({rankPredios.length})</TabsTrigger>
              <TabsTrigger value="videos">Por vídeo ({rankVideos.length})</TabsTrigger>
              <TabsTrigger value="orphans">
                Órfãos ({kpis.orphans})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScanTable scans={resolvedSorted} loading={loadingScans} />
            </TabsContent>

            <TabsContent value="clientes" className="mt-4">
              <Card className="overflow-hidden">
                <RankTable
                  headers={['#', 'Cliente', 'Email', 'Scans', 'Último']}
                  rows={rankClientes.map((c, i) => [
                    String(i + 1),
                    c.nome,
                    c.email || '—',
                    String(c.count),
                    c.last ? timeAgo(c.last.toISOString()) : '—',
                  ])}
                />
              </Card>
            </TabsContent>

            <TabsContent value="predios" className="mt-4">
              <Card className="overflow-hidden">
                <RankTable
                  headers={['#', 'Prédio', 'Bairro', 'CID', 'Scans', 'Último']}
                  rows={rankPredios.map((b, i) => [
                    String(i + 1),
                    b.nome,
                    b.bairro || '—',
                    b.cid,
                    String(b.count),
                    b.last ? timeAgo(b.last.toISOString()) : '—',
                  ])}
                />
              </Card>
            </TabsContent>

            <TabsContent value="videos" className="mt-4">
              <Card className="overflow-hidden">
                <RankTable
                  headers={['#', 'Vídeo (título)', 'Scans', 'Último']}
                  rows={rankVideos.map((v, i) => [
                    String(i + 1),
                    v.titulo,
                    String(v.count),
                    v.last ? timeAgo(v.last.toISOString()) : '—',
                  ])}
                />
              </Card>
            </TabsContent>

            <TabsContent value="orphans" className="mt-4">
              <Card className="p-4 mb-3 bg-amber-50 border-amber-200 text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Scans cujo CID não corresponde a nenhum prédio cadastrado <b>ou</b> cujo título
                não casa com nenhum vídeo rastreável. Nenhum scan é descartado — eles ficam aqui
                para auditoria.
              </Card>
              <ScanTable scans={resolvedSorted.filter((r) => r.orphan)} loading={loadingScans} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: number; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <Card className="p-4 shadow-sm border-slate-200">
    <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wide">
      {icon} {label}
    </div>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value.toLocaleString('pt-BR')}</p>
  </Card>
);

const ScanTable: React.FC<{ scans: ResolvedScan[]; loading: boolean }> = ({ scans, loading }) => {
  const [page, setPage] = useState(0);
  const PAGE = 100;
  const totalPages = Math.max(1, Math.ceil(scans.length / PAGE));
  const slice = scans.slice(page * PAGE, page * PAGE + PAGE);

  useEffect(() => {
    setPage(0);
  }, [scans.length]);

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Data / Hora</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Prédio(s)</th>
              <th className="text-left px-4 py-3">Vídeo</th>
              <th className="text-left px-4 py-3">CID</th>
              <th className="text-left px-4 py-3">Link</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && slice.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Carregando scans…
                </td>
              </tr>
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Nenhum scan encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              slice.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-2 align-top whitespace-nowrap">
                    <div className="font-medium text-slate-900">{formatDateBR(r.data_hora)}</div>
                    <div className="text-xs text-slate-500">{timeAgo(r.data_hora)}</div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    {r.clientes.length === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      r.clientes.map((c) => (
                        <div key={c.id} className="text-slate-900">
                          {c.nome || c.email || c.id.slice(0, 8)}
                        </div>
                      ))
                    )}
                  </td>
                  <td className="px-4 py-2 align-top">
                    {r.buildings.length === 0 ? (
                      <span className="text-slate-400">CID sem prédio</span>
                    ) : (
                      r.buildings.map((b) => (
                        <div key={b.id} className="text-slate-900">
                          <Building2 className="w-3 h-3 inline mr-1 text-slate-400" />
                          {b.nome}
                          {b.bairro ? (
                            <span className="text-xs text-slate-500"> · {b.bairro}</span>
                          ) : null}
                        </div>
                      ))
                    )}
                    {r.buildings.length > 1 && (
                      <Badge variant="outline" className="mt-1 text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                        CID compartilhado entre {r.buildings.length} prédios
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <div className="text-slate-900">{r.titulo || '—'}</div>
                    {r.matchedVideos.length > 1 && (
                      <div className="text-xs text-slate-500">
                        {r.matchedVideos.length} matches
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top font-mono text-xs text-slate-700">
                    {r.cliente_id || '—'}
                  </td>
                  <td className="px-4 py-2 align-top">
                    {r.link ? (
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C7141A] hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <LinkIcon className="w-3 h-3" />
                        abrir
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 align-top">
                    {r.orphan ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Órfão
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        OK
                      </Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {scans.length > PAGE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-sm">
          <span className="text-slate-600">
            Página {page + 1} de {totalPages} · {scans.length.toLocaleString('pt-BR')} scans
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

const RankTable: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left px-4 py-3">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-4 py-10 text-center text-slate-500">
              Sem dados.
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/60">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2 text-slate-800">
                  {c}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default QrScansAdminPage;
