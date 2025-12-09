import { Card } from '@/components/ui/card';
import { MonitorPlay, CheckCircle, AlertCircle, Trophy } from 'lucide-react';
import { FullUptimeBadge } from '@/components/admin/uptime/FullUptimeBadge';
import { useFullUptimeMode, formatUptimeDuration } from '@/hooks/useFullUptimeMode';
import { useState } from 'react';
import { FullUptimeModal } from '@/components/admin/uptime/FullUptimeModal';

interface PaineisStatsProps {
  stats: {
    total: number;
    aguardando_instalacao: number;
    aguardando_vinculo: number;
    vinculado: number;
    offline: number;
  };
}

export const PaineisStats = ({ stats }: PaineisStatsProps) => {
  const { isFullUptime, currentDuration, record } = useFullUptimeMode();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Full Uptime Card - Always visible */}
        <Card 
          className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
            isFullUptime 
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-gray-50 border-gray-200'
          }`}
          onClick={() => setModalOpen(true)}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${isFullUptime ? 'bg-emerald-500/20' : 'bg-gray-200'}`}>
              <CheckCircle className={`w-6 h-6 ${isFullUptime ? 'text-emerald-600 animate-pulse' : 'text-gray-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Modo 100%</p>
              {isFullUptime ? (
                <div className="space-y-0.5">
                  <p className="text-lg font-bold text-emerald-700 font-mono">
                    {formatUptimeDuration(currentDuration)}
                  </p>
                  {record && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600">
                      <Trophy className="h-3 w-3" />
                      <span>Recorde: {formatUptimeDuration(record.duration_seconds)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-500">Inativo</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <MonitorPlay className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MonitorPlay className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aguardando Instalação</p>
              <p className="text-2xl font-bold">{stats.aguardando_instalacao}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MonitorPlay className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aguardando Vínculo</p>
              <p className="text-2xl font-bold">{stats.aguardando_vinculo}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vinculados</p>
              <p className="text-2xl font-bold">{stats.vinculado}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold">{stats.offline}</p>
            </div>
          </div>
        </Card>
      </div>

      <FullUptimeModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};
