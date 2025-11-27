import React from 'react';
import { UserPlus, ShoppingBag, DollarSign, MessageCircle, Building2, Gift } from 'lucide-react';
import DashboardMetricCardWithHover from './DashboardMetricCardWithHover';
import { UnifiedDashboardStats } from '@/hooks/useDashboardUnifiedStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UnifiedStatsRowProps {
  stats: UnifiedDashboardStats;
}

const UnifiedStatsRow = ({ stats }: UnifiedStatsRowProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 'N/A', positive: true };
    const diff = current - previous;
    const percent = ((diff / previous) * 100).toFixed(1);
    return {
      value: `${diff >= 0 ? '+' : ''}${percent}%`,
      positive: diff >= 0
    };
  };

  const cadastrosTrend = calculateTrend(stats.cadastros, stats.cadastrosAnterior);
  const vendasTrend = calculateTrend(stats.vendas, stats.vendasAnterior);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* 1. Cadastros */}
        <DashboardMetricCardWithHover
          title="Cadastros"
          value={stats.loading ? '...' : stats.cadastros}
          icon={UserPlus}
          trend={!stats.loading ? cadastrosTrend : undefined}
          hoverContent={
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-semibold text-foreground">Cadastros no Período</span>
                <span className="text-2xl font-bold text-primary">{stats.cadastros}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período anterior:</span>
                  <span className="font-medium">{stats.cadastrosAnterior}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variação:</span>
                  <span className={`font-medium ${cadastrosTrend.positive ? 'text-green-500' : 'text-red-500'}`}>
                    {cadastrosTrend.value}
                  </span>
                </div>
              </div>
            </div>
          }
        />

        {/* 2. Pedidos */}
        <DashboardMetricCardWithHover
          title="Pedidos"
          value={stats.loading ? '...' : stats.pedidos}
          icon={ShoppingBag}
          hoverContent={
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-semibold text-foreground">Pedidos no Período</span>
                <span className="text-2xl font-bold text-primary">{stats.pedidos}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagos:</span>
                  <span className="font-medium text-green-500">{stats.pedidosDetalhes.pagos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pendentes:</span>
                  <span className="font-medium text-amber-500">{stats.pedidosDetalhes.pendentes}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Ticket médio:</span>
                  <span className="font-medium">{formatCurrency(stats.pedidosDetalhes.ticketMedio)}</span>
                </div>
              </div>
            </div>
          }
        />

        {/* 3. Vendas */}
        <DashboardMetricCardWithHover
          title="Vendas"
          value={stats.loading ? '...' : formatCurrency(stats.vendas)}
          icon={DollarSign}
          trend={!stats.loading ? vendasTrend : undefined}
          hoverContent={
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-semibold text-foreground">Vendas no Período</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(stats.vendas)}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período anterior:</span>
                  <span className="font-medium">{formatCurrency(stats.vendasAnterior)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variação:</span>
                  <span className={`font-medium ${vendasTrend.positive ? 'text-green-500' : 'text-red-500'}`}>
                    {vendasTrend.value}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Pedidos pagos:</span>
                  <span className="font-medium">{stats.pedidosDetalhes.pagos}</span>
                </div>
              </div>
            </div>
          }
        />

        {/* 4. Conversas */}
        <DashboardMetricCardWithHover
          title="Conversas"
          value={stats.loading ? '...' : stats.conversas}
          icon={MessageCircle}
          hoverContent={
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="font-semibold text-foreground">Conversas do Período</span>
                <span className="text-2xl font-bold text-primary">{stats.conversas}</span>
              </div>
              
              {/* Novos Contatos */}
              <div className="flex items-center justify-between py-2 px-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium text-foreground">Novos contatos no período</span>
                <span className="text-lg font-bold text-primary">{stats.novosContatos}</span>
              </div>

              {/* Tabela por Agente */}
              {Object.keys(stats.conversasPorAgente).length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Por Agente
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="text-left py-2 font-medium">Agente</th>
                        <th className="text-center py-2 font-medium">Conv.</th>
                        <th className="text-center py-2 font-medium">Env.</th>
                        <th className="text-center py-2 font-medium">Rec.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.conversasPorAgente).map(([agente, statsData]) => (
                        <tr key={agente} className="border-b border-border/50">
                          <td className="py-2 text-foreground font-medium">{agente}</td>
                          <td className="py-2 text-center font-medium text-primary">{statsData.conversas}</td>
                          <td className="py-2 text-center text-blue-600">{statsData.enviadas}</td>
                          <td className="py-2 text-center text-green-600">{statsData.recebidas}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold">
                        <td className="py-2 text-foreground">Total</td>
                        <td className="py-2 text-center text-primary">{stats.conversas}</td>
                        <td className="py-2 text-center text-blue-600">{stats.mensagensEnviadas}</td>
                        <td className="py-2 text-center text-green-600">{stats.mensagensRecebidas}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Tabela por Tipo de Contato */}
              {Object.keys(stats.conversasPorTipo).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Por Tipo de Contato
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="text-left py-2 font-medium">Tipo</th>
                        <th className="text-center py-2 font-medium">Conv.</th>
                        <th className="text-center py-2 font-medium">Env.</th>
                        <th className="text-center py-2 font-medium">Rec.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.conversasPorTipo).map(([tipo, statsData]) => (
                        <tr key={tipo} className="border-b border-border/50 last:border-0">
                          <td className="py-2 text-foreground">{tipo}</td>
                          <td className="py-2 text-center font-medium text-primary">{statsData.conversas}</td>
                          <td className="py-2 text-center text-blue-600">{statsData.enviadas}</td>
                          <td className="py-2 text-center text-green-600">{statsData.recebidas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {Object.keys(stats.conversasPorTipo).length === 0 && Object.keys(stats.conversasPorAgente).length === 0 && (
                <p className="text-muted-foreground text-center py-2">Nenhuma conversa no período</p>
              )}
            </div>
          }
        />

        {/* 5. Prédios Ativos */}
        <DashboardMetricCardWithHover
          title="Prédios Ativos"
          value={stats.loading ? '...' : `${stats.prediosPercentual.toFixed(0)}%`}
          icon={Building2}
          hoverContent={
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="font-semibold text-foreground">Status dos Prédios</span>
                <span className="text-2xl font-bold text-primary">{stats.prediosPercentual.toFixed(0)}%</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prédios ativos:</span>
                  <span className="font-medium text-green-500">{stats.prediosAtivos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prédios inativos:</span>
                  <span className="font-medium text-red-500">{stats.prediosTotal - stats.prediosAtivos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de prédios:</span>
                  <span className="font-medium">{stats.prediosTotal}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg mt-2">
                  <span className="font-medium text-foreground">Quedas no período:</span>
                  <span className="text-lg font-bold text-red-600">{stats.quedasPeriodo}</span>
                </div>
              </div>
            </div>
          }
        />

        {/* 6. Vouchers Pendentes */}
        <DashboardMetricCardWithHover
          title="Vouchers Pendentes"
          value={stats.loading ? '...' : stats.vouchersPendentes}
          icon={Gift}
          hoverContent={
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-semibold text-foreground">Vouchers Aguardando</span>
                <span className="text-2xl font-bold text-primary">{stats.vouchersPendentes}</span>
              </div>
              <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                {stats.vouchersList.length > 0 ? (
                  stats.vouchersList.map((voucher, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-muted/50 border border-border/30">
                      <p className="font-medium text-foreground truncate">{voucher.provider_name}</p>
                      <p className="text-xs text-muted-foreground">{voucher.benefit_choice}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {voucher.benefit_chosen_at 
                          ? format(new Date(voucher.benefit_chosen_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Data não disponível'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-2">Nenhum voucher pendente</p>
                )}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default UnifiedStatsRow;
