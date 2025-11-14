import { Card } from '@/components/ui/card';
import { MonitorPlay, CheckCircle, AlertCircle } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
  );
};
