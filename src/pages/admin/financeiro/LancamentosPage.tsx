/**
 * LancamentosPage - Gestão de Lançamentos do Fluxo de Caixa
 * 
 * Exibe todos os lançamentos (ASAAS + despesas) ordenados por data
 * Permite categorização, marcação de recorrência e conciliação
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Circle,
  Repeat,
  Tag
} from 'lucide-react';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import LancamentoDossieDrawer from '@/components/admin/financeiro/dossie/LancamentoDossieDrawer';
import { LancamentoDossie } from '@/components/admin/financeiro/dossie/types';

interface Lancamento {
  id: string;
  // origem_id é o identificador do registro na origem (ex: payment_id no ASAAS)
  origem_id?: string;
  tipo: 'entrada' | 'saida';
  origem: string;
  descricao: string;
  valor: number;
  valor_liquido?: number;
  data: string;
  status: string;
  status_original?: string;
  cliente?: string;
  metodo_pagamento?: string;
  categoria_id?: string;
  categoria_nome?: string;
  tipo_receita?: 'fixa' | 'variavel';
  recorrente?: boolean;
  conciliado?: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

const LancamentosPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'realizado' | 'projetado'>('todos');
  const [filtroConciliado, setFiltroConciliado] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [busca, setBusca] = useState('');
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSyncAsaas = async () => {
    setSyncing(true);
    try {
      const [{ data: inData, error: inError }, { data: outData, error: outError }] = await Promise.all([
        supabase.functions.invoke('sync-asaas-transactions', { body: {} }),
        supabase.functions.invoke('sync-asaas-outflows', { body: {} }),
      ]);

      if (inError) throw inError;
      if (outError) throw outError;

      toast.success(
        `Sincronização concluída: Entradas ${inData?.synced || 0} novos, ${inData?.updated || 0} atualizados • Saídas ${outData?.synced || 0}`
      );
      await fetchLancamentos();
    } catch (err) {
      console.error('Erro na sincronização:', err);
      toast.error('Erro ao sincronizar com ASAAS');
    } finally {
      setSyncing(false);
    }
  };

  const fetchLancamentos = async () => {
    setLoading(true);
    try {
      // Janela de dados ampla o suficiente para incluir lançamentos do caixa + ASAAS (realizados e agendados)
      const start = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
      const end = format(addMonths(new Date(), 12), 'yyyy-MM-dd');

      // Buscar da VIEW unificada
      const { data: viewData, error: viewError } = await supabase
        .from('vw_fluxo_caixa_real')
        .select('*')
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })
        .limit(5000);

      if (viewError) throw viewError;

      // Buscar classificações das transações ASAAS
      const asaasIds = (viewData || [])
        .filter(l => l.origem === 'asaas')
        .map(l => l.origem_id);

      let classificacoes: Record<string, any> = {};
      if (asaasIds.length > 0) {
        const { data: asaasData } = await supabase
          .from('transacoes_asaas')
          .select('payment_id, categoria_id, tipo_receita, recorrente, conciliado, categorias_despesas(nome)')
          .in('payment_id', asaasIds);

        if (asaasData) {
          asaasData.forEach(a => {
            classificacoes[a.payment_id] = {
              categoria_id: a.categoria_id,
              categoria_nome: (a.categorias_despesas as any)?.nome,
              tipo_receita: a.tipo_receita,
              recorrente: a.recorrente,
              conciliado: a.conciliado
            };
          });
        }
      }

      const items: Lancamento[] = (viewData || []).map(l => {
        const classif = classificacoes[l.origem_id] || {};
        return {
          id: l.id,
          origem_id: l.origem_id,
          tipo: l.tipo as 'entrada' | 'saida',
          origem: l.origem,
          descricao: l.descricao || 'Sem descrição',
          valor: Number(l.valor),
          valor_liquido: l.valor_liquido ? Number(l.valor_liquido) : undefined,
          data: l.data,
          status: l.status,
          status_original: l.status_original,
          cliente: l.cliente,
          metodo_pagamento: l.metodo_pagamento,
          categoria_id: classif.categoria_id,
          categoria_nome: classif.categoria_nome,
          tipo_receita: classif.tipo_receita,
          recorrente: classif.recorrente,
          conciliado: classif.conciliado
        };
      });

      setLancamentos(items);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    const { data } = await supabase
      .from('categorias_despesas')
      .select('id, nome, tipo')
      .eq('ativo', true)
      .order('nome');
    
    if (data) setCategorias(data);
  };

  useEffect(() => {
    fetchLancamentos();
    fetchCategorias();
  }, []);

  // Filtros
  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
    if (filtroStatus !== 'todos' && l.status !== filtroStatus) return false;
    if (filtroConciliado === 'sim' && !l.conciliado) return false;
    if (filtroConciliado === 'nao' && l.conciliado) return false;
    if (busca) {
      const termo = busca.toLowerCase();
      if (!l.descricao?.toLowerCase().includes(termo) && 
          !l.cliente?.toLowerCase().includes(termo)) return false;
    }
    return true;
  });

  const handleOpenDetalhe = (lancamento: Lancamento) => {
    setSelectedLancamento(lancamento);
    setDialogOpen(true);
  };

  const handleSaveClassificacao = async (updates: Partial<Lancamento>) => {
    if (!selectedLancamento || selectedLancamento.origem !== 'asaas') {
      toast.error('Apenas transações ASAAS podem ser classificadas');
      return;
    }

    const paymentId = selectedLancamento.origem_id || selectedLancamento.id;

    try {
      const { error } = await supabase
        .from('transacoes_asaas')
        .update({
          categoria_id: updates.categoria_id || null,
          tipo_receita: updates.tipo_receita || null,
          recorrente: updates.recorrente ?? false,
          conciliado: updates.conciliado ?? false,
          conciliado_at: updates.conciliado ? new Date().toISOString() : null
        })
        .eq('payment_id', paymentId);

      // Fallback: tentar localizar o registro por id/payment_id (ambos aparecem em bases legadas)
      if (error) {
        const { data: asaasRecord } = await supabase
          .from('transacoes_asaas')
          .select('id, payment_id')
          .or(`id.eq.${paymentId},payment_id.eq.${paymentId}`)
          .maybeSingle();

        if (!asaasRecord) throw error;

        const { error: error2 } = await supabase
          .from('transacoes_asaas')
          .update({
            categoria_id: updates.categoria_id || null,
            tipo_receita: updates.tipo_receita || null,
            recorrente: updates.recorrente ?? false,
            conciliado: updates.conciliado ?? false,
            conciliado_at: updates.conciliado ? new Date().toISOString() : null
          })
          .eq('id', asaasRecord.id);

        if (error2) throw error2;
      }

      toast.success('Classificação salva');
      setDialogOpen(false);
      fetchLancamentos();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar classificação');
    }
  };

  // Resumo
  const totalEntradas = lancamentosFiltrados
    .filter(l => l.tipo === 'entrada')
    .reduce((s, l) => s + l.valor, 0);
  const totalSaidas = lancamentosFiltrados
    .filter(l => l.tipo === 'saida')
    .reduce((s, l) => s + l.valor, 0);
  const pendentes = lancamentosFiltrados.filter(l => l.origem === 'asaas' && !l.conciliado).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(buildPath('financeiro'))}
              className="h-9 w-9 rounded-xl bg-white/60 hover:bg-white border border-gray-200/50"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Lançamentos</h1>
              <p className="text-sm text-muted-foreground">
                {lancamentosFiltrados.length} lançamentos • {pendentes} pendentes de conciliação
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSyncAsaas} 
              disabled={syncing} 
              variant="outline" 
              size="sm"
              className="text-gray-600 hover:text-gray-900 bg-white/60"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar ASAAS
            </Button>
            <Button 
              onClick={fetchLancamentos} 
              disabled={loading} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-white/60"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Entradas</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalEntradas)}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-red-500">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Saídas</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-lg font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-gray-900' : 'text-amber-600'}`}>
                {formatCurrency(totalEntradas - totalSaidas)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou cliente..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as any)}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="projetado">Projetado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroConciliado} onValueChange={(v) => setFiltroConciliado(v as any)}>
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue placeholder="Conciliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Conciliados</SelectItem>
                  <SelectItem value="nao">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Lançamentos */}
        <div className="space-y-2">
          {loading ? (
            <Card className="bg-white/80">
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : lancamentosFiltrados.length === 0 ? (
            <Card className="bg-white/80">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop: Tabela */}
              <div className="hidden md:block">
                <Card className="bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground">Data</th>
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground">Descrição</th>
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground">Categoria</th>
                          <th className="text-right p-3 text-xs font-medium text-muted-foreground">Valor</th>
                          <th className="text-center p-3 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-center p-3 text-xs font-medium text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lancamentosFiltrados.map((l) => (
                          <tr 
                            key={l.id} 
                            className="border-b last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors"
                            onClick={() => handleOpenDetalhe(l)}
                          >
                            <td className="p-3">
                              <span className="text-sm font-medium text-gray-700">
                                {format(new Date(l.data), 'dd/MM/yy', { locale: ptBR })}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {l.tipo === 'entrada' ? (
                                  <ArrowUpCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <ArrowDownCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {l.descricao}
                                  </p>
                                  {l.cliente && (
                                    <p className="text-xs text-muted-foreground truncate">{l.cliente}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              {l.categoria_nome ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {l.categoria_nome}
                                </Badge>
                              ) : l.origem === 'asaas' ? (
                                <span className="text-xs text-amber-600">Sem categoria</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">{l.origem}</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`text-sm font-bold ${l.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {l.tipo === 'entrada' ? '+' : '-'}{formatCurrency(l.valor)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Badge 
                                  variant={l.status === 'realizado' ? 'default' : 'secondary'}
                                  className={`text-xs ${l.status === 'realizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                  {l.status}
                                </Badge>
                                {l.recorrente && (
                                  <Repeat className="h-3 w-3 text-blue-500" />
                                )}
                                {l.conciliado && (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetalhe(l);
                                }}
                              >
                                Editar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden space-y-2">
                {lancamentosFiltrados.map((l) => (
                  <Card 
                    key={l.id} 
                    className="bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOpenDetalhe(l)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {l.tipo === 'entrada' ? (
                            <div className="p-2 rounded-lg bg-emerald-50">
                              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-red-50">
                              <ArrowDownCircle className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {l.descricao}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(l.data), 'dd/MM/yyyy', { locale: ptBR })}
                              {l.cliente && ` • ${l.cliente}`}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {l.categoria_nome && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {l.categoria_nome}
                                </Badge>
                              )}
                              {l.recorrente && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Repeat className="h-2 w-2 mr-1" />
                                  Recorrente
                                </Badge>
                              )}
                              {l.conciliado && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${l.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {l.tipo === 'entrada' ? '+' : '-'}{formatCurrency(l.valor)}
                          </p>
                          <Badge 
                            variant="secondary"
                            className={`text-[10px] mt-1 ${l.status === 'realizado' ? 'bg-emerald-100 text-emerald-700' : ''}`}
                          >
                            {l.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialog de Detalhe/Edição */}
      <LancamentoDetalheDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lancamento={selectedLancamento}
        categorias={categorias}
        onSave={handleSaveClassificacao}
      />
    </div>
  );
};

export default LancamentosPage;
