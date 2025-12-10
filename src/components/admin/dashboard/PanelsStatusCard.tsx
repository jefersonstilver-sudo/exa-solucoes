import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitorPlay, ArrowRight, AlertTriangle, CheckCircle, Wifi, WifiOff, TrendingDown } from 'lucide-react';
import { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useNavigate } from 'react-router-dom';
import { FullUptimeBadge } from '@/components/admin/uptime/FullUptimeBadge';
import { ScheduledShutdownBadge } from '@/components/admin/uptime/ScheduledShutdownBadge';

interface PanelsStatusCardProps {
  metrics: DashboardMetrics;
  quedasPeriodo?: number;
}

const PanelsStatusCard = ({ metrics, quedasPeriodo = 0 }: PanelsStatusCardProps) => {
  const navigate = useNavigate();
  
  const onlinePercentage = metrics.panelsTotal > 0
    ? Math.round((metrics.panelsOnline / metrics.panelsTotal) * 100)
    : 0;

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-out">
      <CardHeader className="pb-3">
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
      <CardContent className="space-y-4">
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

          <div className="p-2 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-[10px] text-red-700 font-medium">Offline</span>
            </div>
            <p className="text-lg font-bold text-red-700">
              {metrics.panelsOffline}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-orange-600" />
              <span className="text-[10px] text-orange-700 font-medium">Quedas</span>
            </div>
            <p className="text-lg font-bold text-orange-700">
              {quedasPeriodo}
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
