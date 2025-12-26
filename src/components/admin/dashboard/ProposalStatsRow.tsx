import React, { useMemo } from 'react';
import { FileText, Send, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import AppleLikeMetricCard from './AppleLikeMetricCard';
import { UnifiedDashboardStats, VendedorProposalStats } from '@/hooks/useDashboardUnifiedStats';

// IDs fixos dos vendedores que devem aparecer (sincronizado com SellersRankingCard)
const FIXED_SELLER_IDS = [
  '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308', // Jeferson Stilver
  '6390fcd3-3eaa-4f57-9a7b-b3466a306ee8', // Bruno Dantas
  'c9ff75c5-a051-4b6d-a278-cdd5a2306820', // Eduardo Comercial
  '21333746-3d73-48f2-8af8-61fb3f86bcf8', // Suzana Financeiro
];

const FIXED_SELLER_NAMES: Record<string, string> = {
  '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308': 'Jeferson',
  '6390fcd3-3eaa-4f57-9a7b-b3466a306ee8': 'Bruno',
  'c9ff75c5-a051-4b6d-a278-cdd5a2306820': 'Eduardo',
  '21333746-3d73-48f2-8af8-61fb3f86bcf8': 'Suzana',
};

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

  // Filtrar apenas os 4 vendedores fixos
  const filteredVendedores = useMemo(() => {
    const result: VendedorProposalStats[] = [];
    
    FIXED_SELLER_IDS.forEach(sellerId => {
      const found = stats.propostasPorVendedor.find(v => v.vendedorId === sellerId);
      if (found) {
        result.push({
          ...found,
          vendedorNome: FIXED_SELLER_NAMES[sellerId] || found.vendedorNome
        });
      } else {
        // Se não encontrou, criar entrada zerada
        result.push({
          vendedorId: sellerId,
          vendedorNome: FIXED_SELLER_NAMES[sellerId] || 'Vendedor',
          enviadas: 0,
          visualizadas: 0,
          aguardando: 0,
          aceitas: 0,
          valorRecebido: 0,
          valorProjetado: 0,
          valorVendido: 0,
          taxaConversao: 0
        });
      }
    });
    
    // Ordenar por valor recebido
    return result.sort((a, b) => b.valorRecebido - a.valorRecebido);
  }, [stats.propostasPorVendedor]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
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
