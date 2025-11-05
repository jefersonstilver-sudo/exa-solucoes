import { ShoppingCart, AlertTriangle, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClientTrackingData } from '@/hooks/useClientTracking';

interface ClientInsightsProps {
  trackingData: ClientTrackingData | null;
  isLoading: boolean;
}

export const ClientInsights = ({ trackingData, isLoading }: ClientInsightsProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Visitante sem histórico de compras</p>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 dark:text-red-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'Alto';
    if (score >= 40) return 'Médio';
    return 'Baixo';
  };

  const getValueScore = () => {
    if (trackingData.totalRevenue > 5000) return 'Alto Valor';
    if (trackingData.totalRevenue > 1000) return 'Médio Valor';
    if (trackingData.totalRevenue > 0) return 'Baixo Valor';
    return 'Sem Compras';
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Análise de Cliente
        </h4>
        <Badge variant="outline" className="text-xs">
          {getValueScore()}
        </Badge>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total de Pedidos */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShoppingCart className="h-3 w-3" />
            <span>Pedidos</span>
          </div>
          <div className="text-lg font-bold">{trackingData.totalOrders}</div>
          {trackingData.lastOrderDate && (
            <div className="text-[10px] text-muted-foreground">
              Último: {formatDistanceToNow(trackingData.lastOrderDate, {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          )}
        </div>

        {/* Receita Total */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Receita</span>
          </div>
          <div className="text-lg font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(trackingData.totalRevenue)}
          </div>
        </div>
      </div>

      {/* Carrinhos Abandonados */}
      {trackingData.abandonedCarts > 0 && (
        <div className="p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium">
              {trackingData.abandonedCarts} tentativa(s) abandonada(s)
            </span>
          </div>
        </div>
      )}

      {/* Score de Risco */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Score de Risco</span>
          <span className={`font-bold ${getRiskColor(trackingData.riskScore)}`}>
            {getRiskLevel(trackingData.riskScore)} ({trackingData.riskScore}%)
          </span>
        </div>
        <Progress 
          value={trackingData.riskScore} 
          className="h-2"
        />
      </div>

      {/* Cupons Usados */}
      {trackingData.couponsUsed.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Cupons Utilizados</div>
          <div className="flex flex-wrap gap-1">
            {trackingData.couponsUsed.map((coupon, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px]">
                {coupon}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de IPs */}
      {trackingData.ipHistory.length > 1 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            Histórico de IPs ({trackingData.ipHistory.length})
          </div>
          <div className="text-[10px] text-muted-foreground/70 max-h-12 overflow-y-auto">
            {trackingData.ipHistory.slice(0, 3).join(', ')}
            {trackingData.ipHistory.length > 3 && '...'}
          </div>
        </div>
      )}

      {/* Tempo como Cliente */}
      <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1.5">
        <Calendar className="h-3 w-3" />
        <span>
          Cliente há{' '}
          {formatDistanceToNow(trackingData.firstSeen, { locale: ptBR })}
        </span>
      </div>
    </div>
  );
};
