import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, DollarSign, CreditCard, Receipt, Wallet, PiggyBank, ShieldAlert } from 'lucide-react';
import { useFinanceiroData } from '@/hooks/financeiro/useFinanceiroData';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import { formatCurrency } from '@/utils/format';

const FinanceiroDashboard: React.FC = () => {
  const { metricas, inadimplentes, loading, refetch, temPermissaoFinanceira } = useFinanceiroData();
  const permissions = useFinanceiroPermissions();

  if (!temPermissaoFinanceira || !permissions.canView) {
    return (
      <ModernSuperAdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar o módulo financeiro.</p>
          </Card>
        </div>
      </ModernSuperAdminLayout>
    );
  }

  const getStatusColor = (value: number, thresholds: { warning: number; danger: number }, inverse = false) => {
    if (inverse) {
      if (value >= thresholds.danger) return 'text-destructive';
      if (value >= thresholds.warning) return 'text-amber-500';
      return 'text-emerald-500';
    }
    if (value <= thresholds.danger) return 'text-destructive';
    if (value <= thresholds.warning) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <ModernSuperAdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
            <p className="text-muted-foreground text-sm">Visão executiva em tempo real</p>
          </div>
          <Button onClick={refetch} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Receita Esperada</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(metricas?.receita_esperada || 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Receita Realizada</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(metricas?.receita_realizada || 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Inadimplência</span>
              </div>
              <p className="text-lg font-bold text-destructive">{formatCurrency(metricas?.inadimplencia_total || 0)}</p>
              <p className="text-xs text-muted-foreground">{metricas?.inadimplencia_count || 0} cobranças</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Despesas Fixas</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(metricas?.despesas_fixas_mes || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Despesas Variáveis</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(metricas?.despesas_variaveis_mes || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-cyan-500" />
                <span className="text-xs text-muted-foreground">Impostos</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(metricas?.impostos_estimados || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Saldo e Projeção */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className={metricas && metricas.saldo_atual >= 0 ? 'border-emerald-500/30' : 'border-destructive/30'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Saldo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${metricas && metricas.saldo_atual >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {formatCurrency(metricas?.saldo_atual || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Margem líquida: {metricas?.margem_liquida?.toFixed(1) || 0}%
              </p>
            </CardContent>
          </Card>

          <Card className={metricas && metricas.saldo_projetado_30d >= 0 ? 'border-blue-500/30' : 'border-amber-500/30'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projeção 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${metricas && metricas.saldo_projetado_30d >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                {formatCurrency(metricas?.saldo_projetado_30d || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Taxa inadimplência: {metricas?.taxa_inadimplencia?.toFixed(1) || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inadimplentes */}
        {permissions.canViewInadimplencia && inadimplentes.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Central de Inadimplência ({inadimplentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inadimplentes.slice(0, 5).map((cliente) => (
                  <div key={cliente.client_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-destructive/5 rounded-lg gap-2">
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
            </CardContent>
          </Card>
        )}
      </div>
    </ModernSuperAdminLayout>
  );
};

export default FinanceiroDashboard;
