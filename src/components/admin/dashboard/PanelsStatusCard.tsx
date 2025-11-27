import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitorPlay, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useNavigate } from 'react-router-dom';

interface PanelsStatusCardProps {
  metrics: DashboardMetrics;
}

const PanelsStatusCard = ({ metrics }: PanelsStatusCardProps) => {
  const navigate = useNavigate();
  
  const onlinePercentage = metrics.panelsTotal > 0
    ? Math.round((metrics.panelsOnline / metrics.panelsTotal) * 100)
    : 0;

  return (
    <Card className="bg-gradient-to-br from-background via-background to-accent/5 rounded-2xl border border-border/40 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-blue-500" />
          Status dos Painéis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Online: {metrics.panelsOnline}</span>
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
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-[10px] text-green-700 font-medium">Online</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              {metrics.panelsOnline}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-[10px] text-red-700 font-medium">Offline</span>
            </div>
            <p className="text-xl font-bold text-red-700">
              {metrics.panelsOffline}
            </p>
          </div>
        </div>

        {/* Offline Alert */}
        {metrics.panelsOffline > 0 && (
          <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              ⚠️ {metrics.panelsOffline} painel{metrics.panelsOffline > 1 ? 'éis' : ''} offline
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate('/admin/monitoramento-ia')}
        >
          Ver monitoramento
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default PanelsStatusCard;
