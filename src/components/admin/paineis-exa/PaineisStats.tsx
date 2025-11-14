import { Card } from '@/components/ui/card';
import { Monitor, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaineisStatsProps {
  stats: {
    total: number;
    online: number;
    offline: number;
    nunca_vinculado: number;
  };
}

export const PaineisStats = ({ stats }: PaineisStatsProps) => {
  const cards = [
    {
      title: 'Total de Painéis',
      value: stats.total,
      icon: Monitor,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Online',
      value: stats.online,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Offline',
      value: stats.offline,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Nunca Vinculados',
      value: stats.nunca_vinculado,
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
            <div className={`${card.bgColor} p-3 rounded-lg`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
