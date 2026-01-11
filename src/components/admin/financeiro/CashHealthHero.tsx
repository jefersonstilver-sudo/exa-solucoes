/**
 * CashHealthHero - Bloco 1: Saúde do Caixa
 * 
 * Card Hero principal que responde em 1 segundo:
 * "Como está meu caixa AGORA?"
 * 
 * Design: Minimalista, neutro, com cores apenas para status semântico (bordas)
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface CashHealthHeroProps {
  caixaDisponivel: number;
  diasOperacao: number;
  entradas?: number;
  saidas?: number;
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string;
}

type CashStatus = 'healthy' | 'warning' | 'critical';

const CashHealthHero: React.FC<CashHealthHeroProps> = ({
  caixaDisponivel,
  diasOperacao,
  entradas = 0,
  saidas = 0,
  loading = false,
  onRefresh,
  lastUpdated
}) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  // Determinar status baseado em dias de operação
  const getStatus = (): CashStatus => {
    if (diasOperacao >= 30) return 'healthy';
    if (diasOperacao >= 15) return 'warning';
    return 'critical';
  };

  const status = getStatus();

  const statusConfig = {
    healthy: {
      borderColor: 'border-l-emerald-500',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      label: 'Caixa confortável',
      sublabel: `Autonomia de ${diasOperacao} dias`,
      explanation: 'Seu caixa atual cobre mais de 30 dias de operação. Situação financeira saudável.',
      href: null as string | null,
      hrefLabel: null as string | null
    },
    warning: {
      borderColor: 'border-l-amber-500',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600',
      label: 'Atenção recomendada',
      sublabel: `${diasOperacao} dias de operação`,
      explanation: `Seu caixa cobre apenas ${diasOperacao} dias. Considere acelerar recebimentos ou revisar despesas não essenciais.`,
      href: buildPath('financeiro/fluxo-caixa'),
      hrefLabel: 'Ver fluxo de caixa'
    },
    critical: {
      borderColor: 'border-l-red-500',
      dotColor: 'bg-red-500',
      textColor: 'text-red-600',
      label: 'Ação necessária',
      sublabel: `Apenas ${diasOperacao} dias restantes`,
      explanation: `Com apenas ${diasOperacao} dias de caixa, você precisa agir agora: cobrar clientes inadimplentes ou adiar pagamentos não críticos.`,
      href: buildPath('financeiro/contas-receber'),
      hrefLabel: 'Ver cobranças pendentes'
    }
  };

  const config = statusConfig[status];

  return (
    <Card className={`bg-white/80 backdrop-blur-sm border-l-4 ${config.borderColor} shadow-lg hover:shadow-xl transition-shadow duration-300 h-full`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Label e Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Caixa Disponível</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                      <span className={`text-xs font-medium ${config.textColor}`}>
                        {config.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs p-3 bg-popover border border-border shadow-lg">
                    <p className="text-sm text-popover-foreground">{config.explanation}</p>
                    {config.href && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2 p-0 h-auto text-primary"
                        onClick={() => navigate(config.href!)}
                      >
                        {config.hrefLabel} →
                      </Button>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              disabled={loading}
              className="h-7 px-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Valor Principal */}
          <div>
            {loading ? (
              <div className="h-10 w-40 bg-gray-100 animate-pulse rounded" />
            ) : (
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(caixaDisponivel)}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Autonomia de {diasOperacao} dias
            </p>
          </div>

          {/* Mini Grid Entradas/Saídas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-gray-50">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Entradas</span>
              </div>
              <p className="text-sm font-semibold text-emerald-600">
                {formatCurrency(entradas)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Saídas</span>
              </div>
              <p className="text-sm font-semibold text-red-600">
                {formatCurrency(saidas)}
              </p>
            </div>
          </div>

          {/* CTA Ver Fluxo */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-between h-8 text-xs"
            onClick={() => navigate(buildPath('financeiro/fluxo-caixa'))}
          >
            <span>Ver Fluxo de Caixa</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          {/* Última atualização */}
          {lastUpdated && (
            <p className="text-[10px] text-gray-400 text-center">
              Atualizado: {new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CashHealthHero;
