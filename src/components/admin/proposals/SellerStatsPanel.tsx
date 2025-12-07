import React from 'react';
import { Users, TrendingUp, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PeriodRange } from './ProposalsPeriodSelector';

interface SellerStat {
  id: string;
  name: string;
  proposalsSent: number;
  proposalsAccepted: number;
  valueReceived: number;
  valueToReceive: number;
}

interface SellerStatsPanelProps {
  sellers: SellerStat[];
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  period: PeriodRange;
}

const formatCurrency = (value: number) => {
  return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};

const formatCurrencyCompact = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
};

export const SellerStatsPanel: React.FC<SellerStatsPanelProps> = ({
  sellers,
  isLoading,
  isOpen,
  onToggle,
  period
}) => {
  const totalSent = sellers.reduce((sum, s) => sum + s.proposalsSent, 0);
  const totalAccepted = sellers.reduce((sum, s) => sum + s.proposalsAccepted, 0);
  const totalReceived = sellers.reduce((sum, s) => sum + s.valueReceived, 0);
  const totalToReceive = sellers.reduce((sum, s) => sum + s.valueToReceive, 0);

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          "w-full h-9 justify-between px-3 text-xs font-medium",
          "bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl",
          "hover:bg-white/80 transition-all",
          isOpen && "bg-white/80 border-[#9C1E1E]/20"
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#9C1E1E]" />
          <span>Relatório por Vendedor</span>
          {!isOpen && sellers.length > 0 && (
            <Badge className="bg-[#9C1E1E]/10 text-[#9C1E1E] text-[9px] border-0">
              {sellers.length}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Panel Content */}
      {isOpen && (
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50 space-y-3">
          {/* Summary Row */}
          <div className="grid grid-cols-4 gap-2 text-center pb-2 border-b border-gray-100">
            <div>
              <p className="text-[10px] text-muted-foreground">Enviadas</p>
              <p className="text-sm font-bold text-blue-600">{totalSent}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Aceitas</p>
              <p className="text-sm font-bold text-emerald-600">{totalAccepted}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Recebido</p>
              <p className="text-sm font-bold text-green-600">{formatCurrencyCompact(totalReceived)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">A Receber</p>
              <p className="text-sm font-bold text-amber-600">{formatCurrencyCompact(totalToReceive)}</p>
            </div>
          </div>

          {/* Sellers List */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Nenhum vendedor com propostas no período
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sellers.map((seller) => {
                const conversionRate = seller.proposalsSent > 0 
                  ? Math.round((seller.proposalsAccepted / seller.proposalsSent) * 100) 
                  : 0;
                
                return (
                  <div
                    key={seller.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9C1E1E]/20 to-[#9C1E1E]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#9C1E1E]">
                          {seller.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{seller.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{seller.proposalsSent} env</span>
                          <span>•</span>
                          <span className="text-emerald-600">{seller.proposalsAccepted} aceitas</span>
                          <span>•</span>
                          <span className={cn(
                            conversionRate >= 50 ? "text-green-600" :
                            conversionRate >= 25 ? "text-amber-600" : "text-red-600"
                          )}>
                            {conversionRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-semibold text-green-600">
                        {formatCurrencyCompact(seller.valueReceived)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        +{formatCurrencyCompact(seller.valueToReceive)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Period indicator */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-[10px] text-muted-foreground">
              Dados do período: {period.label}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
