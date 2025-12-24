import React, { useEffect, useMemo } from 'react';
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

  // Transform payments for table - using correct field names from API
  const transactionsData = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    return payments.map((p: any) => ({
      id: p.id?.toString() || '',
      date: new Date(p.date_approved || p.date_created).toLocaleDateString('pt-BR'),
      external_reference: p.external_reference || '',
      payer_name: p.payer?.first_name 
        ? `${p.payer.first_name} ${p.payer.last_name || ''}`.trim() 
        : '',
      payer_email: p.payer?.email || '',
      amount: p.amounts?.transaction || p.transaction_amount || 0,
      net_amount: p.amounts?.net_received || p.net_received_amount || 0,
      payment_method: p.payment_method?.type || p.payment_type_id || '',
      status: p.status || ''
    }));
  }, [payments]);

  // Derive cash flow data from real payments
  const cashFlowData = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const grouped: Record<string, number> = {};
    
    payments.forEach((p: any) => {
      if (p.status === 'approved') {
        const dateStr = new Date(p.date_approved || p.date_created).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        const amount = p.amounts?.net_received || p.amounts?.transaction || p.transaction_amount || 0;
        grouped[dateStr] = (grouped[dateStr] || 0) + amount;
      }
    });
    
    return Object.entries(grouped)
      .map(([date, entradas]) => ({ date, entradas, saidas: 0 }))
      .slice(-7);
  }, [payments]);

  // Derive payment methods data from real payments
  const paymentMethodsData = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const grouped: Record<string, number> = {};
    const methodLabels: Record<string, string> = {
      'pix': 'PIX',
      'credit_card': 'Cartão',
      'debit_card': 'Débito',
      'bank_transfer': 'Transferência',
      'ticket': 'Boleto',
      'account_money': 'Saldo MP'
    };
    
    payments.filter((p: any) => p.status === 'approved').forEach((p: any) => {
      const methodType = p.payment_method?.type || p.payment_type_id || 'outro';
      const methodName = methodLabels[methodType] || methodType;
      const amount = p.amounts?.transaction || p.transaction_amount || 0;
      grouped[methodName] = (grouped[methodName] || 0) + amount;
    });
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [payments]);

  return (
    <div className="space-y-6">
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
