/**
 * ImmediateActions - Bloco 4: Ações Imediatas
 * 
 * Grid de cards acionáveis que responde:
 * "O que EU PRECISO FAZER agora?"
 * 
 * Design: Botões visuais, touch-friendly, com navegação direta
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  CreditCard, 
  RefreshCw, 
  Bell,
  ChevronRight 
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  value?: number;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
}

interface ImmediateActionsProps {
  cobrar: { count: number; value: number };
  pagar: { count: number; value: number };
  reconciliar: { count: number; value: number };
  alertas: { count: number };
}

const ImmediateActions: React.FC<ImmediateActionsProps> = ({
  cobrar,
  pagar,
  reconciliar,
  alertas
}) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  // Microcopy contextual para estados vazios
  const getEmptySubtitle = (id: string): string => {
    switch (id) {
      case 'cobrar': return 'Nada a cobrar hoje';
      case 'pagar': return 'Nenhuma conta crítica';
      case 'reconciliar': return 'Tudo sincronizado';
      case 'alertas': return 'Sem pendências';
      default: return 'Tudo certo';
    }
  };

  const actions: ActionItem[] = [
    {
      id: 'cobrar',
      title: 'Cobrar',
      subtitle: cobrar.count > 0 ? 'Cobranças atrasadas' : getEmptySubtitle('cobrar'),
      count: cobrar.count,
      value: cobrar.value,
      icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      href: buildPath('financeiro/contas-receber')
    },
    {
      id: 'pagar',
      title: 'Pagar',
      subtitle: pagar.count > 0 ? 'Contas vencendo' : getEmptySubtitle('pagar'),
      count: pagar.count,
      value: pagar.value,
      icon: <CreditCard className="h-5 w-5 text-orange-600" />,
      iconBg: 'bg-orange-50',
      href: buildPath('financeiro/contas-pagar')
    },
    {
      id: 'reconciliar',
      title: 'Reconciliar',
      subtitle: reconciliar.count > 0 ? 'Pagamentos pendentes' : getEmptySubtitle('reconciliar'),
      count: reconciliar.count,
      value: reconciliar.value,
      icon: <RefreshCw className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-50',
      href: buildPath('financeiro/fluxo-caixa')
    },
    {
      id: 'alertas',
      title: 'Alertas',
      subtitle: alertas.count > 0 ? 'Resolver pendências' : getEmptySubtitle('alertas'),
      count: alertas.count,
      icon: <Bell className="h-5 w-5 text-red-600" />,
      iconBg: 'bg-red-50',
      href: buildPath('financeiro/alertas')
    }
  ];

  // Verificar se é urgente (cobrar com count > 0)
  const isUrgent = (id: string, count: number): boolean => {
    return id === 'cobrar' && count > 0;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => {
        const hasItems = action.count > 0;
        const urgent = isUrgent(action.id, action.count);
        
        return (
          <Card 
            key={action.id}
            className={`bg-white transition-all cursor-pointer group ${
              hasItems 
                ? urgent 
                  ? 'shadow-md hover:shadow-lg border-l-4 border-l-red-500' 
                  : 'shadow-sm hover:shadow-md'
                : 'shadow-none opacity-70 hover:opacity-90'
            }`}
            onClick={() => navigate(action.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${action.iconBg}`}>
                  {action.icon}
                </div>
                <div className="flex items-center gap-2">
                  {urgent && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      Urgente
                    </span>
                  )}
                  {hasItems && (
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{action.title}</p>
                <p className={`text-xs ${hasItems ? 'text-gray-500' : 'text-gray-400'}`}>
                  {action.subtitle}
                </p>
              </div>

              {hasItems && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm">
                    <span className="font-bold text-gray-900">{action.count}</span>
                    <span className="text-gray-500"> itens</span>
                    {action.value !== undefined && action.value > 0 && (
                      <span className="text-gray-400"> • {formatCurrency(action.value)}</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ImmediateActions;
