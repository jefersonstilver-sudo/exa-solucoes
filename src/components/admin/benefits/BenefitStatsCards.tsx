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
  // Valor fixo por benefício: R$ 50,00
  const valuePerBenefit = 50;
  const totalInvested = stats.total_benefits * valuePerBenefit;
  const pendingValue = stats.pending_count * valuePerBenefit;
  const completedValue = stats.code_sent_count * valuePerBenefit;

  const cards = [
    {
      title: 'Total Criados',
      value: stats.total_benefits,
      subtitle: `R$ ${totalInvested.toFixed(2)}`,
      icon: Gift,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Aguardando Escolha',
      value: stats.pending_count,
      subtitle: `R$ ${pendingValue.toFixed(2)} pendente`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Requer Código',
      value: stats.choice_made_count,
      subtitle: stats.choice_made_count > 0 ? 'Ação Necessária!' : 'Tudo OK',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      badge: stats.choice_made_count > 0 ? 'URGENTE' : null,
    },
    {
      title: 'Finalizados',
      value: stats.code_sent_count,
      subtitle: `R$ ${completedValue.toFixed(2)} processado`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-20 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`relative overflow-hidden p-4 border-2 ${card.borderColor} shadow-sm hover:shadow-md transition-all hover:scale-[1.02]`}
          >
            {card.badge && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white animate-pulse">
                  {card.badge}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className={`${card.bgColor} ${card.color} p-2.5 rounded-xl`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {card.subtitle}
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
