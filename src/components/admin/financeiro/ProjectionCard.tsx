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
      label: 'Projeção segura',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    attention: {
      label: 'Requer atenção',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    },
    critical: {
      label: 'Risco identificado',
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

      <CardContent className="space-y-6">
        {/* Saldo Projetado - Destaque Principal */}
        <div className={`text-center p-6 rounded-xl ${saldoProjetado >= 0 ? 'bg-gray-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-500 font-medium mb-2">
            Você terá em {periodo} dias
          </p>
          <div className="flex items-center justify-center gap-3">
            <p className={`text-3xl lg:text-4xl font-bold ${saldoProjetado >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(saldoProjetado)}
            </p>
            {saldoProjetado < saldoAtual && (
              <ArrowDownRight className="h-5 w-5 text-amber-500" />
            )}
            {saldoProjetado >= saldoAtual && (
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            )}
          </div>
        </div>

        {/* Grid de métricas secundárias */}
        <div className="grid grid-cols-2 gap-4">
          {/* Entradas */}
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-gray-500 font-medium">Entradas</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(projecaoAtual.entradas)}
            </p>
          </div>

          {/* Saídas */}
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-gray-500 font-medium">Saídas</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(projecaoAtual.saidas)}
            </p>
          </div>
        </div>

        {/* Nota explicativa */}
        <p className="text-xs text-gray-400 text-center">
          Projeção baseada em cobranças e despesas agendadas
        </p>
      </CardContent>
    </Card>
  );
};

export default ProjectionCard;
