import React from 'react';
import { Users, Shield, Crown, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UserStats {
  total_users: number;
  admins_count: number;
  super_admins_count: number;
  clients_count: number;
  other_count: number;
  users_this_month: number;
  verified_users: number;
}

interface UserStatsCardsProps {
  stats: UserStats;
  loading: boolean;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats, loading }) => {
  const cards = [
    {
      title: 'Total',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Super Admins',
      value: stats.super_admins_count,
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Admins',
      value: stats.admins_count,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Clientes',
      value: stats.clients_count,
      icon: UserCheck,
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
            className="p-3 border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-2.5">
              <div className={`${card.bgColor} ${card.color} p-2 rounded-lg`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium truncate">
                  {card.title}
                </p>
                <p className="text-xl font-bold text-foreground mt-0.5">
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

export default UserStatsCards;
