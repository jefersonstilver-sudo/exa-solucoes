/**
 * RiskCards - Bloco 2: Riscos Próximos
 * 
 * Grid de 4 cards que responde:
 * "O que pode dar errado nos próximos dias?"
 * 
 * Design: Cards minimalistas com borda colorida apenas para criticidade
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  AlertTriangle, 
  ArrowDownCircle, 
  Bell 
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface RiskCardData {
  id: string;
  title: string;
  count: number;
  value: number;
  icon: React.ReactNode;
  borderColor: string;
  href: string;
}

interface RiskCardsProps {
  cobrancasVencendo: number;
  cobrancasVencendoValor: number;
  cobrancasAtrasadas: number;
  cobrancasAtrasadasValor: number;
  contasProximas: number;
  contasProximasValor: number;
  alertasAtivos: number;
}

const RiskCards: React.FC<RiskCardsProps> = ({
  cobrancasVencendo,
  cobrancasVencendoValor,
  cobrancasAtrasadas,
  cobrancasAtrasadasValor,
  contasProximas,
  contasProximasValor,
  alertasAtivos
}) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  // Microcopy inteligente para estados vazios
  const getEmptyMessage = (id: string): string => {
    switch (id) {
      case 'vencendo': return 'Nenhum vencimento próximo ✓';
      case 'atrasadas': return 'Nenhum atraso detectado ✓';
      case 'contas': return 'Sem contas críticas ✓';
      case 'alertas': return 'Sistema estável ✓';
      default: return 'Tudo certo ✓';
    }
  };

  const cards: RiskCardData[] = [
    {
      id: 'vencendo',
      title: 'Cobranças Vencendo',
      count: cobrancasVencendo,
      value: cobrancasVencendoValor,
      icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
      borderColor: 'border-l-amber-500',
      href: buildPath('financeiro/contas-receber')
    },
    {
      id: 'atrasadas',
      title: 'Cobranças Atrasadas',
      count: cobrancasAtrasadas,
      value: cobrancasAtrasadasValor,
      icon: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
      borderColor: 'border-l-red-500',
      href: buildPath('financeiro/contas-receber')
    },
    {
      id: 'contas',
      title: 'Contas Próximas',
      count: contasProximas,
      value: contasProximasValor,
      icon: <ArrowDownCircle className="h-3.5 w-3.5 text-amber-500" />,
      borderColor: 'border-l-amber-500',
      href: buildPath('financeiro/contas-pagar')
    },
    {
      id: 'alertas',
      title: 'Alertas Ativos',
      count: alertasAtivos,
      value: 0,
      icon: <Bell className="h-3.5 w-3.5 text-red-500" />,
      borderColor: alertasAtivos > 0 ? 'border-l-red-500' : 'border-l-gray-200',
      href: buildPath('financeiro/alertas')
    }
  ];

  // Determinar se é crítico (atrasadas > 0)
  const isCritical = (id: string, count: number): boolean => {
    return id === 'atrasadas' && count > 0;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isEmpty = card.count === 0;
        const critical = isCritical(card.id, card.count);
        
        return (
          <Card 
            key={card.id}
            className={`bg-white border-l-4 ${card.borderColor} transition-all cursor-pointer ${
              isEmpty 
                ? 'opacity-60 shadow-none hover:opacity-80' 
                : critical 
                  ? 'shadow-md hover:shadow-lg' 
                  : 'shadow-sm hover:shadow-md'
            }`}
            onClick={() => navigate(card.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded bg-gray-50">
                  {card.icon}
                </div>
                <span className="text-xs text-gray-500 font-medium truncate">{card.title}</span>
              </div>

              {isEmpty ? (
                <p className="text-sm text-gray-400 font-medium">
                  {getEmptyMessage(card.id)}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {card.count}
                  </p>
                  {card.value > 0 && (
                    <p className="text-sm text-gray-500">
                      {formatCurrency(card.value)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RiskCards;
