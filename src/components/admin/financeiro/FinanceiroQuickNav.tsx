/**
 * FinanceiroQuickNav - Navegação Rápida
 * 
 * Grid de atalhos para as seções do financeiro
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  FileText, 
  Wallet, 
  Users,
  Bell,
  FileBarChart,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface NavItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
}

const FinanceiroQuickNav: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  const navItems: NavItem[] = [
    {
      id: 'receber',
      title: 'Contas a Receber',
      icon: <ArrowUpCircle className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/contas-receber')
    },
    {
      id: 'pagar',
      title: 'Contas a Pagar',
      icon: <ArrowDownCircle className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/contas-pagar')
    },
    {
      id: 'fluxo',
      title: 'Fluxo de Caixa',
      icon: <TrendingUp className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/fluxo-caixa')
    },
    {
      id: 'dre',
      title: 'DRE Gerencial',
      icon: <FileText className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/dre')
    },
    {
      id: 'investimentos',
      title: 'Investimentos',
      icon: <Wallet className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/investimentos')
    },
    {
      id: 'aportes',
      title: 'Aportes',
      icon: <Users className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/aportes')
    },
    {
      id: 'alertas',
      title: 'Alertas',
      icon: <Bell className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/alertas')
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      icon: <FileBarChart className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/relatorios')
    },
    {
      id: 'categorias',
      title: 'Categorias',
      icon: <Settings className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/categorias')
    }
  ];

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {navItems.map((item) => (
        <Card 
          key={item.id}
          className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
          onClick={() => navigate(item.href)}
        >
          <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
            <div className="p-2 rounded-lg bg-gray-50">
              {item.icon}
            </div>
            <span className="text-xs text-gray-600 font-medium text-center leading-tight">
              {item.title}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FinanceiroQuickNav;
