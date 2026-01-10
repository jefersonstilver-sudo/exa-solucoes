/**
 * ProjectionCard - Bloco 3: Projeção Financeira
 * 
 * Card com tabs 30/60/90 dias que responde:
 * "Como estará meu caixa em X dias?"
 * 
 * Design: Minimalista com indicador de risco via badge
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface ProjectionData {
  entradas: number;
  saidas: number;
  saldo: number;
}

interface ProjectionCardProps {
  projecao30d: ProjectionData;
  projecao60d: ProjectionData;
  projecao90d: ProjectionData;
  saldoAtual: number;
}

type RiskLevel = 'safe' | 'attention' | 'critical';

const ProjectionCard: React.FC<ProjectionCardProps> = ({
  projecao30d,
  projecao60d,
  projecao90d,
  saldoAtual
}) => {
  const [periodo, setPeriodo] = useState<'30' | '60' | '90'>('30');

  const projecaoAtual = periodo === '30' ? projecao30d : periodo === '60' ? projecao60d : projecao90d;
  const saldoProjetado = saldoAtual + projecaoAtual.saldo;

  // Determinar nível de risco
  const getRiskLevel = (): RiskLevel => {
    if (saldoProjetado >= saldoAtual * 0.5) return 'safe';
    if (saldoProjetado >= 0) return 'attention';
    return 'critical';
  };

  const riskLevel = getRiskLevel();

  const riskConfig = {
    safe: {
      label: 'Seguro',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    attention: {
      label: 'Atenção',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    },
    critical: {
      label: 'Crítico',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    }
  };

  const config = riskConfig[riskLevel];

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-base font-semibold text-gray-900">
              Projeção Financeira
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              className={`${config.bgColor} ${config.textColor} ${config.borderColor} border font-medium`}
              variant="outline"
            >
              {config.label}
            </Badge>
            
            <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as '30' | '60' | '90')}>
              <TabsList className="h-8 bg-gray-100">
                <TabsTrigger value="30" className="text-xs px-3 h-6">30d</TabsTrigger>
                <TabsTrigger value="60" className="text-xs px-3 h-6">60d</TabsTrigger>
                <TabsTrigger value="90" className="text-xs px-3 h-6">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Grid de métricas */}
        <div className="grid grid-cols-3 gap-6">
          {/* Entradas */}
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 mb-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500 font-medium">Entradas</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(projecaoAtual.entradas)}
            </p>
          </div>

          {/* Saídas */}
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 mb-2">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <span className="text-xs text-gray-500 font-medium">Saídas</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(projecaoAtual.saidas)}
            </p>
          </div>

          {/* Saldo Projetado */}
          <div className={`text-center p-4 rounded-lg ${saldoProjetado >= 0 ? 'bg-gray-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-center gap-1 mb-2">
              <Minus className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium">Saldo Final</span>
            </div>
            <p className={`text-xl font-bold ${saldoProjetado >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(saldoProjetado)}
            </p>
          </div>
        </div>

        {/* Nota explicativa */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Projeção baseada em cobranças pendentes e despesas agendadas para os próximos {periodo} dias
        </p>
      </CardContent>
    </Card>
  );
};

export default ProjectionCard;
