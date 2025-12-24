import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet, Lock, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';

interface BalanceData {
  available: number;
  blocked: number;
  to_be_released: number;
  currency: string;
}

interface BalanceHeroSectionProps {
  balance: BalanceData | null;
  loading: boolean;
  onRefresh: () => void;
  lastUpdated?: string;
}

const BalanceHeroSection: React.FC<BalanceHeroSectionProps> = ({
  balance,
  loading,
  onRefresh,
  lastUpdated
}) => {
  const balanceCards = [
    {
      label: 'Disponível',
      value: balance?.available || 0,
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Bloqueado',
      value: balance?.blocked || 0,
      icon: Lock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      label: 'A Liberar',
      value: balance?.to_be_released || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Saldo Mercado Pago</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Atualizado: {new Date(lastUpdated).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {balanceCards.map((card) => (
          <Card
            key={card.label}
            className={`p-6 border-2 ${card.borderColor} ${card.bgColor} transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color} mt-1`}>
                  {loading ? '...' : formatCurrency(card.value)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BalanceHeroSection;
