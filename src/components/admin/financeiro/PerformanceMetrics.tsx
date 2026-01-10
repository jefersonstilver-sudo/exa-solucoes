/**
 * PerformanceMetrics - Bloco 5: Performance & Análise
 * 
 * Métricas inline que respondem:
 * "A empresa está performando bem?"
 * 
 * Design: Lista horizontal fluida, sem cards separados
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface MetricItem {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'percent';
  positiveIsGood: boolean;
}

interface PerformanceMetricsProps {
  receitaMes: number;
  receitaMesAnterior: number;
  despesasFixas: number;
  despesasFixasAnterior: number;
  despesasVariaveis: number;
  despesasVariaveisAnterior: number;
  margemLiquida: number;
  margemLiquidaAnterior: number;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  receitaMes,
  receitaMesAnterior,
  despesasFixas,
  despesasFixasAnterior,
  despesasVariaveis,
  despesasVariaveisAnterior,
  margemLiquida,
  margemLiquidaAnterior
}) => {
  const metrics: MetricItem[] = [
    {
      id: 'receita',
      label: 'Receita do Mês',
      value: receitaMes,
      previousValue: receitaMesAnterior,
      format: 'currency',
      positiveIsGood: true
    },
    {
      id: 'despesas-fixas',
      label: 'Despesas Fixas',
      value: despesasFixas,
      previousValue: despesasFixasAnterior,
      format: 'currency',
      positiveIsGood: false
    },
    {
      id: 'despesas-variaveis',
      label: 'Despesas Variáveis',
      value: despesasVariaveis,
      previousValue: despesasVariaveisAnterior,
      format: 'currency',
      positiveIsGood: false
    },
    {
      id: 'margem',
      label: 'Margem Líquida',
      value: margemLiquida,
      previousValue: margemLiquidaAnterior,
      format: 'percent',
      positiveIsGood: true
    }
  ];

  const calcVariation = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const formatValue = (value: number, format: 'currency' | 'percent'): string => {
    if (format === 'currency') return formatCurrency(value);
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {metrics.map((metric) => {
            const variation = calcVariation(metric.value, metric.previousValue);
            const isPositive = variation >= 0;
            const isGood = metric.positiveIsGood ? isPositive : !isPositive;

            return (
              <div key={metric.id} className="text-center lg:text-left">
                <p className="text-xs text-gray-500 font-medium mb-1">{metric.label}</p>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <p className="text-lg font-bold text-gray-900">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  <Badge 
                    variant="outline"
                    className={`text-xs font-medium ${
                      isGood 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(variation).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
