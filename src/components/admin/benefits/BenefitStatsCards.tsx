import React from 'react';
import { Gift, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BenefitStats {
  total_benefits: number;
  pending_count: number;
  choice_made_count: number;
  code_sent_count: number;
  cancelled_count: number;
  requires_action_count: number;
  month_year: string;
}

interface BenefitStatsCardsProps {
  stats: BenefitStats;
  loading: boolean;
}

const BenefitStatsCards: React.FC<BenefitStatsCardsProps> = ({ stats, loading }) => {
  const cards = [
    {
      title: 'Total',
      value: stats.total_benefits,
      icon: Gift,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Aguardando',
      value: stats.pending_count,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Requer Código',
      value: stats.choice_made_count,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badge: stats.choice_made_count > 0 ? 'AÇÃO' : null,
    },
    {
      title: 'Finalizados',
      value: stats.code_sent_count,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-3 animate-pulse">
            <div className="h-14 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className="relative overflow-hidden p-3 border shadow-sm hover:shadow-md transition-shadow"
          >
            {card.badge && (
              <div className="absolute top-1 right-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500 text-white">
                  {card.badge}
                </span>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide truncate">
                  {card.title}
                </p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  {card.value}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default BenefitStatsCards;
