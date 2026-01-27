/**
 * FinanceiroQuickNav - Navegação Rápida
 * 
 * Grid de atalhos para as seções do financeiro
 * Inclui indicador de propostas a receber com HoverCard
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp,
  BarChart3, 
  FileText, 
  Wallet, 
  Users,
  Bell,
  FileBarChart,
  Settings,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { usePropostasAReceber } from '@/hooks/financeiro/usePropostasAReceber';

interface NavItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const FinanceiroQuickNav: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const propostasData = usePropostasAReceber();

  const navItems: NavItem[] = [
    {
      id: 'receber',
      title: 'Contas a Receber',
      icon: <ArrowUpCircle className="h-5 w-5 text-emerald-600" />,
      href: buildPath('financeiro/contas-receber')
    },
    {
      id: 'pagar',
      title: 'Contas a Pagar',
      icon: <ArrowDownCircle className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/contas-pagar')
    },
    {
      id: 'lancamentos',
      title: 'Lançamentos',
      icon: <TrendingUp className="h-5 w-5 text-gray-600" />,
      href: buildPath('financeiro/lancamentos')
    },
    {
      id: 'fluxo',
      title: 'Projeções',
      icon: <BarChart3 className="h-5 w-5 text-gray-600" />,
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

  const renderNavCard = (item: NavItem) => {
    // Card especial para "Contas a Receber" com HoverCard de propostas
    if (item.id === 'receber') {
      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Card 
              className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-emerald-100 hover:border-emerald-200"
              onClick={() => navigate(item.href)}
            >
              <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50">
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600 font-medium text-center leading-tight">
                  {item.title}
                </span>
                {/* Badge com valor total de propostas aceitas */}
                {propostasData.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                ) : propostasData.valorTotal > 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 font-medium hover:bg-emerald-100">
                    {formatCurrency(propostasData.valorTotal)}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          </HoverCardTrigger>
          
          <HoverCardContent side="bottom" align="start" className="w-80 p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-sm">Propostas - A Receber</span>
              </div>
              
              {/* Valor Total */}
              <div className="text-center py-3 bg-emerald-50 rounded-lg">
                {propostasData.loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(propostasData.valorTotal)}
                    </p>
                    <p className="text-xs text-emerald-600">Valor Total Aceito</p>
                  </>
                )}
              </div>
              
              <Separator />
              
              {/* Contagem de propostas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Aceitas (aguardando pgto)
                  </span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {propostasData.countAceitas}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Pendentes de aceitação
                  </span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {propostasData.countPendentes}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              {/* Formas de Pagamento */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Formas de Pagamento (aceitas)
                </p>
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-blue-500" />
                    PIX/Boleto
                  </span>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(propostasData.porFormaPagamento.pix_boleto.valor)}
                    <span className="text-gray-400 text-xs ml-1">
                      ({propostasData.porFormaPagamento.pix_boleto.count})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-purple-500" />
                    Parcelado
                  </span>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(propostasData.porFormaPagamento.parcelado.valor)}
                    <span className="text-gray-400 text-xs ml-1">
                      ({propostasData.porFormaPagamento.parcelado.count})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    // Card padrão para outros itens
    return (
      <Card 
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
    );
  };

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {navItems.map((item) => (
        <React.Fragment key={item.id}>
          {renderNavCard(item)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default FinanceiroQuickNav;
