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
    <Card className="bg-white shadow-sm h-full">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm font-semibold text-gray-900">
              Projeção
            </CardTitle>
          </div>
          
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as '30' | '60' | '90')}>
            <TabsList className="h-7 bg-gray-100">
              <TabsTrigger value="30" className="text-[10px] px-2.5 h-5">30d</TabsTrigger>
              <TabsTrigger value="60" className="text-[10px] px-2.5 h-5">60d</TabsTrigger>
              <TabsTrigger value="90" className="text-[10px] px-2.5 h-5">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {/* Saldo Projetado - Destaque Principal */}
        <div className={`text-center p-4 rounded-lg ${saldoProjetado >= 0 ? 'bg-gray-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500 font-medium mb-1">
            Você terá em {periodo} dias
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className={`text-2xl lg:text-3xl font-bold ${saldoProjetado >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(saldoProjetado)}
            </p>
            {saldoProjetado < saldoAtual ? (
              <ArrowDownRight className="h-4 w-4 text-amber-500" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </div>

        {/* Badge de Risco */}
        <div className="flex justify-center">
          <Badge 
            className={`${config.bgColor} ${config.textColor} ${config.borderColor} border text-[10px] font-medium`}
            variant="outline"
          >
            {config.label}
          </Badge>
        </div>

        {/* Grid de métricas secundárias */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-gray-500 font-medium">Entradas</span>
            </div>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(projecaoAtual.entradas)}
            </p>
          </div>

          <div className="text-center p-2 rounded-lg bg-gray-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <ArrowDownRight className="h-3 w-3 text-red-500" />
              <span className="text-[10px] text-gray-500 font-medium">Saídas</span>
            </div>
            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(projecaoAtual.saidas)}
            </p>
          </div>
        </div>

        {/* Nota explicativa */}
        <p className="text-[10px] text-gray-400 text-center">
          Baseado em cobranças e despesas agendadas
        </p>
      </CardContent>
    </Card>
  );
};

export default ProjectionCard;
