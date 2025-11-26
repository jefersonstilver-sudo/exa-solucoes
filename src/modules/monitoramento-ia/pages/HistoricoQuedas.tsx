import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, AlertCircle, Clock, RefreshCw, ArrowLeft, List, Grid3x3, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DowntimeEvent {
  id: string;
  computer_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  device_name?: string;
  condominio_name?: string;
}

interface Device {
  id: string;
  name: string;
}

interface PainelAgrupado {
  device_name: string;
  condominio_name: string;
  total_quedas: number;
  tempo_total_offline: number;
  duracao_media: number;
  eventos: DowntimeEvent[];
}

type SortOption = 'quedas' | 'tempo' | 'nome' | 'condominio';
type ViewMode = 'list' | 'card';

export function HistoricoQuedasPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<DowntimeEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [minDuration, setMinDuration] = useState<string>('0');
  const [sortBy, setSortBy] = useState<SortOption>('quedas');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const loadDevices = async () => {
    const { data } = await supabase
      .from('devices')
      .select('id, name')
      .order('name');
    
    if (data) setDevices(data);
  };

  const loadDowntimeHistory = async () => {
    setLoading(true);
    
    let query = supabase
      .from('connection_history')
      .select(`
        id,
        computer_id,
        started_at,
        ended_at,
        duration_seconds,
        event_type
      `)
      .eq('event_type', 'offline')
      .order('started_at', { ascending: false });

    // Filtro por período
    const now = new Date();
    if (selectedPeriod === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.gte('started_at', today.toISOString());
    } else if (selectedPeriod === 'yesterday') {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.gte('started_at', yesterday.toISOString()).lt('started_at', today.toISOString());
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('started_at', weekAgo.toISOString());
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query = query.gte('started_at', monthAgo.toISOString());
    }

    // Filtro por dispositivo
    if (selectedDevice !== 'all') {
      query = query.eq('computer_id', selectedDevice);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar histórico:', error);
      setLoading(false);
      return;
    }

    // Filtro por duração mínima
    const minDurationSeconds = parseInt(minDuration) * 60;
    const filtered = data?.filter(e => 
      !e.duration_seconds || e.duration_seconds >= minDurationSeconds
    ) || [];

    // Enriquecer com nome do dispositivo e condomínio
    const enriched = await Promise.all(
      filtered.map(async (event) => {
        const { data: device } = await supabase
          .from('devices')
          .select('name, condominio_name')
          .eq('id', event.computer_id)
          .single();
        
        return {
          ...event,
          device_name: device?.name || 'Desconhecido',
          condominio_name: device?.condominio_name || 'Sem condomínio'
        };
      })
    );

    setEvents(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    loadDowntimeHistory();
  }, [selectedDevice, selectedPeriod, minDuration]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Em andamento';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getTotalDowntime = () => {
    return events.reduce((acc, e) => acc + (e.duration_seconds || 0), 0);
  };

  const getAverageDowntime = () => {
    if (events.length === 0) return 0;
    return getTotalDowntime() / events.length;
  };

  // Agrupar eventos por painel
  const paineisAgrupados: PainelAgrupado[] = events.reduce((acc, event) => {
    const existing = acc.find(p => p.device_name === event.device_name);
    if (existing) {
      existing.total_quedas++;
      existing.tempo_total_offline += (event.duration_seconds || 0);
      existing.eventos.push(event);
      existing.duracao_media = existing.tempo_total_offline / existing.total_quedas;
    } else {
      acc.push({
        device_name: event.device_name || 'Desconhecido',
        condominio_name: event.condominio_name || 'Sem condomínio',
        total_quedas: 1,
        tempo_total_offline: event.duration_seconds || 0,
        duracao_media: event.duration_seconds || 0,
        eventos: [event]
      });
    }
    return acc;
  }, [] as PainelAgrupado[]);

  // Ordenar painéis agrupados
  const paineisOrdenados = [...paineisAgrupados].sort((a, b) => {
    switch (sortBy) {
      case 'quedas':
        return b.total_quedas - a.total_quedas;
      case 'tempo':
        return b.tempo_total_offline - a.tempo_total_offline;
      case 'nome':
        return a.device_name.localeCompare(b.device_name);
      case 'condominio':
        return a.condominio_name.localeCompare(b.condominio_name);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header com navegação */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Histórico Completo de Quedas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e analise todas as quedas registradas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadDowntimeHistory}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Período</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Painel</label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os painéis</SelectItem>
                {devices.map(device => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Duração mínima</label>
            <Select value={minDuration} onValueChange={setMinDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todas</SelectItem>
                <SelectItem value="1">≥ 1 minuto</SelectItem>
                <SelectItem value="5">≥ 5 minutos</SelectItem>
                <SelectItem value="15">≥ 15 minutos</SelectItem>
                <SelectItem value="30">≥ 30 minutos</SelectItem>
                <SelectItem value="60">≥ 1 hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Ordenar por</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quedas">Número de quedas</SelectItem>
                <SelectItem value="tempo">Tempo total offline</SelectItem>
                <SelectItem value="nome">Nome do painel</SelectItem>
                <SelectItem value="condominio">Condomínio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertCircle className="w-4 h-4" />
            Total de quedas
          </div>
          <div className="text-2xl font-bold">{events.length}</div>
        </Card>

        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            Tempo total offline
          </div>
          <div className="text-2xl font-bold">{formatDuration(getTotalDowntime())}</div>
        </Card>

        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            Duração média
          </div>
          <div className="text-2xl font-bold">{formatDuration(Math.floor(getAverageDowntime()))}</div>
        </Card>
      </div>

      {/* Tabs: Vista por evento ou agrupada por prédio */}
      <Tabs defaultValue="grouped" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="grouped">Agrupado por Prédio</TabsTrigger>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          </TabsList>
        </div>

        {/* Vista Agrupada por Prédio */}
        <TabsContent value="grouped" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando histórico...
            </div>
          ) : paineisOrdenados.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma queda registrada no período selecionado</p>
              </div>
            </Card>
          ) : (
            paineisOrdenados.map((painel, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {painel.device_name}
                      <Badge variant="destructive">{painel.total_quedas} quedas</Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">{painel.condominio_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Tempo total offline</p>
                    <p className="text-lg font-bold text-destructive">
                      {formatDuration(painel.tempo_total_offline)}
                    </p>
                  </div>
                </div>

                {/* Lista de eventos do painel */}
                <div className="space-y-2 mt-4 pt-4 border-t">
                  {painel.eventos.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Início:</span>{' '}
                          {format(new Date(event.started_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          {' '}
                          <span className="text-xs">
                            ({formatDistanceToNow(new Date(event.started_at), { addSuffix: true, locale: ptBR })})
                          </span>
                        </div>
                        
                        {event.ended_at && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Fim:</span>{' '}
                            {format(new Date(event.ended_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          </div>
                        )}
                      </div>

                      <Badge 
                        variant={event.duration_seconds && event.duration_seconds > 300 ? 'destructive' : 'secondary'}
                        className="font-mono ml-4"
                      >
                        {formatDuration(event.duration_seconds)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Vista Linha do Tempo */}
        <TabsContent value="timeline" className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando histórico...
            </div>
          ) : events.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma queda registrada no período selecionado</p>
              </div>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="font-semibold">{event.device_name}</span>
                      <span className="text-xs text-muted-foreground">• {event.condominio_name}</span>
                      {!event.ended_at && (
                        <Badge variant="destructive" className="text-xs">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Início:</span>{' '}
                        {format(new Date(event.started_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        {' '}
                        <span className="text-xs">
                          ({formatDistanceToNow(new Date(event.started_at), { addSuffix: true, locale: ptBR })})
                        </span>
                      </div>
                      
                      {event.ended_at && (
                        <div>
                          <span className="font-medium">Fim:</span>{' '}
                          {format(new Date(event.ended_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge 
                      variant={event.duration_seconds && event.duration_seconds > 300 ? 'destructive' : 'secondary'}
                      className="font-mono"
                    >
                      {formatDuration(event.duration_seconds)}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
