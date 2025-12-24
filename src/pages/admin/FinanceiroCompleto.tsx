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
    fetchPayments(); // Busca todos os status
  }, [fetchBalance, fetchPayments]);

  const handleRefreshAll = () => {
    fetchBalance();
    fetchPayments();
  };

  // Transform payments for table - usando campos REAIS do MP
  const transactionsData = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    return payments.map((p: any) => ({
      id: String(p.id),
      date: p.date_approved 
        ? new Date(p.date_approved).toLocaleDateString('pt-BR')
        : new Date(p.date_created).toLocaleDateString('pt-BR'),
      external_reference: p.external_reference || '',
      payer_name: p.payer_name || '',
      payer_email: p.payer_email || p.payer?.email || '',
      amount: p.transaction_amount || 0,
      net_amount: p.net_received_amount || 0,
      payment_method: p.payment_type_id || p.payment_method_id || '',
      status: p.status || ''
    }));
  }, [payments]);

  // Derive cash flow data from real payments - usando date_approved e net_received_amount
  const cashFlowData = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const grouped: Record<string, number> = {};
    
    payments
      .filter((p: any) => p.status === 'approved' && p.date_approved)
      .forEach((p: any) => {
        const dateStr = new Date(p.date_approved).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        const amount = p.net_received_amount || p.transaction_amount || 0;
        grouped[dateStr] = (grouped[dateStr] || 0) + amount;
      });
    
    return Object.entries(grouped)
      .map(([date, entradas]) => ({ date, entradas, saidas: 0 }))
      .slice(-7);
  }, [payments]);

  // Derive payment methods data - usando payment_type_id
  const paymentMethodsData = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    
    const grouped: Record<string, number> = {};
    const methodLabels: Record<string, string> = {
      'pix': 'PIX',
      'credit_card': 'Cartão Crédito',
      'debit_card': 'Cartão Débito',
      'bank_transfer': 'Transferência',
      'ticket': 'Boleto',
      'account_money': 'Saldo MP'
    };
    
    payments
      .filter((p: any) => p.status === 'approved')
      .forEach((p: any) => {
        const methodType = p.payment_type_id || 'outro';
        const methodName = methodLabels[methodType] || methodType;
        const amount = p.transaction_amount || 0;
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
