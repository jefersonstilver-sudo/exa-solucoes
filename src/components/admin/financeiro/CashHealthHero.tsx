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
import { Wallet, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface CashHealthHeroProps {
  caixaDisponivel: number;
  diasOperacao: number;
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string;
}

type CashStatus = 'healthy' | 'warning' | 'critical';

const CashHealthHero: React.FC<CashHealthHeroProps> = ({
  caixaDisponivel,
  diasOperacao,
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
      label: 'Saudável'
    },
    warning: {
      borderColor: 'border-l-amber-500',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600',
      label: 'Atenção'
    },
    critical: {
      borderColor: 'border-l-red-500',
      dotColor: 'bg-red-500',
      textColor: 'text-red-600',
      label: 'Crítico'
    }
  };

  const config = statusConfig[status];

  return (
    <Card className={`bg-white border-l-4 ${config.borderColor} shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Seção Principal */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-100">
                <Wallet className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Caixa Disponível</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                  <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
                </div>
              </div>
            </div>

            {/* Valor Principal */}
            <div className="mb-4">
              {loading ? (
                <div className="h-12 w-48 bg-gray-100 animate-pulse rounded" />
              ) : (
                <p className="text-4xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(caixaDisponivel)}
                </p>
              )}
            </div>

            {/* Frase Contextual */}
            <p className="text-sm text-gray-500">
              No ritmo atual, o caixa sustenta{' '}
              <span className={`font-semibold ${config.textColor}`}>
                {diasOperacao} dias
              </span>{' '}
              de operação
            </p>

            {/* Última atualização */}
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">
                Atualizado: {new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-between"
              onClick={() => navigate(buildPath('financeiro/fluxo-caixa'))}
            >
              <span>Ver Fluxo</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashHealthHero;
