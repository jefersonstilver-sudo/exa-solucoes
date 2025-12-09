import React, { useState } from 'react';
import { Trophy, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VendedorProposalStats } from '@/hooks/useDashboardUnifiedStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

  // Preparar dados para o gráfico - usando valorRecebido
  const chartData = vendedores.slice(0, 5).map((v, i) => ({
    name: v.vendedorNome.split(' ')[0], // Primeiro nome apenas
    valor: v.valorRecebido,
    projetado: v.valorProjetado,
    propostas: v.enviadas,
    aceitas: v.aceitas,
    taxa: v.taxaConversao,
    fill: getRankingColor(i)
  }));

  const maxValue = Math.max(...vendedores.map(v => v.valorRecebido), 1);

  if (loading) {
    return (
      <Card className="p-4 bg-white border border-gray-100 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (vendedores.length === 0) {
    return (
      <Card className="p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-out">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-sm">Ranking de Vendedores</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhuma proposta no período
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-out">
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

      {/* Lista de Ranking */}
      <div className="space-y-2">
        {vendedores.slice(0, expanded ? 10 : 5).map((vendedor, index) => (
          <div
            key={vendedor.vendedorId}
            className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-200"
          >
            {/* Posição */}
            <div className="w-8 text-center text-lg">
              {getRankingBadge(index)}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{vendedor.vendedorNome}</p>
              <p className="text-xs text-muted-foreground">
                {vendedor.aceitas}/{vendedor.enviadas} propostas • {vendedor.taxaConversao.toFixed(0)}%
              </p>
            </div>
            
            {/* Valor - Receita Efetiva e Projetada */}
            <div className="text-right">
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
                            {data.aceitas}/{data.propostas} ({data.taxa.toFixed(0)}%)
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

          {/* Resumo com Recebido vs Projetado */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/30">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                {vendedores.reduce((sum, v) => sum + v.enviadas, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Enviadas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">
                {vendedores.reduce((sum, v) => sum + v.aceitas, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Aceitas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(vendedores.reduce((sum, v) => sum + v.valorRecebido, 0))}
              </p>
              <p className="text-[10px] text-muted-foreground">Recebido</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(vendedores.reduce((sum, v) => sum + v.valorProjetado, 0))}
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
