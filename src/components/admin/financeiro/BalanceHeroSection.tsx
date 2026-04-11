import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet, Lock, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';

interface BalanceData {
  available: number;
  blocked: number;
  to_be_released: number;
  currency: string;
  source?: 'api' | 'unavailable' | 'error';
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
  // Verificar se o saldo está disponível via API
  const isBalanceAvailable = balance?.source === 'api';
  const isBalanceUnavailable = balance?.source === 'unavailable' || balance?.source === 'error';

  const renderValue = (value: number) => {
    if (loading) return '...';
    if (isBalanceUnavailable) return '—';
    return formatCurrency(value);
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Saldo ASAAS</h2>
          <div className="flex items-center gap-2 mt-1">
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Atualizado: {new Date(lastUpdated).toLocaleString('pt-BR')}
              </p>
            )}
            {isBalanceUnavailable && !loading && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                <AlertCircle className="h-3 w-3" />
                Saldo indisponível via API
              </span>
            )}
          </div>
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
        {/* Disponível */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Disponível</p>
              <p className={`text-2xl font-bold mt-1 ${isBalanceUnavailable ? 'text-muted-foreground' : 'text-foreground'}`}>
                {renderValue(balance?.available || 0)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Bloqueado */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bloqueado</p>
              <p className={`text-2xl font-bold mt-1 ${isBalanceUnavailable ? 'text-muted-foreground' : 'text-foreground'}`}>
                {renderValue(balance?.blocked || 0)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* A Liberar */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A Liberar</p>
              <p className={`text-2xl font-bold mt-1 ${isBalanceUnavailable ? 'text-muted-foreground' : 'text-foreground'}`}>
                {renderValue(balance?.to_be_released || 0)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BalanceHeroSection;
