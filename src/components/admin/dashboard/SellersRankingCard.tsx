import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, Users, ChevronDown, ChevronUp, Eye, Send, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VendedorProposalStats } from '@/hooks/useDashboardUnifiedStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// IDs fixos dos vendedores que devem aparecer
const FIXED_SELLER_IDS = [
  '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308', // Jeferson Stilver
  '6390fcd3-3eaa-4f57-9a7b-b3466a306ee8', // Bruno Dantas
  'c9ff75c5-a051-4b6d-a278-cdd5a2306820', // Eduardo Comercial
  '21333746-3d73-48f2-8af8-61fb3f86bcf8', // Suzana Financeiro
];

const FIXED_SELLER_NAMES: Record<string, string> = {
  '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308': 'Jeferson Stilver',
  '6390fcd3-3eaa-4f57-9a7b-b3466a306ee8': 'Bruno Dantas',
  'c9ff75c5-a051-4b6d-a278-cdd5a2306820': 'Eduardo',
  '21333746-3d73-48f2-8af8-61fb3f86bcf8': 'Suzana',
};

interface SellersRankingCardProps {
  vendedores: VendedorProposalStats[];
  loading?: boolean;
}

const SellersRankingCard: React.FC<SellersRankingCardProps> = ({ vendedores, loading }) => {
  const [expanded, setExpanded] = useState(false);

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
      const found = vendedores.find(v => v.vendedorId === sellerId);
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
  }, [vendedores]);

  // Cores para o ranking (medalhas)
  const getRankingColor = (index: number) => {
    switch (index) {
      case 0: return 'hsl(45, 93%, 47%)'; // Gold
      case 1: return 'hsl(0, 0%, 70%)';   // Silver
      case 2: return 'hsl(30, 60%, 50%)'; // Bronze
      default: return 'hsl(var(--primary))';
    }
  };

  const getRankingBadge = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}º`;
    }
  };

  // Preparar dados para o gráfico
  const chartData = filteredVendedores.map((v, i) => ({
    name: v.vendedorNome.split(' ')[0],
    valor: v.valorRecebido,
    projetado: v.valorProjetado,
    enviadas: v.enviadas,
    aceitas: v.aceitas,
    taxa: v.taxaConversao,
    fill: getRankingColor(i)
  }));

  const maxValue = Math.max(...filteredVendedores.map(v => v.valorRecebido), 1);

  if (loading) {
    return (
      <Card className="p-4 bg-white border border-gray-100 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ease-out flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-sm">Ranking de Vendedores</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-7 text-xs"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Gráfico
            </>
          )}
        </Button>
      </div>

      {/* Lista de Ranking com métricas detalhadas */}
      <div className="space-y-2">
        {filteredVendedores.map((vendedor, index) => (
          <div
            key={vendedor.vendedorId}
            className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-200"
          >
            {/* Posição */}
            <div className="w-8 text-center text-lg flex-shrink-0">
              {getRankingBadge(index)}
            </div>
            
            {/* Info + Métricas */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate mb-1">{vendedor.vendedorNome}</p>
              
              {/* Métricas compactas: Enviadas | Visualizadas | Aceitas */}
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1 text-blue-600">
                  <Send className="h-3 w-3" />
                  <span className="font-medium">{vendedor.enviadas}</span>
                  <span className="text-muted-foreground">env</span>
                </div>
                <div className="flex items-center gap-1 text-purple-600">
                  <Eye className="h-3 w-3" />
                  <span className="font-medium">{vendedor.visualizadas}</span>
                  <span className="text-muted-foreground">vis</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-medium">{vendedor.aceitas}</span>
                  <span className="text-muted-foreground">ace</span>
                </div>
              </div>
            </div>
            
            {/* Valor */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-emerald-600">
                {formatCurrency(vendedor.valorRecebido)}
              </p>
              {vendedor.valorProjetado > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  +{formatCurrency(vendedor.valorProjetado)} proj.
                </p>
              )}
              {/* Barra de progresso */}
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(vendedor.valorRecebido / maxValue) * 100}%`,
                    backgroundColor: getRankingColor(index)
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico expandido */}
      {expanded && chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Vendas por Vendedor</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis 
                  type="number" 
                  hide 
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={60}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg text-xs">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-emerald-600">{formatCurrency(data.valor)} recebido</p>
                          {data.projetado > 0 && (
                            <p className="text-amber-600">+{formatCurrency(data.projetado)} projetado</p>
                          )}
                          <p className="text-muted-foreground">
                            {data.aceitas}/{data.enviadas} ({data.taxa.toFixed(0)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="valor" 
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/30">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                {filteredVendedores.reduce((sum, v) => sum + v.enviadas, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Enviadas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">
                {filteredVendedores.reduce((sum, v) => sum + v.aceitas, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Aceitas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(filteredVendedores.reduce((sum, v) => sum + v.valorRecebido, 0))}
              </p>
              <p className="text-[10px] text-muted-foreground">Recebido</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(filteredVendedores.reduce((sum, v) => sum + v.valorProjetado, 0))}
              </p>
              <p className="text-[10px] text-muted-foreground">Projetado</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SellersRankingCard;
