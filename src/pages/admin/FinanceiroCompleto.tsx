import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useMercadoPagoFinancial } from '@/hooks/admin/useMercadoPagoFinancial';
import BalanceHeroSection from '@/components/admin/financeiro/BalanceHeroSection';
import FinancialKPIsRow from '@/components/admin/financeiro/FinancialKPIsRow';
import OrderAuditCard from '@/components/admin/financeiro/OrderAuditCard';
import CashFlowChart from '@/components/admin/financeiro/CashFlowChart';
import PaymentMethodsChart from '@/components/admin/financeiro/PaymentMethodsChart';
import TransactionsTable from '@/components/admin/financeiro/TransactionsTable';
import { Landmark } from 'lucide-react';

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

  const handleRefreshAll = () => {
    fetchBalance();
    runAudit();
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashFlowChart loading={loading} />
          <PaymentMethodsChart loading={loading} />
        </div>

        {/* Audit Card */}
        <OrderAuditCard
          stats={auditStats}
          alerts={auditAlerts}
          loading={auditLoading}
          onRunAudit={runAudit}
        />

        {/* Transactions Table */}
        <TransactionsTable loading={loading} onRefresh={handleRefreshAll} />
      </div>
    </Layout>
  );
};

export default FinanceiroCompleto;
