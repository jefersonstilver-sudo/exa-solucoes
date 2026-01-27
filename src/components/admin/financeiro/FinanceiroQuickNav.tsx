/**
 * FinanceiroQuickNav - Navegação Rápida
 * 
 * Grid de atalhos para as seções do financeiro
 * Inclui indicador de propostas a receber com HoverCard
 * Inclui cards de Resultado Atual e Projetado
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
  TrendingDown,
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
  Loader2,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { usePropostasAReceber } from '@/hooks/financeiro/usePropostasAReceber';
import { useResultadoFinanceiro } from '@/hooks/financeiro/useResultadoFinanceiro';

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
  const resultadoData = useResultadoFinanceiro();

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

  const isLucroAtual = resultadoData.resultadoAtual >= 0;
  const isLucroProjetado = resultadoData.resultadoProjetado >= 0;

  return (
    <div className="space-y-4">
      {/* Cards de Resultado Atual, Projetado e Contas Atrasadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resultado Atual */}
        <Card className={`border shadow-md ${isLucroAtual ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100' : 'bg-gradient-to-br from-red-50 to-white border-red-100'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">Resultado Atual</p>
                {resultadoData.loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <p className={`text-2xl font-bold ${isLucroAtual ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(resultadoData.resultadoAtual)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Receita: {formatCurrency(resultadoData.receitaRealizada)} | Despesas: {formatCurrency(resultadoData.despesasTotal)}
                    </p>
                  </>
                )}
              </div>
              <div className={`p-3 rounded-xl ${isLucroAtual ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {isLucroAtual ? (
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado Projetado do Mês */}
        <Card className={`border shadow-md ${isLucroProjetado ? 'bg-gradient-to-br from-blue-50 to-white border-blue-100' : 'bg-gradient-to-br from-amber-50 to-white border-amber-100'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">Projeção do Mês</p>
                {resultadoData.loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <p className={`text-2xl font-bold ${isLucroProjetado ? 'text-blue-600' : 'text-amber-600'}`}>
                      {formatCurrency(resultadoData.resultadoProjetado)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Entradas: {formatCurrency(resultadoData.entradasProjetadas)} | Saídas: {formatCurrency(resultadoData.saidasProjetadas)}
                    </p>
                  </>
                )}
              </div>
              <div className={`p-3 rounded-xl ${isLucroProjetado ? 'bg-blue-100' : 'bg-amber-100'}`}>
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contas Atrasadas */}
        <Card className={`border shadow-md ${resultadoData.contasAtrasadasTotal > 0 ? 'bg-gradient-to-br from-red-50 to-white border-red-200' : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium">Contas Atrasadas</p>
                {resultadoData.loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <>
                    <p className={`text-2xl font-bold ${resultadoData.contasAtrasadasTotal > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {formatCurrency(resultadoData.contasAtrasadasTotal)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {resultadoData.contasAtrasadasCount > 0 
                        ? `${resultadoData.contasAtrasadasCount} cliente${resultadoData.contasAtrasadasCount > 1 ? 's' : ''} inadimplente${resultadoData.contasAtrasadasCount > 1 ? 's' : ''}`
                        : 'Nenhuma conta em atraso ✓'}
                    </p>
                  </>
                )}
              </div>
              <div className={`p-3 rounded-xl ${resultadoData.contasAtrasadasTotal > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${resultadoData.contasAtrasadasTotal > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de navegação */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {navItems.map((item) => (
          <div key={item.id}>
            {renderNavCard(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceiroQuickNav;
