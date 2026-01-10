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

  const cards: RiskCardData[] = [
    {
      id: 'vencendo',
      title: 'Cobranças Vencendo',
      count: cobrancasVencendo,
      value: cobrancasVencendoValor,
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      borderColor: 'border-l-amber-500',
      href: buildPath('financeiro/contas-receber')
    },
    {
      id: 'atrasadas',
      title: 'Cobranças Atrasadas',
      count: cobrancasAtrasadas,
      value: cobrancasAtrasadasValor,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      borderColor: 'border-l-red-500',
      href: buildPath('financeiro/contas-receber')
    },
    {
      id: 'contas',
      title: 'Contas Próximas',
      count: contasProximas,
      value: contasProximasValor,
      icon: <ArrowDownCircle className="h-4 w-4 text-amber-500" />,
      borderColor: 'border-l-amber-500',
      href: buildPath('financeiro/contas-pagar')
    },
    {
      id: 'alertas',
      title: 'Alertas Ativos',
      count: alertasAtivos,
      value: 0,
      icon: <Bell className="h-4 w-4 text-red-500" />,
      borderColor: alertasAtivos > 0 ? 'border-l-red-500' : 'border-l-gray-200',
      href: buildPath('financeiro/alertas')
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.id}
          className={`bg-white border-l-4 ${card.borderColor} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
          onClick={() => navigate(card.href)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded bg-gray-50">
                {card.icon}
              </div>
              <span className="text-xs text-gray-500 font-medium truncate">{card.title}</span>
            </div>

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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RiskCards;
