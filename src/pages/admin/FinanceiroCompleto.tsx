import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useMercadoPagoFinancial } from '@/hooks/admin/useMercadoPagoFinancial';
import BalanceHeroSection from '@/components/admin/financeiro/BalanceHeroSection';
import FinancialKPIsRow from '@/components/admin/financeiro/FinancialKPIsRow';
import OrderAuditCard from '@/components/admin/financeiro/OrderAuditCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, TrendingUp } from 'lucide-react';

const FinanceiroCompleto: React.FC = () => {
  const {
    balance,
    kpis,
    auditStats,
    auditAlerts,
    loading,
    auditLoading,
    lastUpdated,
    fetchBalance,
    runAudit
  } = useMercadoPagoFinancial();

  useEffect(() => {
    fetchBalance();
    runAudit();
  }, [fetchBalance, runAudit]);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro Completo</h1>
            <p className="text-sm text-muted-foreground">
              Módulo integrado Mercado Pago com auditoria anti-fraude
            </p>
          </div>
        </div>

        {/* Balance Hero */}
        <BalanceHeroSection
          balance={balance}
          loading={loading}
          onRefresh={fetchBalance}
          lastUpdated={lastUpdated || undefined}
        />

        {/* KPIs Row */}
        <FinancialKPIsRow data={kpis} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Audit Card */}
          <OrderAuditCard
            stats={auditStats}
            alerts={auditAlerts}
            loading={auditLoading}
            onRunAudit={runAudit}
          />

          {/* Summary Card */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Receita Bruta (30d)</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {((kpis?.revenue_30d || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Receita Líquida</p>
                  <p className="text-xl font-bold text-emerald-600">
                    R$ {((kpis?.net_margin || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Taxas Mercado Pago</p>
                  <p className="text-xl font-bold text-orange-600">
                    R$ {((kpis?.mp_fees || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <p className="text-xl font-bold text-blue-600">
                    R$ {((kpis?.avg_ticket || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FinanceiroCompleto;
