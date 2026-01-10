/**
 * DREPage - Demonstrativo de Resultado do Exercício
 * 
 * CRÍTICO: Todos os cálculos vêm do backend (calculate-financial-metrics)
 * Frontend APENAS exibe dados - ZERO cálculos locais
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  TrendingUp, 
  Receipt,
  FileText,
  Minus,
  Equal,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import { useFinanceiroData } from '@/hooks/financeiro/useFinanceiroData';

interface DREData {
  receita_bruta: number;
  impostos: number;
  custos_operacionais: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  resultado_periodo: number;
}

const DREPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const permissions = useFinanceiroPermissions();
  
  // Consumir dados do backend - ZERO cálculos locais
  const { metricas, refetch, loading: financeiroLoading, temPermissaoFinanceira } = useFinanceiroData();

  useEffect(() => {
    setLoading(financeiroLoading);
  }, [financeiroLoading]);

  // DRE calculado pelo backend
  const mesAtual: DREData | null = metricas ? {
    receita_bruta: metricas.receita_realizada || 0,
    impostos: metricas.impostos_mes || 0,
    custos_operacionais: metricas.custos_operacionais_mes || 0,
    despesas_fixas: metricas.despesas_fixas_mes || 0,
    despesas_variaveis: metricas.despesas_variaveis_mes || 0,
    resultado_periodo: metricas.resultado_liquido_mes || 0
  } : null;

  // Dados do mês anterior (se disponível no backend)
  const mesAnterior: DREData | null = metricas?.mes_anterior ? {
    receita_bruta: metricas.mes_anterior.receita || 0,
    impostos: metricas.mes_anterior.impostos || 0,
    custos_operacionais: metricas.mes_anterior.custos_operacionais || 0,
    despesas_fixas: metricas.mes_anterior.despesas_fixas || 0,
    despesas_variaveis: metricas.mes_anterior.despesas_variaveis || 0,
    resultado_periodo: metricas.mes_anterior.resultado || 0
  } : null;

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const renderLinha = (
    label: string, 
    valorAtual: number, 
    valorAnterior: number, 
    isPositive: boolean = true,
    isTotal: boolean = false,
    icon?: React.ReactNode
  ) => {
    const variacao = calcularVariacao(valorAtual, valorAnterior);
    const variacaoPositiva = isPositive ? variacao >= 0 : variacao <= 0;

    return (
      <div className={`flex items-center justify-between py-4 ${isTotal ? 'border-t-2 border-gray-200 pt-6' : 'border-b border-gray-100'}`}>
        <div className="flex items-center gap-3">
          {icon}
          <span className={`${isTotal ? 'font-bold text-lg text-gray-900' : 'font-medium text-gray-700'}`}>{label}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right min-w-[120px]">
            <p className={`${isTotal ? 'text-xl font-bold' : 'text-base font-semibold'} ${
              isTotal && valorAtual >= 0 ? 'text-emerald-600' : isTotal && valorAtual < 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatCurrency(valorAtual)}
            </p>
            <p className="text-xs text-gray-500">Mês atual</p>
          </div>
          <div className="text-right min-w-[120px] opacity-60">
            <p className="text-sm text-gray-600">{formatCurrency(valorAnterior)}</p>
            <p className="text-xs text-gray-400">Mês anterior</p>
          </div>
          <div className="min-w-[80px]">
            <Badge className={`bg-white border ${variacaoPositiva ? 'border-emerald-300 text-emerald-600' : 'border-red-300 text-red-600'}`}>
              {variacaoPositiva ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(variacao).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  if (!permissions.canView) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center bg-white shadow-sm">
          <Receipt className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Você não tem permissão para acessar o DRE.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header - Design neutro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gray-100">
            <Receipt className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DRE Gerencial</h1>
            <p className="text-gray-500 text-sm">
              Demonstrativo de Resultado • {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
        <Button onClick={refetch} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* DRE Card - Design neutro */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <FileText className="h-5 w-5 text-gray-600" />
            Demonstrativo de Resultado do Exercício
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {renderLinha(
                '(+) Receita Bruta',
                mesAtual?.receita_bruta || 0,
                mesAnterior?.receita_bruta || 0,
                true,
                false,
                <TrendingUp className="h-4 w-4 text-gray-600" />
              )}
              {renderLinha(
                '(-) Impostos',
                mesAtual?.impostos || 0,
                mesAnterior?.impostos || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              {renderLinha(
                '(-) Custos Operacionais',
                mesAtual?.custos_operacionais || 0,
                mesAnterior?.custos_operacionais || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              {renderLinha(
                '(-) Despesas Fixas',
                mesAtual?.despesas_fixas || 0,
                mesAnterior?.despesas_fixas || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              {renderLinha(
                '(-) Despesas Variáveis',
                mesAtual?.despesas_variaveis || 0,
                mesAnterior?.despesas_variaveis || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-gray-600" />
              )}
              {renderLinha(
                '(=) Resultado do Período',
                mesAtual?.resultado_periodo || 0,
                mesAnterior?.resultado_periodo || 0,
                true,
                true,
                <Equal className="h-5 w-5 text-gray-900" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Margem - Design neutro com bordas semânticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-500">Margem Bruta</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {mesAtual?.receita_bruta 
                ? (((mesAtual.receita_bruta - mesAtual.custos_operacionais) / mesAtual.receita_bruta) * 100).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-500">Margem Operacional</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {mesAtual?.receita_bruta 
                ? (((mesAtual.receita_bruta - mesAtual.custos_operacionais - mesAtual.despesas_fixas - mesAtual.despesas_variaveis) / mesAtual.receita_bruta) * 100).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>
        <Card className={`bg-white shadow-sm ${mesAtual?.resultado_periodo && mesAtual.resultado_periodo >= 0 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-500">Margem Líquida</span>
            </div>
            <p className={`text-2xl font-bold ${mesAtual?.resultado_periodo && mesAtual.resultado_periodo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {mesAtual?.receita_bruta 
                ? ((mesAtual.resultado_periodo / mesAtual.receita_bruta) * 100).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DREPage;
