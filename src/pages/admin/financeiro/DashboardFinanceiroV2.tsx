/**
 * DashboardFinanceiroV2 - Cockpit Executivo Financeiro
 * 
 * Dashboard organizado em 5 camadas cognitivas:
 * 1. Situação Atual (Hero)
 * 2. Riscos Próximos
 * 3. Projeções
 * 4. Ações Imediatas
 * 5. Performance
 * 
 * Design: Minimalista, neutro, cores apenas para semântica
 */

import React, { useEffect, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useFinanceiroData } from '@/hooks/financeiro/useFinanceiroData';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import { useAsaasBalance } from '@/hooks/financeiro/useAsaasBalance';
import { useFluxoCaixa } from '@/hooks/financeiro/useFluxoCaixa';
import { useAlertasFinanceiros } from '@/hooks/financeiro/useAlertasFinanceiros';

// Componentes do Dashboard V2
import CashHealthHero from '@/components/admin/financeiro/CashHealthHero';
import RiskCards from '@/components/admin/financeiro/RiskCards';
import ProjectionCard from '@/components/admin/financeiro/ProjectionCard';
import ImmediateActions from '@/components/admin/financeiro/ImmediateActions';
import PerformanceMetrics from '@/components/admin/financeiro/PerformanceMetrics';
import FinanceiroQuickNav from '@/components/admin/financeiro/FinanceiroQuickNav';

const DashboardFinanceiroV2: React.FC = () => {
  const { metricas, inadimplentes, loading: financeiroLoading, refetch, temPermissaoFinanceira } = useFinanceiroData();
  const { balance, summary, loading: balanceLoading, lastUpdated, fetchBalance } = useAsaasBalance();
  const { projecao30d, projecao60d, projecao90d, resumo, fetchFluxoCaixa } = useFluxoCaixa();
  const { alertas, fetchAlertas } = useAlertasFinanceiros();
  const permissions = useFinanceiroPermissions();

  useEffect(() => {
    if (temPermissaoFinanceira && permissions.canView) {
      fetchBalance();
      fetchFluxoCaixa();
      fetchAlertas();
    }
  }, [temPermissaoFinanceira, permissions.canView]);

  const loading = financeiroLoading || balanceLoading;

  // Handler de refresh unificado
  const handleRefresh = () => {
    fetchBalance();
    refetch();
    fetchFluxoCaixa();
    fetchAlertas();
  };

  // Calcular dias de operação baseado no caixa e despesas médias
  const diasOperacao = useMemo(() => {
    const caixa = balance?.available || 0;
    const despesasMensais = (metricas?.despesas_fixas_mes || 0) + (metricas?.despesas_variaveis_mes || 0);
    if (despesasMensais === 0) return 90;
    return Math.floor((caixa / despesasMensais) * 30);
  }, [balance?.available, metricas?.despesas_fixas_mes, metricas?.despesas_variaveis_mes]);

  // Dados para RiskCards
  const riskData = useMemo(() => ({
    cobrancasVencendo: 0, // TODO: Calcular do backend
    cobrancasVencendoValor: 0,
    cobrancasAtrasadas: summary?.overdue_count || metricas?.inadimplencia_count || 0,
    cobrancasAtrasadasValor: summary?.total_overdue || metricas?.inadimplencia_total || 0,
    contasProximas: 0, // TODO: Calcular do backend
    contasProximasValor: 0,
    alertasAtivos: alertas.filter(a => a.ativo && !a.resolvido).length
  }), [summary, metricas, alertas]);

  // Dados para ProjectionCard
  const projecaoData = useMemo(() => {
    const calc30 = projecao30d.reduce((acc, p) => ({ 
      entradas: acc.entradas + p.entradas, 
      saidas: acc.saidas + p.saidas,
      saldo: acc.saldo + p.saldo
    }), { entradas: 0, saidas: 0, saldo: 0 });

    const calc60 = projecao60d.reduce((acc, p) => ({ 
      entradas: acc.entradas + p.entradas, 
      saidas: acc.saidas + p.saidas,
      saldo: acc.saldo + p.saldo
    }), { entradas: 0, saidas: 0, saldo: 0 });

    const calc90 = projecao90d.reduce((acc, p) => ({ 
      entradas: acc.entradas + p.entradas, 
      saidas: acc.saidas + p.saidas,
      saldo: acc.saldo + p.saldo
    }), { entradas: 0, saidas: 0, saldo: 0 });

    return {
      projecao30d: calc30,
      projecao60d: calc60,
      projecao90d: calc90,
      saldoAtual: balance?.available || 0
    };
  }, [projecao30d, projecao60d, projecao90d, balance?.available]);

  // Dados para ImmediateActions
  const actionsData = useMemo(() => ({
    cobrar: { 
      count: riskData.cobrancasAtrasadas, 
      value: riskData.cobrancasAtrasadasValor 
    },
    pagar: { 
      count: riskData.contasProximas, 
      value: riskData.contasProximasValor 
    },
    reconciliar: { 
      count: 0, 
      value: 0 
    },
    alertas: { 
      count: riskData.alertasAtivos 
    }
  }), [riskData]);

  // Dados para PerformanceMetrics
  const performanceData = useMemo(() => ({
    receitaMes: metricas?.receita_realizada || 0,
    receitaMesAnterior: 0, // TODO: Calcular mês anterior
    despesasFixas: metricas?.despesas_fixas_mes || 0,
    despesasFixasAnterior: 0,
    despesasVariaveis: metricas?.despesas_variaveis_mes || 0,
    despesasVariaveisAnterior: 0,
    margemLiquida: metricas?.receita_realizada 
      ? ((metricas.receita_realizada - (metricas.despesas_fixas_mes || 0) - (metricas.despesas_variaveis_mes || 0)) / metricas.receita_realizada) * 100
      : 0,
    margemLiquidaAnterior: 0
  }), [metricas]);

  // Tela de acesso restrito
  if (!temPermissaoFinanceira || !permissions.canView) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center bg-white shadow-sm max-w-md">
          <ShieldAlert className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Você não tem permissão para acessar o módulo financeiro.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header + Navegação Rápida */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-sm text-gray-500">Visão executiva em tempo real</p>
          </div>
          <FinanceiroQuickNav />
        </div>

        {/* CAMADA 1: Situação Atual */}
        <CashHealthHero
          caixaDisponivel={balance?.available || 0}
          diasOperacao={diasOperacao}
          loading={loading}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated || undefined}
        />

        {/* CAMADA 2: Riscos Próximos */}
        <RiskCards {...riskData} />

        {/* CAMADA 3: Projeções */}
        <ProjectionCard {...projecaoData} />

        {/* CAMADA 4: Ações Imediatas */}
        <ImmediateActions {...actionsData} />

        {/* CAMADA 5: Performance */}
        <PerformanceMetrics {...performanceData} />
      </div>
    </div>
  );
};

export default DashboardFinanceiroV2;
