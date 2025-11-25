import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DowntimeEvent {
  id: string;
  computer_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  device_name?: string;
}

interface Device {
  id: string;
  name: string;
}

export function DowntimeHistoryPanel() {
  const [events, setEvents] = useState<DowntimeEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [minDuration, setMinDuration] = useState<string>('0');

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

    // Enriquecer com nome do dispositivo
    const enriched = await Promise.all(
      filtered.map(async (event) => {
        const { data: device } = await supabase
          .from('devices')
          .select('name')
          .eq('id', event.computer_id)
          .single();
        
        return {
          ...event,
          device_name: device?.name || 'Desconhecido'
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

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Histórico de Quedas</h3>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

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

      {/* Lista de eventos */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Carregando histórico...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma queda registrada no período selecionado</p>
          </div>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="font-semibold">{event.device_name}</span>
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
      </div>
    </Card>
  );
}
