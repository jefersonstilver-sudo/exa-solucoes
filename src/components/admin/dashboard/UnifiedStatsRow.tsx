import React from 'react';
import { UserPlus, ShoppingBag, DollarSign, MessageCircle, Building2, FileText, AlertTriangle } from 'lucide-react';
import AppleLikeMetricCard from './AppleLikeMetricCard';
import { UnifiedDashboardStats } from '@/hooks/useDashboardUnifiedStats';
import { Badge } from '@/components/ui/badge';
import { PrivacyMask } from '@/components/ui/PrivacyMask';
import { usePrivacyModeStore } from '@/hooks/usePrivacyMode';

interface UnifiedStatsRowProps {
  stats: UnifiedDashboardStats;
}

const UnifiedStatsRow = ({ stats }: UnifiedStatsRowProps) => {
  const { isPrivate } = usePrivacyModeStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Wrapper para valores financeiros com privacidade
  const renderCurrency = (value: number) => {
    const formatted = formatCurrency(value);
    return <PrivacyMask value={formatted} maskLength="long" />;
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
  const vendasTrend = stats.vendas != null && stats.vendasAnterior != null ? calculateTrend(stats.vendas, stats.vendasAnterior) : null;

  // Separar clientes de admins
  const clientes = stats.cadastrosLista?.filter(u => u.role === 'cliente') || [];
  const admins = stats.cadastrosLista?.filter(u => u.role !== 'cliente') || [];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Cadastros */}
        <AppleLikeMetricCard
          label="Cadastros no Período"
          value={stats.loading ? '...' : stats.cadastros}
          icon={UserPlus}
          description={!stats.loading ? cadastrosTrend.value : undefined}
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Novos Cadastros</p>
                <p className="text-xs text-muted-foreground">
                  Usuários registrados no período
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">👤 Clientes:</span>
                  <span className="text-sm font-semibold text-blue-600">{clientes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">🔧 Admins:</span>
                  <span className="text-sm font-semibold text-purple-600">{admins.length}</span>
                </div>
                {stats.cadastrosLista.length > 0 && (
                  <div className="pt-2 border-t border-border/30 max-h-32 overflow-y-auto">
                    <p className="text-xs text-muted-foreground mb-1">Últimos cadastros:</p>
                    {stats.cadastrosLista.slice(0, 5).map((user, idx) => (
                      <div key={idx} className="text-xs py-0.5">
                        <span className="font-medium">{user.nome}</span>
                        <span className="text-muted-foreground ml-1">({user.role})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Período Anterior:</span>
                  <span className="text-sm font-semibold">{stats.cadastrosAnterior}</span>
                </div>
              </div>
            </div>
          }
        />

        {/* 2. Pedidos Ativos */}
        <AppleLikeMetricCard
          label="Pedidos Ativos"
          value={stats.loading ? '...' : stats.pedidosAtivos}
          icon={ShoppingBag}
          description={stats.loading ? undefined : (
            stats.pedidosSemContrato > 0 ? (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {stats.pedidosSemContrato} sem contrato
              </span>
            ) : (
              <span className="text-emerald-600">Todos com contrato</span>
            )
          )}
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Status dos Pedidos</p>
                <p className="text-xs text-muted-foreground">
                  Pedidos atualmente em operação
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">✅ Total Ativos:</span>
                  <span className="text-sm font-semibold text-emerald-600">{stats.pedidosAtivos}</span>
                </div>
                {stats.pedidosSemContrato > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">⚠️ Sem Contrato:</span>
                    <span className="text-sm font-semibold text-amber-600">{stats.pedidosSemContrato}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">📋 Novos no Período:</span>
                  <span className="text-sm font-semibold">{stats.pedidos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Ticket Médio:</span>
                  <span className="text-sm font-semibold">{formatCurrency(stats.pedidosDetalhes.ticketMedio)}</span>
                </div>
              </div>
            </div>
          }
        />

        <AppleLikeMetricCard
          label="Recebimentos Asaas"
          value={stats.loading ? '...' : isPrivate ? '•••••' : stats.vendas == null ? 'Indisponível' : formatCurrency(stats.vendas)}
          icon={DollarSign}
          description={vendasTrend?.value}
          disableHover={isPrivate}
          hoverContent={<p className="text-sm text-muted-foreground">Pagamentos recebidos no extrato Asaas no período selecionado. Inclui todos os recebimentos bancários; segregação comercial por pedido requer vínculo seguro por ID.</p>}
        />
        <AppleLikeMetricCard
          label="Previsto / contratado"
          value="Ver financeiro"
          icon={DollarSign}
          onClick={() => window.location.assign('/admin/financeiro')}
          hoverContent={<p className="text-sm text-muted-foreground">Previsto e contratado não são recebidos. Consulte-os separadamente no financeiro.</p>}
        />

        {/* 5. Dispositivos Online (Painéis EXA) */}
        <AppleLikeMetricCard
          label="Dispositivos Online"
          value={stats.loading ? '...' : `${stats.devicesTotal > 0 ? ((stats.devicesOnline / stats.devicesTotal) * 100).toFixed(0) : 0}%`}
          icon={Building2}
          description={stats.loading ? undefined : `${stats.devicesOnline} de ${stats.devicesTotal}`}
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Status dos Dispositivos</p>
                <p className="text-xs text-muted-foreground">
                  Painéis EXA conectados e operacionais
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">🟢 Online:</span>
                  <span className="text-sm font-semibold text-emerald-600">{stats.devicesOnline}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">🔴 Offline:</span>
                  <span className="text-sm font-semibold text-red-600">{stats.devicesOffline}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <span className="text-sm font-semibold">{stats.devicesTotal}</span>
                </div>
                {stats.quedasPeriodo > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">⚡ Quedas no período:</span>
                    <span className="text-sm font-semibold text-amber-600">{stats.quedasPeriodo}</span>
                  </div>
                )}
              </div>
            </div>
          }
        />

        {/* 6. Propostas */}
        <AppleLikeMetricCard
          label="Propostas (mês)"
          value={stats.loading ? '...' : stats.propostasEnviadas}
          icon={FileText}
          description={stats.loading ? undefined : `${stats.propostasAceitas} aceitas`}
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Propostas Comerciais</p>
                <p className="text-xs text-muted-foreground">
                  Acompanhe o pipeline de vendas
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Enviadas:</span>
                  <span className="text-sm font-semibold">{stats.propostasEnviadas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Aguardando:</span>
                  <span className="text-sm font-semibold text-amber-600">{stats.propostasAguardando}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Aceitas:</span>
                  <span className="text-sm font-semibold text-emerald-600">{stats.propostasAceitas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Valor Potencial:</span>
                  <span className="text-sm font-semibold">{formatCurrency(stats.propostasValorPotencial)}</span>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default UnifiedStatsRow;