import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Receipt, 
  Wallet, 
  PiggyBank, 
  ShieldAlert,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Landmark
} from 'lucide-react';
import { useFinanceiroData } from '@/hooks/financeiro/useFinanceiroData';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import { useAsaasBalance } from '@/hooks/financeiro/useAsaasBalance';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

const FinanceiroVisaoGeral: React.FC = () => {
  const { metricas, inadimplentes, loading: financeiroLoading, refetch, temPermissaoFinanceira } = useFinanceiroData();
  const { balance, summary, loading: balanceLoading, lastUpdated, fetchBalance } = useAsaasBalance();
  const permissions = useFinanceiroPermissions();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  useEffect(() => {
    if (temPermissaoFinanceira && permissions.canView) {
      fetchBalance();
    }
  }, [temPermissaoFinanceira, permissions.canView, fetchBalance]);

  const loading = financeiroLoading || balanceLoading;

  if (!temPermissaoFinanceira || !permissions.canView) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center bg-card/80 backdrop-blur-sm">
          <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar o módulo financeiro.</p>
        </Card>
      </div>
    );
  }

  const handleRefresh = () => {
    fetchBalance();
    refetch();
  };

  // Calcular projeção de caixa
  const projecao30d = (balance?.available || 0) + (summary?.total_pending || 0) - (metricas?.despesas_fixas_mes || 0) - (metricas?.despesas_variaveis_mes || 0);
  const projecaoPositiva = projecao30d >= 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground text-sm">Visão executiva em tempo real • Asaas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {new Date(lastUpdated).toLocaleTimeString('pt-BR')}
            </span>
          )}
          <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Saldo Principal - Hero Card */}
      <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Saldo Disponível Asaas</span>
              </div>
              <p className="text-4xl font-bold text-emerald-600">
                {loading ? '...' : formatCurrency(balance?.available || 0)}
              </p>
              {balance?.source === 'error' && (
                <p className="text-xs text-destructive mt-1">Erro ao carregar saldo</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/50 rounded-xl">
                <p className="text-xs text-muted-foreground">A Receber</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(summary?.total_pending || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{summary?.pending_count || 0} cobranças</p>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-xl">
                <p className="text-xs text-muted-foreground">Recebido 30d</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(summary?.total_received || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{summary?.received_count || 0} pagamentos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card 
          className="bg-card/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => navigate(buildPath('financeiro/contas-receber'))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">A Receber</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(metricas?.receita_esperada || 0)}</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-card/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => navigate(buildPath('financeiro/contas-pagar'))}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">A Pagar</span>
            </div>
            <p className="text-lg font-bold">
              {formatCurrency((metricas?.despesas_fixas_mes || 0) + (metricas?.despesas_variaveis_mes || 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Em Atraso</span>
            </div>
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(summary?.total_overdue || metricas?.inadimplencia_total || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary?.overdue_count || metricas?.inadimplencia_count || 0} cobranças
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Despesas Fixas</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(metricas?.despesas_fixas_mes || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Desp. Variáveis</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(metricas?.despesas_variaveis_mes || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Impostos Est.</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(metricas?.impostos_estimados || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Projeção 30 dias */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className={`backdrop-blur-sm ${projecaoPositiva ? 'border-emerald-500/30 bg-emerald-50/50' : 'border-destructive/30 bg-red-50/50'}`}
          onClick={() => navigate(buildPath('financeiro/fluxo-caixa'))}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {projecaoPositiva ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              Projeção 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${projecaoPositiva ? 'text-emerald-600' : 'text-destructive'}`}>
              {formatCurrency(projecao30d)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Se pagar tudo hoje: {projecaoPositiva ? 'Caixa positivo ✅' : 'Caixa negativo ⚠️'}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm border-amber-500/30 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Vencendo em 4 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {formatCurrency(0)} {/* TODO: Implementar busca */}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              0 cobranças próximas do vencimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Central de Inadimplência */}
      {permissions.canViewInadimplencia && inadimplentes.length > 0 && (
        <Card className="border-destructive/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Central de Inadimplência ({inadimplentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inadimplentes.slice(0, 5).map((cliente) => (
                <div key={cliente.client_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-destructive/5 rounded-xl gap-2">
                  <div>
                    <p className="font-medium">{cliente.cliente_nome}</p>
                    <p className="text-sm text-muted-foreground">{cliente.cliente_email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-destructive">{formatCurrency(cliente.total_devido)}</p>
                      <p className="text-xs text-muted-foreground">{cliente.dias_atraso_max} dias</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cliente.risco === 'critico' ? 'bg-destructive text-destructive-foreground' :
                      cliente.risco === 'alto' ? 'bg-orange-500 text-white' :
                      cliente.risco === 'medio' ? 'bg-amber-500 text-white' :
                      'bg-emerald-500 text-white'
                    }`}>
                      {cliente.risco.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {inadimplentes.length > 5 && (
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => navigate(buildPath('financeiro/inadimplencia'))}
              >
                Ver todos ({inadimplentes.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate(buildPath('financeiro/contas-pagar'))}
        >
          <ArrowDownCircle className="h-5 w-5 text-orange-500" />
          <span className="text-xs">Contas a Pagar</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate(buildPath('financeiro/contas-receber'))}
        >
          <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
          <span className="text-xs">Contas a Receber</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate(buildPath('financeiro/fluxo-caixa'))}
        >
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <span className="text-xs">Fluxo de Caixa</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate(buildPath('financeiro/dre'))}
        >
          <Receipt className="h-5 w-5 text-purple-500" />
          <span className="text-xs">DRE Gerencial</span>
        </Button>
      </div>
    </div>
  );
};

export default FinanceiroVisaoGeral;
