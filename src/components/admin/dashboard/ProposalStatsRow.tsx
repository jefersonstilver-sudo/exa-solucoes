import React, { useMemo } from 'react';
import { FileText, Send, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import AppleLikeMetricCard from './AppleLikeMetricCard';
import { UnifiedDashboardStats, VendedorProposalStats } from '@/hooks/useDashboardUnifiedStats';


interface ProposalStatsRowProps {
  stats: UnifiedDashboardStats;
}

const ProposalStatsRow: React.FC<ProposalStatsRowProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Usar dados reais filtrados por vendedores com propostas
  const filteredVendedores = useMemo(() => {
    return stats.propostasPorVendedor
      .filter(v => v.enviadas > 0)
      .sort((a, b) => b.valorVendido - a.valorVendido);
  }, [stats.propostasPorVendedor]);

  return (
    <div className="w-full">
      <div className={`grid grid-cols-2 ${filteredVendedores.length <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-6'} gap-3`}>
        {filteredVendedores.map((vendedor, index) => (
          <AppleLikeMetricCard
            key={vendedor.vendedorId}
            label={vendedor.vendedorNome}
            value={formatCurrency(vendedor.valorVendido)}
            icon={index === 0 ? TrendingUp : FileText}
            description={`${vendedor.aceitas}/${vendedor.enviadas} (${vendedor.taxaConversao.toFixed(0)}%)`}
            hoverContent={
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {vendedor.vendedorNome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Métricas de propostas do período
                  </p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Send className="h-3 w-3" /> Enviadas:
                    </span>
                    <span className="text-sm font-semibold">{vendedor.enviadas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Aguardando:
                    </span>
                    <span className="text-sm font-semibold text-amber-600">{vendedor.aguardando}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Aceitas:
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">{vendedor.aceitas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Taxa Conversão:</span>
                    <span className={`text-sm font-semibold ${
                      vendedor.taxaConversao >= 50 ? 'text-emerald-600' : 
                      vendedor.taxaConversao >= 25 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {vendedor.taxaConversao.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">Valor Vendido:</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(vendedor.valorVendido)}
                    </span>
                  </div>
                </div>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default ProposalStatsRow;
