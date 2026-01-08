import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFluxoCaixa } from '@/hooks/financeiro/useFluxoCaixa';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import { formatCurrency } from '@/utils/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FluxoCaixaPage: React.FC = () => {
  const { loading, resumo, projecao30d, projecao60d, projecao90d, fetchFluxoCaixa, gerarFluxoDespesasFixas } = useFluxoCaixa();
  const permissions = useFinanceiroPermissions();
  const [periodo, setPeriodo] = useState<'30' | '60' | '90'>('30');

  useEffect(() => {
    if (permissions.canView) {
      fetchFluxoCaixa();
    }
  }, [permissions.canView]);

  const projecaoAtual = periodo === '30' ? projecao30d : periodo === '60' ? projecao60d : projecao90d;

  const totalEntradas = projecaoAtual.reduce((sum, p) => sum + p.entradas, 0);
  const totalSaidas = projecaoAtual.reduce((sum, p) => sum + p.saidas, 0);
  const saldoFinal = projecaoAtual.length > 0 ? projecaoAtual[projecaoAtual.length - 1]?.saldoAcumulado || 0 : 0;

  return (
    <ModernSuperAdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
            <p className="text-muted-foreground text-sm">Projeção de entradas e saídas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={gerarFluxoDespesasFixas} variant="outline" size="sm">
              Atualizar Despesas
            </Button>
            <Button onClick={() => fetchFluxoCaixa()} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={resumo.saldoAtual >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
              <p className={`text-2xl font-bold ${resumo.saldoAtual >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {formatCurrency(resumo.saldoAtual)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                <p className="text-xs text-muted-foreground">Entradas Projetadas</p>
              </div>
              <p className="text-xl font-bold text-emerald-500">{formatCurrency(resumo.entradasProjetadas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
                <p className="text-xs text-muted-foreground">Saídas Projetadas</p>
              </div>
              <p className="text-xl font-bold text-destructive">{formatCurrency(resumo.saidasProjetadas)}</p>
            </CardContent>
          </Card>
          <Card className={resumo.saldoProjetado >= 0 ? 'border-blue-500/30' : 'border-amber-500/30'}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Saldo Projetado</p>
              <p className={`text-2xl font-bold ${resumo.saldoProjetado >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                {formatCurrency(resumo.saldoProjetado)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projeção por Período */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Projeção de Caixa</CardTitle>
              <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as '30' | '60' | '90')}>
                <TabsList>
                  <TabsTrigger value="30">30 dias</TabsTrigger>
                  <TabsTrigger value="60">60 dias</TabsTrigger>
                  <TabsTrigger value="90">90 dias</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumo do período */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Total Entradas</p>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(totalEntradas)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Saídas</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Final</p>
                <p className={`text-lg font-bold ${saldoFinal >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                  {formatCurrency(saldoFinal)}
                </p>
              </div>
            </div>

            {/* Movimentações */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {projecaoAtual.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    {item.entradas > 0 && (
                      <span className="text-emerald-500 font-medium">+{formatCurrency(item.entradas)}</span>
                    )}
                    {item.saidas > 0 && (
                      <span className="text-destructive font-medium">-{formatCurrency(item.saidas)}</span>
                    )}
                    <span className={`font-bold ${item.saldoAcumulado >= 0 ? 'text-foreground' : 'text-amber-500'}`}>
                      {formatCurrency(item.saldoAcumulado)}
                    </span>
                  </div>
                </div>
              ))}
              {projecaoAtual.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">Nenhuma movimentação projetada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernSuperAdminLayout>
  );
};

export default FluxoCaixaPage;
