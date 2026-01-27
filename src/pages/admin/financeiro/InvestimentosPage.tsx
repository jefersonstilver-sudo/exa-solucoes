/**
 * InvestimentosPage - Gestão Completa de Investimentos (CAPEX)
 * Com ROI, Payback, Retornos e Centros de Custo
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { useInvestimentos, Investimento } from '@/hooks/financeiro/useInvestimentos';
import { NovoInvestimentoModal } from '@/components/admin/financeiro/NovoInvestimentoModal';
import { RegistrarRetornoModal } from '@/components/admin/financeiro/RegistrarRetornoModal';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Building2, 
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Target,
  Clock,
  DollarSign,
  Percent,
  Calendar,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { cn } from '@/lib/utils';

const InvestimentosPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { 
    investimentos, 
    retornos,
    loading, 
    metricas, 
    fetchInvestimentos,
    fetchRetornosPorInvestimento
  } = useInvestimentos();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [novoModalOpen, setNovoModalOpen] = useState(false);
  const [retornoModalOpen, setRetornoModalOpen] = useState(false);
  const [investimentoSelecionado, setInvestimentoSelecionado] = useState<Investimento | null>(null);

  useEffect(() => {
    fetchInvestimentos();
  }, [fetchInvestimentos]);

  const handleExpandir = async (inv: Investimento) => {
    if (expandedId === inv.id) {
      setExpandedId(null);
    } else {
      setExpandedId(inv.id);
      await fetchRetornosPorInvestimento(inv.id);
    }
  };

  const handleRegistrarRetorno = (inv: Investimento) => {
    setInvestimentoSelecionado(inv);
    setRetornoModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'planejado':
        return { label: 'Planejado', className: 'border-blue-500 text-blue-700 bg-blue-50' };
      case 'em_execucao':
        return { label: 'Em Execução', className: 'border-amber-500 text-amber-700 bg-amber-50' };
      case 'concluido':
        return { label: 'Concluído', className: 'border-emerald-500 text-emerald-700 bg-emerald-50' };
      case 'cancelado':
        return { label: 'Cancelado', className: 'border-red-500 text-red-700 bg-red-50' };
      default:
        return { label: 'Indefinido', className: 'border-gray-300 text-gray-600 bg-gray-50' };
    }
  };

  const filteredInvestimentos = investimentos.filter(inv => {
    const matchesSearch = inv.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(buildPath('financeiro'))}
            className="h-9 w-9 rounded-xl bg-card hover:bg-muted border shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Gestão de Investimentos</h1>
            <p className="text-sm text-muted-foreground">CAPEX, ROI, Payback e Retornos</p>
          </div>
        </div>
        <Button onClick={() => setNovoModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Novo Investimento
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Investido</p>
            </div>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(metricas.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas.totalInvestimentos} investimento(s)
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Retorno Acumulado</p>
            </div>
            <p className={cn(
              "text-lg font-semibold",
              metricas.retornoAcumulado > 0 ? "text-emerald-600" : "text-foreground"
            )}>
              {formatCurrency(metricas.retornoAcumulado)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas.atingiramPayback} atingiu payback
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">ROI Médio</p>
            </div>
            <p className={cn(
              "text-lg font-semibold",
              metricas.roiMedio > 0 ? "text-emerald-600" : metricas.roiMedio < 0 ? "text-destructive" : "text-foreground"
            )}>
              {metricas.roiMedio.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">Payback Médio</p>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {metricas.paybackMedio ? `${metricas.paybackMedio} meses` : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo para recuperação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar investimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1">
          {['todos', 'planejado', 'em_execucao', 'concluido', 'cancelado'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn("whitespace-nowrap h-9", statusFilter !== status && "bg-card")}
            >
              {status === 'todos' ? 'Todos' : getStatusConfig(status).label}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Investimentos */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filteredInvestimentos.length} investimento(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredInvestimentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum investimento encontrado</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setNovoModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar primeiro investimento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvestimentos.map((inv) => {
                const statusConfig = getStatusConfig(inv.status);
                const isExpanded = expandedId === inv.id;
                const roi = inv.roi_realizado || 0;
                const retornoAcumulado = inv.retorno_acumulado || 0;
                
                return (
                  <Collapsible key={inv.id} open={isExpanded}>
                    <div className={cn(
                      "rounded-xl border transition-all",
                      isExpanded ? "border-primary/30 shadow-md" : "border-border hover:border-primary/20 hover:shadow-sm"
                    )}>
                      {/* Header do investimento */}
                      <CollapsibleTrigger asChild>
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => handleExpandir(inv)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{inv.descricao}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(inv.data), "dd/MM/yyyy", { locale: ptBR })}
                                {inv.centros_custo && (
                                  <>
                                    <span>•</span>
                                    <span>[{inv.centros_custo.codigo}] {inv.centros_custo.nome}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* ROI Badge */}
                            {roi !== 0 && (
                              <div className={cn(
                                "text-sm font-medium px-2 py-1 rounded",
                                roi > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                              )}>
                                ROI: {roi.toFixed(1)}%
                              </div>
                            )}
                            
                            <Badge variant="outline" className={statusConfig.className}>
                              {statusConfig.label}
                            </Badge>
                            <p className="font-semibold text-foreground min-w-[100px] text-right">
                              {formatCurrency(inv.valor)}
                            </p>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Conteúdo expandido */}
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0 space-y-4">
                          <div className="h-px bg-border" />
                          
                          {/* Métricas do investimento */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground">Valor Investido</p>
                              <p className="font-semibold text-foreground">{formatCurrency(inv.valor)}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground">Retorno Acumulado</p>
                              <p className={cn(
                                "font-semibold",
                                retornoAcumulado > 0 ? "text-emerald-600" : "text-foreground"
                              )}>
                                {formatCurrency(retornoAcumulado)}
                              </p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground">ROI Realizado</p>
                              <p className={cn(
                                "font-semibold",
                                roi > 0 ? "text-emerald-600" : roi < 0 ? "text-destructive" : "text-foreground"
                              )}>
                                {roi.toFixed(2)}%
                              </p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground">Payback</p>
                              <p className="font-semibold text-foreground">
                                {inv.data_payback ? (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Atingido
                                  </span>
                                ) : inv.payback_meses ? (
                                  `~${inv.payback_meses} meses`
                                ) : (
                                  'N/A'
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Lista de retornos */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Histórico de Retornos
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1"
                                onClick={() => handleRegistrarRetorno(inv)}
                              >
                                <PlusCircle className="h-4 w-4" />
                                Novo Retorno
                              </Button>
                            </div>
                            
                            {retornos.filter(r => r.investimento_id === inv.id).length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-lg">
                                Nenhum retorno registrado ainda
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {retornos
                                  .filter(r => r.investimento_id === inv.id)
                                  .map((retorno) => (
                                    <div 
                                      key={retorno.id}
                                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-foreground">
                                          {retorno.descricao}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(retorno.data), "dd/MM/yyyy", { locale: ptBR })}
                                          {retorno.categoria && ` • ${retorno.categoria}`}
                                        </p>
                                      </div>
                                      <p className="font-semibold text-emerald-600">
                                        +{formatCurrency(retorno.valor)}
                                      </p>
                                    </div>
                                  ))
                                }
                              </div>
                            )}
                          </div>

                          {/* Info adicional */}
                          {(inv.investidor_nome || inv.observacao) && (
                            <div className="p-3 bg-muted rounded-lg space-y-1">
                              {inv.investidor_nome && (
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Investidor:</span>{' '}
                                  <span className="text-foreground">{inv.investidor_nome}</span>
                                </p>
                              )}
                              {inv.observacao && (
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Obs:</span>{' '}
                                  <span className="text-foreground">{inv.observacao}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <NovoInvestimentoModal
        open={novoModalOpen}
        onOpenChange={setNovoModalOpen}
        onSuccess={fetchInvestimentos}
      />

      <RegistrarRetornoModal
        open={retornoModalOpen}
        onOpenChange={setRetornoModalOpen}
        investimento={investimentoSelecionado}
        onSuccess={() => {
          fetchInvestimentos();
          if (investimentoSelecionado) {
            fetchRetornosPorInvestimento(investimentoSelecionado.id);
          }
        }}
      />
    </div>
  );
};

export default InvestimentosPage;
