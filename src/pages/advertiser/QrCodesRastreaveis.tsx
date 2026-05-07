import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [predioFiltro, setPredioFiltro] = useState<string>('all');
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

  // Lista de prédios disponíveis (ordenada)
  const prediosDisponiveis = useMemo(() => {
    return Object.entries(buildingsByCid)
      .map(([cid, b]) => ({ cid, nome: b.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [buildingsByCid]);

  // Filtra logs por prédio selecionado
  const logsFiltrados = useMemo(() => {
    if (predioFiltro === 'all') return logs;
    return logs.filter((l) => l.cliente_id === predioFiltro);
  }, [logs, predioFiltro]);

  // Agrupa logs por título para estatísticas
  const stats = useMemo(() => {
    const totalCliques = logsFiltrados.length;
    const titulosUnicos = new Set(logsFiltrados.map((l) => l.titulo).filter(Boolean)).size;
    const prediosAtivos = new Set(logsFiltrados.map((l) => l.cliente_id).filter(Boolean)).size;
    return { totalCliques, titulosUnicos, prediosAtivos };
  }, [logsFiltrados]);

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

        {/* Search + Filtro Prédio */}
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
            <div className="md:w-64">
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
                    <SelectItem key={p.cid} value={p.cid}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </Card>
        )}

        {/* Logs */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#C7141A]" />
          </div>
        ) : logsFiltrados.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300 bg-white/50">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Nenhum clique registrado ainda</p>
            <p className="text-sm text-slate-400 mt-1">
              Os cliques nos seus QR Codes aparecerão aqui.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {logsFiltrados.map((log, i) => {
              const building = log.cliente_id ? buildingsByCid[log.cliente_id] : undefined;
              const video = findVideo(log.titulo);
              return (
                <Card
                  key={i}
                  className="p-4 shadow-sm hover:shadow-md transition-shadow border-slate-200"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Foto prédio */}
                    <div className="flex-shrink-0 w-full md:w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      {building?.foto ? (
                        <img
                          src={building.foto}
                          alt={building.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-300" />
                      )}
                    </div>

                    {/* Vídeo miniatura */}
                    <div className="flex-shrink-0 w-full md:w-32 h-24 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
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
                        <VideoIcon className="w-8 h-8 text-slate-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 truncate">
                          {log.titulo || 'Sem título'}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          {building?.nome || log.nome_cliente || '—'}
                          {building?.bairro && (
                            <span className="text-slate-400">· {building.bairro}</span>
                          )}
                        </p>
                        {log.link && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs">
                            <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#C7141A] mt-0.5" />
                            <a
                              href={log.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#C7141A] hover:underline break-all font-mono"
                            >
                              {log.link}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateBR(log.data_hora)}
                        </span>
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
