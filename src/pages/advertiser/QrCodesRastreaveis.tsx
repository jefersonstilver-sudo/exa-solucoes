import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Search, Building2, Video as VideoIcon, Calendar, Loader2, Link as LinkIcon } from 'lucide-react';
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
}

interface VideoMini {
  id: string;
  nome: string;
  url: string;
}

const SUPABASE_URL = 'https://aakenoljsycyrcrchgxj.supabase.co';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/qrcode-logs-proxy`;

const buildProxyUrl = (cids: string[], titulo: string) => {
  const url = new URL(PROXY_URL);
  url.searchParams.set('cliente_ids', cids.join(','));
  if (titulo.trim()) url.searchParams.set('titulo', titulo.trim());
  return url.toString();
};

const formatDateBR = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const deriveClienteId = (buildingUuid: string) =>
  buildingUuid.replace(/-/g, '').substring(0, 4);

const QrCodesRastreaveis: React.FC = () => {
  const { userProfile } = useAuth();
  const userId = userProfile?.id;

  const [clienteIds, setClienteIds] = useState<string[]>([]);
  const [buildingsByCid, setBuildingsByCid] = useState<Record<string, BuildingMini>>({});
  const [videos, setVideos] = useState<VideoMini[]>([]);
  const [titulo, setTitulo] = useState('');
  const [logs, setLogs] = useState<QrLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega prédios e vídeos do cliente
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('client_id', userId);

        const buildingIds = new Set<string>();
        (pedidos || []).forEach((p: any) => {
          (p.lista_predios || []).forEach((id: string) => buildingIds.add(id));
        });
        const buildingIdArr = Array.from(buildingIds);

        const { data: buildings } = await supabase
          .from('buildings')
          .select('id, nome, bairro, imagem_principal, imageurl, image_urls')
          .in('id', buildingIdArr);

        const map: Record<string, BuildingMini> = {};
        (buildings || []).forEach((b: any) => {
          const rawFoto = b.imagem_principal || b.imageurl || (b.image_urls && b.image_urls[0]) || null;
          map[deriveClienteId(b.id)] = {
            id: b.id,
            nome: b.nome,
            bairro: b.bairro,
            foto: rawFoto ? (getImageUrl(rawFoto) || undefined) : undefined,
          };
        });
        setBuildingsByCid(map);
        setClienteIds(Array.from(new Set(buildingIdArr.map(deriveClienteId))));

        const { data: vids } = await supabase
          .from('videos')
          .select('id, nome, url')
          .eq('client_id', userId);
        setVideos((vids as VideoMini[]) || []);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar dados');
      }
    })();
  }, [userId]);

  // Busca logs
  useEffect(() => {
    if (clienteIds.length === 0) {
      setLogs([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildProxyUrl(clienteIds, titulo), { signal: controller.signal });
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
  }, [clienteIds, titulo]);

  // Match vídeo pelo título do log (case-insensitive, contém)
  const findVideo = (logTitulo?: string): VideoMini | undefined => {
    if (!logTitulo) return undefined;
    const t = logTitulo.toLowerCase().trim();
    return videos.find(
      (v) => v.nome?.toLowerCase().includes(t) || t.includes(v.nome?.toLowerCase() || '__none__')
    );
  };

  // Estatísticas
  const stats = useMemo(() => {
    const totalCliques = logs.length;
    const titulosUnicos = new Set(logs.map((l) => l.titulo).filter(Boolean)).size;
    const prediosAtivos = new Set(logs.map((l) => l.cliente_id).filter(Boolean)).size;
    return { totalCliques, titulosUnicos, prediosAtivos };
  }, [logs]);

  // Filtro por prédio (cliente_id)
  const [predioFiltro, setPredioFiltro] = useState<string>('all');

  // Agrupa logs por prédio (cliente_id)
  const grupos = useMemo(() => {
    const map = new Map<string, { cliente_id: string; titulo?: string; nome_cliente?: string; link?: string; horarios: string[] }>();
    logs.forEach((l) => {
      const key = l.cliente_id || 'unknown';
      if (predioFiltro !== 'all' && key !== predioFiltro) return;
      const existing = map.get(key);
      if (existing) {
        if (l.data_hora) existing.horarios.push(l.data_hora);
      } else {
        map.set(key, {
          cliente_id: key,
          titulo: l.titulo,
          nome_cliente: l.nome_cliente,
          link: l.link,
          horarios: l.data_hora ? [l.data_hora] : [],
        });
      }
    });
    // Ordena horários desc
    return Array.from(map.values())
      .map((g) => ({ ...g, horarios: g.horarios.sort((a, b) => (a < b ? 1 : -1)) }))
      .sort((a, b) => b.horarios.length - a.horarios.length);
  }, [logs, predioFiltro]);

  // Lista de prédios disponíveis no filtro (a partir dos logs)
  const prediosDisponiveis = useMemo(() => {
    const ids = Array.from(new Set(logs.map((l) => l.cliente_id).filter(Boolean))) as string[];
    return ids.map((cid) => ({
      cid,
      nome: buildingsByCid[cid]?.nome || cid,
    }));
  }, [logs, buildingsByCid]);

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
                Acompanhe os cliques nos QR Codes das suas campanhas em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-5 shadow-sm border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total de Cliques</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCliques}</p>
          </Card>
          <Card className="p-5 shadow-sm border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Campanhas Ativas</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.titulosUnicos}</p>
          </Card>
          <Card className="p-5 shadow-sm border-slate-200 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Prédios c/ Cliques</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.prediosAtivos}</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4 shadow-sm border-slate-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por título da campanha..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="pl-10 h-11 border-slate-200"
              />
            </div>
            <select
              value={predioFiltro}
              onChange={(e) => setPredioFiltro(e.target.value)}
              className="h-11 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 md:w-64"
            >
              <option value="all">Todos os prédios</option>
              {prediosDisponiveis.map((p) => (
                <option key={p.cid} value={p.cid}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </Card>
        )}

        {/* Grupos */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#C7141A]" />
          </div>
        ) : grupos.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300 bg-white/50">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Nenhum clique registrado ainda</p>
            <p className="text-sm text-slate-400 mt-1">
              Os cliques nos seus QR Codes aparecerão aqui.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {grupos.map((g) => {
              const building = buildingsByCid[g.cliente_id];
              const video = findVideo(g.titulo);
              return (
                <Card
                  key={g.cliente_id}
                  className="p-5 shadow-sm hover:shadow-md transition-shadow border-slate-200"
                >
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Foto prédio */}
                    <div className="flex-shrink-0 w-full md:w-40 h-32 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      {building?.foto ? (
                        <img
                          src={building.foto}
                          alt={building.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-10 h-10 text-slate-300" />
                      )}
                    </div>

                    {/* Vídeo */}
                    <div className="flex-shrink-0 w-full md:w-48 h-32 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                      {video?.url ? (
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          autoPlay
                          loop
                          preload="metadata"
                        />
                      ) : (
                        <VideoIcon className="w-10 h-10 text-slate-600" />
                      )}
                    </div>

                    {/* Info + Horários */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg text-slate-900 truncate">
                            {building?.nome || g.nome_cliente || g.cliente_id}
                          </h3>
                          {building?.bairro && (
                            <p className="text-xs text-slate-500">{building.bairro}</p>
                          )}
                        </div>
                        <Badge className="bg-[#C7141A]/10 text-[#C7141A] hover:bg-[#C7141A]/15 border-0">
                          {g.horarios.length} {g.horarios.length === 1 ? 'clique' : 'cliques'}
                        </Badge>
                      </div>

                      {g.titulo && (
                        <p className="text-sm text-slate-600 mt-1 truncate">
                          <span className="text-slate-400">Campanha:</span> {g.titulo}
                        </p>
                      )}

                      {g.link && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs">
                          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#C7141A] mt-0.5" />
                          <a
                            href={g.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#C7141A] hover:underline break-all font-mono"
                          >
                            {g.link}
                          </a>
                        </div>
                      )}

                      {/* Lista de horários */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Escaneamentos
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {g.horarios.length === 0 ? (
                            <span className="text-xs text-slate-400">Sem horário registrado</span>
                          ) : (
                            g.horarios.map((h, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-mono"
                              >
                                {formatDateBR(h)}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QrCodesRastreaveis;
