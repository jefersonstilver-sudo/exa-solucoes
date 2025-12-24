import React, { useEffect, useState } from 'react';
import { useMercadoPagoFinancial } from '@/hooks/admin/useMercadoPagoFinancial';
import BalanceHeroSection from '@/components/admin/financeiro/BalanceHeroSection';
import FinancialKPIsRow from '@/components/admin/financeiro/FinancialKPIsRow';
import CashFlowChart from '@/components/admin/financeiro/CashFlowChart';
import PaymentMethodsChart from '@/components/admin/financeiro/PaymentMethodsChart';
import TransactionsTable from '@/components/admin/financeiro/TransactionsTable';
import { Landmark } from 'lucide-react';

const FinanceiroCompleto: React.FC = () => {
  const {
    balance,
    kpis,
    payments,
    loading,
    paymentsLoading,
    lastUpdated,
    fetchBalance,
    fetchPayments
  } = useMercadoPagoFinancial();

  useEffect(() => {
    fetchBalance();
    fetchPayments();
  }, [fetchBalance, fetchPayments]);

  const handleRefreshAll = () => {
    fetchBalance();
    fetchPayments();
  };

  // Derive chart data from real payments
  const cashFlowData = React.useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const grouped: Record<string, { entradas: number; saidas: number }> = {};
    
    payments.forEach(p => {
      const date = new Date(p.date_approved || p.date_created).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!grouped[date]) {
        grouped[date] = { entradas: 0, saidas: 0 };
      }
      if (p.status === 'approved') {
        grouped[date].entradas += p.net_received_amount || p.transaction_amount || 0;
      }
      if (p.status === 'refunded' || p.status === 'cancelled') {
        grouped[date].saidas += p.transaction_amount || 0;
      }
    });
    
    return Object.entries(grouped)
      .map(([date, values]) => ({ date, ...values }))
      .slice(-7);
  }, [payments]);

  const paymentMethodsData = React.useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const grouped: Record<string, number> = {};
    
    payments.filter(p => p.status === 'approved').forEach(p => {
      const method = p.payment_type_id || 'Outro';
      const methodName = method === 'credit_card' ? 'Cartão' : 
                        method === 'debit_card' ? 'Débito' :
                        method === 'bank_transfer' || method === 'pix' ? 'PIX' :
                        method === 'ticket' ? 'Boleto' : 'Outro';
      grouped[methodName] = (grouped[methodName] || 0) + (p.transaction_amount || 0);
    });
    
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#6B7280'];
    return Object.entries(grouped).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [payments]);

  // Transform payments for table
  const transactionsData = React.useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    return payments.map(p => ({
      id: p.id?.toString() || '',
      date: new Date(p.date_approved || p.date_created).toLocaleDateString('pt-BR'),
      pedido_id: p.external_reference ? `#${p.external_reference.slice(0, 8)}` : '—',
      client_name: p.payer?.first_name ? `${p.payer.first_name} ${p.payer.last_name || ''}`.trim() : p.payer?.email || '—',
      value: p.transaction_amount || 0,
      net_value: p.net_received_amount || 0,
      payment_method: p.payment_type_id === 'credit_card' ? 'Cartão' :
                     p.payment_type_id === 'pix' || p.payment_type_id === 'bank_transfer' ? 'PIX' :
                     p.payment_type_id === 'ticket' ? 'Boleto' : p.payment_type_id || '—',
      status: p.status === 'approved' ? 'Aprovado' : 
             p.status === 'pending' ? 'Pendente' :
             p.status === 'rejected' ? 'Rejeitado' : p.status || '—',
      mp_verified: p.status === 'approved' ? 'verified' as const : 
                  p.status === 'pending' ? 'warning' as const : 'critical' as const
    }));
  }, [payments]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Landmark className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro Mercado Pago</h1>
          <p className="text-sm text-muted-foreground">
            Dados em tempo real da sua conta Mercado Pago
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
        <CashFlowChart data={cashFlowData} loading={paymentsLoading} />
        <PaymentMethodsChart data={paymentMethodsData} loading={paymentsLoading} />
      </div>

      {/* Transactions Table */}
      <TransactionsTable 
        data={transactionsData} 
        loading={paymentsLoading} 
        onRefresh={handleRefreshAll} 
      />
    </div>
  );
};

export default FinanceiroCompleto;
