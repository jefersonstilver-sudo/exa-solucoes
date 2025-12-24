import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitorPlay, ArrowRight, AlertTriangle, CheckCircle, Wifi, WifiOff, TrendingDown } from 'lucide-react';
import { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useNavigate } from 'react-router-dom';
import { FullUptimeBadge } from '@/components/admin/uptime/FullUptimeBadge';
import { ScheduledShutdownBadge } from '@/components/admin/uptime/ScheduledShutdownBadge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { supabase } from '@/integrations/supabase/client';

interface PanelsStatusCardProps {
  metrics: DashboardMetrics;
  quedasPeriodo?: number;
}

interface OfflineDevice {
  id: string;
  name: string;
  provider?: string;
  condominio_name?: string;
}

const PanelsStatusCard = ({ metrics, quedasPeriodo = 0 }: PanelsStatusCardProps) => {
  const navigate = useNavigate();
  const [offlineDevices, setOfflineDevices] = useState<OfflineDevice[]>([]);
  const [quedasHoje, setQuedasHoje] = useState(0);
  
  const onlinePercentage = metrics.panelsTotal > 0
    ? Math.round((metrics.panelsOnline / metrics.panelsTotal) * 100)
    : 0;

  // Fetch offline devices with their internet providers
  useEffect(() => {
    const fetchOfflineDevices = async () => {
      if (metrics.panelsOffline === 0) {
        setOfflineDevices([]);
        return;
      }

      const { data } = await supabase
        .from('devices')
        .select('id, name, provider, condominio_name')
        .eq('is_active', true)
        .eq('status', 'offline');

      if (data) {
        setOfflineDevices(data);
      }
    };

    fetchOfflineDevices();
  }, [metrics.panelsOffline]);

  // Fetch "quedas hoje" - outages today excluding 1h-4h period
  useEffect(() => {
    const fetchQuedasHoje = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('connection_history')
        .select('id, started_at')
        .eq('event_type', 'offline')
        .gte('started_at', `${today}T00:00:00`)
        .lte('started_at', `${today}T23:59:59`);

      if (error) {
        console.error('Error fetching quedas hoje:', error);
        return;
      }

      // Filter out outages between 1h-4h (BRT)
      const filteredQuedas = (data || []).filter(queda => {
        const quedaDate = new Date(queda.started_at);
        const brazilTime = quedaDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
        const hour = new Date(brazilTime).getHours();
        // Exclude 1h-4h scheduled shutdown period
        return !(hour >= 1 && hour < 4);
      });

      setQuedasHoje(filteredQuedas.length);
    };

    fetchQuedasHoje();
    
    // Subscribe to connection_history changes
    const channel = supabase
      .channel('quedas_hoje_monitor')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'connection_history',
        filter: 'event_type=eq.offline'
      }, () => {
        fetchQuedasHoje();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-out flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm md:text-base flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-blue-500" />
              Dispositivos
            </div>
            <div className="flex items-center gap-1.5">
              {metrics.isRealtimeConnected ? (
                <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  <Wifi className="h-3 w-3 animate-pulse" />
                  <span>Ao vivo</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Scheduled Shutdown Badge - Shows during 1h-4h */}
          <ScheduledShutdownBadge compact />
          
          {/* Full Uptime Badge */}
          <FullUptimeBadge compact />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Online: {metrics.panelsOnline}/{metrics.panelsTotal}</span>
            <span className="font-bold text-gray-900">{onlinePercentage}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              style={{ width: `${onlinePercentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-[10px] text-green-700 font-medium">Online</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              {metrics.panelsOnline}
            </p>
          </div>

          {/* Offline with HoverCard */}
          <HoverCard openDelay={100}>
            <HoverCardTrigger asChild>
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span className="text-[10px] text-red-700 font-medium">Offline</span>
                </div>
                <p className="text-lg font-bold text-red-700">
                  {metrics.panelsOffline}
                </p>
              </div>
            </HoverCardTrigger>
            {metrics.panelsOffline > 0 && (
              <HoverCardContent className="w-72 p-3" side="top">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Dispositivos Offline
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {offlineDevices.length > 0 ? (
                      offlineDevices.map((device) => (
                        <div 
                          key={device.id} 
                          className="flex flex-col p-2 bg-red-50 rounded-lg border border-red-100"
                        >
                          <span className="text-sm font-medium text-gray-900">
                            {device.name || 'Sem nome'}
                          </span>
                          {device.condominio_name && (
                            <span className="text-xs text-gray-600">
                              {device.condominio_name}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 mt-1">
                            Internet: {device.provider || 'Não informado'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">Carregando...</p>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            )}
          </HoverCard>

          {/* Quedas Hoje */}
          <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-orange-600" />
              <span className="text-[10px] text-orange-700 font-medium">Hoje</span>
            </div>
            <p className="text-lg font-bold text-orange-700">
              {quedasHoje}
            </p>
          </div>
        </div>

        {/* Offline Alert */}
        {metrics.panelsOffline > 0 && (
          <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              ⚠️ {metrics.panelsOffline} dispositivo{metrics.panelsOffline > 1 ? 's' : ''} offline
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate('/admin/paineis-exa')}
        >
          Ver monitoramento
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default PanelsStatusCard;
