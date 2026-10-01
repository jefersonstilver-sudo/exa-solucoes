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

import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import { useAsaasBalance } from '@/hooks/financeiro/useAsaasBalance';
import { useExecutiveFinance } from '@/hooks/financeiro/useExecutiveFinance';
import FinanceiroQuickNav from '@/components/admin/financeiro/FinanceiroQuickNav';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { formatCurrency } from '@/utils/format';

const DashboardFinanceiroV2: React.FC = () => {
  const { balance, fetchBalance } = useAsaasBalance();
  const permissions = useFinanceiroPermissions();
  const { snapshot, loading: executiveLoading, refresh } = useExecutiveFinance();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  React.useEffect(() => { if (permissions.canView) void fetchBalance(); }, [permissions.canView, fetchBalance]);
  const temPermissaoFinanceira = permissions.canView;

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

  const value = (amount: number | null | undefined) => amount == null ? 'Indisponível' : formatCurrency(amount);
  const primary = [
    ['Saldo Asaas ao vivo', balance?.source === 'asaas' ? balance.available : null],
    ['Entradas realizadas · mês', snapshot?.entradas],
    ['Saídas realizadas · mês', snapshot?.saidas],
    ['Resultado de caixa · mês', snapshot ? snapshot.entradas - snapshot.saidas : null],
  ] as const;
  const commitments = [
    ['Receita de cobranças recebidas · Asaas', snapshot?.receita],
    ['Receita recorrente contratada · MRR', snapshot?.mrr],
    ['Receita prevista · mês', snapshot?.previsto],
    ['Inadimplência registrada', snapshot?.inadimplencia],
    ['Contas a pagar · mês', snapshot?.contasPagar],
    ['Despesas fixas · cadastro ativo', snapshot?.fixas],
    ['Despesas variáveis · mês', snapshot?.variaveis],
  ] as const;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
          <div><h1 className="text-2xl font-semibold">Financeiro</h1><p className="text-sm text-muted-foreground">Caixa realizado no Asaas · compromissos separados</p></div>
          <Button variant="outline" size="icon" title="Atualizar indicadores" aria-label="Atualizar indicadores" onClick={() => { void refresh(); void fetchBalance(); }}><RefreshCw className="h-4 w-4" /></Button>
        </header>
        <section aria-label="Caixa realizado" className="grid gap-5 border-b pb-8 sm:grid-cols-2 lg:grid-cols-4">
          {primary.map(([label, amount]) => <div key={label} className="space-y-2"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{executiveLoading && !snapshot ? 'Carregando…' : value(amount)}</p></div>)}
        </section>
        <section aria-label="Saúde da conciliação" className="space-y-3 border-b pb-8">
          <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /><h2 className="text-lg font-semibold">Saúde da conciliação</h2></div>
          <p role="status" className="text-sm text-destructive">{executiveLoading && !snapshot ? 'Verificando espelho…' : snapshot?.certified ? 'Conciliação por ID verificada neste espelho.' : snapshot?.warning || 'Não foi possível certificar o espelho financeiro; números indisponíveis.'}</p>
          <p className="text-sm text-muted-foreground">Última sincronização: {snapshot?.lastSync ? new Date(snapshot.lastSync).toLocaleString('pt-BR') : 'Indisponível'} · Pendências/exceções: {snapshot ? snapshot.pendencias : 'Indisponível'} · {snapshot ? `${snapshot.total} movimentos` : 'Quantidade indisponível'}</p>
          <Button variant="outline" onClick={() => navigate(buildPath('financeiro/extrato'))}>Abrir extrato <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </section>
        <section aria-label="Contratado e obrigações" className="space-y-5">
          <h2 className="text-lg font-semibold">Contratado, previsto e obrigações</h2>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {commitments.map(([label, amount]) => <div key={label} className="border-b pb-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg font-medium tabular-nums">{executiveLoading && !snapshot ? 'Carregando…' : value(amount)}</p></div>)}
          </div>
          <p className="text-xs text-muted-foreground">MRR e previsão não são dinheiro recebido. Movimentos bancários incluem transferências e taxas; correspondência por ID não dá baixa em obrigações.</p>
        </section>
        <section aria-label="Acesso às áreas financeiras"><FinanceiroQuickNav /></section>
      </div>
    </main>
  );
};

export default DashboardFinanceiroV2;
