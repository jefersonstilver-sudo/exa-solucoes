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
import { TrendingUp, TrendingDown } from 'lucide-react';
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
  // Header narrativo baseado na margem
  const getHeaderNarrative = (): { text: string; color: string } => {
    if (margemLiquida >= margemLiquidaAnterior) {
      return { text: 'Mês positivo', color: 'text-emerald-600' };
    }
    if (margemLiquida >= 0) {
      return { text: 'Mês estável', color: 'text-amber-600' };
    }
    return { text: 'Mês desafiador', color: 'text-red-600' };
  };

  const narrative = getHeaderNarrative();

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
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <CardContent className="p-4 space-y-4">
        {/* Header Narrativo */}
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${narrative.color}`}>
            {narrative.text}
          </p>
          <p className="text-xs text-gray-400">vs mês anterior</p>
        </div>

        {/* Grid de métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {metrics.map((metric) => {
            const variation = calcVariation(metric.value, metric.previousValue);
            const isPositive = variation >= 0;
            const isGood = metric.positiveIsGood ? isPositive : !isPositive;
            const isMargin = metric.id === 'margem';

            return (
              <div 
                key={metric.id} 
                className={`text-center lg:text-left ${isMargin ? 'border-l-4 border-l-blue-500 pl-3' : ''}`}
              >
                <p className="text-xs text-gray-500 font-medium mb-1">{metric.label}</p>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <p className={`font-bold ${isMargin ? 'text-lg' : 'text-base'} text-gray-900`}>
                    {formatValue(metric.value, metric.format)}
                  </p>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    isGood ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(variation).toFixed(0)}%</span>
                  </div>
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
