import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft,
  RefreshCw, 
  Plus, 
  Search,
  FileX2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  CloudDownload,
  TrendingDown,
  Wallet,
  CircleDollarSign,
  CalendarClock,
  Zap
} from 'lucide-react';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';
import { format, differenceInDays, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { NovaDespesaModal } from '@/components/admin/financeiro/NovaDespesaModal';
import { 
  BulkActionsBar, 
  ContaDetalhesDrawer, 
  PagarContaModal, 
  EditarContaModal 
} from '@/components/admin/financeiro/contas-pagar';

interface ContaPagar {
  id: string;
  nome: string;
  categoria: string;
  valor_previsto: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'pago' | 'pendente' | 'atrasado' | 'parcial' | 'agendado';
  tipo: 'fixa' | 'variavel';
  responsavel?: string;
  observacoes?: string;
  data_pagamento?: string;
  data_pagamento_agendado?: string;
  auto_pagar_na_data?: boolean;
}

const ContasPagarPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [showNovaDespesaModal, setShowNovaDespesaModal] = useState(false);
  const permissions = useFinanceiroPermissions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [showDetalhesDrawer, setShowDetalhesDrawer] = useState(false);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncingAsaas, setSyncingAsaas] = useState(false);

  const toLocalDate = (value?: string | null) => {
    if (!value) return null;
    if (typeof value === 'string' && value.includes('T')) return new Date(value);
    return parse(String(value), 'yyyy-MM-dd', new Date());
  };

  const fetchContas = async () => {
    setLoading(true);
    try {
      const { data: fixas, error: fixasError } = await supabase
        .from('despesas_fixas')
        .select('*')
        .order('dia_vencimento', { ascending: true });

      const { data: variaveis, error: variaveisError } = await supabase
        .from('despesas_variaveis')
        .select('*')
        .order('data', { ascending: true });

      if (fixasError) throw fixasError;
      if (variaveisError) throw variaveisError;

      const hoje = new Date();
      const contasUnificadas: ContaPagar[] = [
        ...(fixas || []).map((d: any) => {
          let dataVencimento: Date;
          let dataVencimentoStr: string;

          if (d.data_primeiro_lancamento) {
            dataVencimentoStr = d.data_primeiro_lancamento;
            dataVencimento = toLocalDate(d.data_primeiro_lancamento) ?? hoje;
          } else if (d.dia_vencimento) {
            const ano = hoje.getFullYear();
            const mes = hoje.getMonth();
            dataVencimento = new Date(ano, mes, d.dia_vencimento);
            dataVencimentoStr = format(dataVencimento, 'yyyy-MM-dd');
          } else {
            dataVencimento = hoje;
            dataVencimentoStr = format(hoje, 'yyyy-MM-dd');
          }
          const diasAtraso = differenceInDays(hoje, dataVencimento);
          
          // Lógica de status com prioridade
          let status: ContaPagar['status'] = 'pendente';
          if (d.status === 'pago') {
            status = 'pago';
          } else if (d.data_pagamento_agendado) {
            status = 'agendado';
          } else if (diasAtraso > 0) {
            status = 'atrasado';
          }

          return {
            id: d.id,
            nome: d.descricao || d.nome,
            categoria: d.categoria || 'Fixas',
            valor_previsto: d.valor || 0,
            valor_pago: d.valor_pago || 0,
            data_vencimento: dataVencimentoStr,
            status,
            tipo: 'fixa' as const,
            responsavel: d.responsavel,
            observacoes: d.observacao,
            data_pagamento: d.data_pagamento,
            data_pagamento_agendado: d.data_pagamento_agendado,
            auto_pagar_na_data: d.auto_pagar_na_data
          };
        }),
        ...(variaveis || []).map((d: any) => {
          const dataVencimentoStr = d.data ? String(d.data) : format(hoje, 'yyyy-MM-dd');
          const vencimento = toLocalDate(dataVencimentoStr) ?? hoje;
          const diasAtraso = differenceInDays(hoje, vencimento);
          
          // Lógica de status com prioridade
          let status: ContaPagar['status'] = 'pendente';
          if (d.status === 'pago') {
            status = 'pago';
          } else if (d.data_pagamento_agendado) {
            status = 'agendado';
          } else if (diasAtraso > 0) {
            status = 'atrasado';
          }

          return {
            id: d.id,
            nome: d.descricao || d.nome,
            categoria: d.categoria || 'Variáveis',
            valor_previsto: d.valor || 0,
            valor_pago: d.valor_pago || 0,
            data_vencimento: dataVencimentoStr,
            status,
            tipo: 'variavel' as const,
            responsavel: d.responsavel,
            observacoes: d.observacao,
            data_pagamento: d.data_pagamento,
            data_pagamento_agendado: d.data_pagamento_agendado,
            auto_pagar_na_data: d.auto_pagar_na_data
          };
        })
      ].sort((a, b) => {
        const da = toLocalDate(a.data_vencimento)?.getTime() ?? 0;
        const db = toLocalDate(b.data_vencimento)?.getTime() ?? 0;
        return da - db;
      });

      setContas(contasUnificadas);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const contasFiltradas = useMemo(() => {
    return contas.filter(conta => {
      const matchSearch = conta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          conta.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || conta.status === statusFilter;
      const matchTipo = tipoFilter === 'todos' || conta.tipo === tipoFilter;
      return matchSearch && matchStatus && matchTipo;
    });
  }, [contas, searchTerm, statusFilter, tipoFilter]);

  const totais = useMemo(() => {
    const total = contasFiltradas.reduce((acc, c) => acc + c.valor_previsto, 0);
    const pago = contasFiltradas.filter(c => c.status === 'pago').reduce((acc, c) => acc + (c.valor_pago || c.valor_previsto), 0);
    const agendado = contasFiltradas.filter(c => c.status === 'agendado').reduce((acc, c) => acc + c.valor_previsto, 0);
    const pendente = contasFiltradas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor_previsto, 0);
    const atrasado = contasFiltradas.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + c.valor_previsto, 0);
    return { total, pago, agendado, pendente, atrasado };
  }, [contasFiltradas]);

  const getStatusConfig = (status: ContaPagar['status']) => {
    switch (status) {
      case 'pago':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Pago' };
      case 'agendado':
        return { icon: CalendarClock, color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-200', label: 'Agendado' };
      case 'pendente':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', borderColor: 'border-amber-200', label: 'Pendente' };
      case 'atrasado':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', borderColor: 'border-red-200', label: 'Atrasado' };
      case 'parcial':
        return { icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-200', label: 'Parcial' };
      default:
        return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', borderColor: 'border-slate-200', label: status };
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);

    try {
      const fixasIds = contasFiltradas.filter(c => selectedIds.has(c.id) && c.tipo === 'fixa').map(c => c.id);
      const variaveisIds = contasFiltradas.filter(c => selectedIds.has(c.id) && c.tipo === 'variavel').map(c => c.id);

      if (fixasIds.length > 0) {
        await supabase.from('despesas_fixas').delete().in('id', fixasIds);
      }
      if (variaveisIds.length > 0) {
        await supabase.from('despesas_variaveis').delete().in('id', variaveisIds);
      }

      toast.success(`${selectedIds.size} conta(s) excluída(s)`);
      setSelectedIds(new Set());
      fetchContas();
    } catch (error) {
      console.error('Erro ao excluir contas:', error);
      toast.error('Erro ao excluir contas');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContaClick = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setShowDetalhesDrawer(true);
  };

  const handlePagarClick = (e: React.MouseEvent, conta: ContaPagar) => {
    e.stopPropagation();
    setSelectedConta(conta);
    setShowPagarModal(true);
  };

  const handleSyncAsaas = async () => {
    setSyncingAsaas(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-asaas-outflows');
      
      if (error) throw error;
      
      const summary = data?.summary;
      if (summary) {
        toast.success(`ASAAS sincronizado: ${summary.syncedCount || 0} saídas atualizadas`);
      } else {
        toast.success('Sincronização ASAAS concluída');
      }
    } catch (error) {
      console.error('Erro ao sincronizar ASAAS:', error);
      toast.error('Erro ao sincronizar com ASAAS');
    } finally {
      setSyncingAsaas(false);
    }
  };

  if (!permissions.canViewDespesas) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 text-sm">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Corporativo */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 md:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(buildPath('financeiro'))}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Contas a Pagar</h1>
                <p className="text-sm text-slate-500">Gestão de despesas fixas e variáveis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                onClick={fetchContas} 
                disabled={loading} 
                variant="outline" 
                size="sm" 
                className="h-9 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={handleSyncAsaas} 
                disabled={syncingAsaas} 
                variant="outline" 
                size="sm" 
                className="h-9 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <CloudDownload className={`h-4 w-4 mr-2 ${syncingAsaas ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{syncingAsaas ? 'Sincronizando...' : 'Sync ASAAS'}</span>
                <span className="sm:hidden">ASAAS</span>
              </Button>
              {permissions.canCreate && (
                <Button 
                  size="sm" 
                  className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => setShowNovaDespesaModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nova Conta</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold text-slate-900 truncate">{formatCurrency(totais.total)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pago</p>
                <p className="text-lg font-bold text-emerald-600 truncate">{formatCurrency(totais.pago)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Agendado</p>
                <p className="text-lg font-bold text-blue-600 truncate">{formatCurrency(totais.agendado)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pendente</p>
                <p className="text-lg font-bold text-amber-600 truncate">{formatCurrency(totais.pendente)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Atrasado</p>
                <p className="text-lg font-bold text-red-600 truncate">{formatCurrency(totais.atrasado)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onDelete={handleBulkDelete}
          canDelete={permissions.canDelete}
          isDeleting={isDeleting}
        />

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-300 transition-colors"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="fixa">Fixas</SelectItem>
                <SelectItem value="variavel">Variáveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Contas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600" />
                <p className="text-sm text-slate-500">Carregando contas...</p>
              </div>
            </div>
          ) : contasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileX2 className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">Nenhuma conta encontrada</p>
              <p className="text-sm text-slate-400 text-center">Tente ajustar os filtros ou adicione uma nova conta.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header da tabela - Desktop */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-1"></div>
                <div className="col-span-4">Descrição</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-2">Vencimento</div>
                <div className="col-span-2 text-right">Valor</div>
                <div className="col-span-1"></div>
              </div>
              
              {contasFiltradas.map((conta) => {
                const statusConfig = getStatusConfig(conta.status);
                const StatusIcon = statusConfig.icon;
                const vencimento = toLocalDate(conta.data_vencimento) ?? new Date();
                const diasRestantes = differenceInDays(vencimento, new Date());

                return (
                  <div 
                    key={conta.id} 
                    onClick={() => handleContaClick(conta)}
                    className={`
                      group px-4 lg:px-6 py-4 cursor-pointer transition-all duration-150
                      hover:bg-slate-50
                      ${selectedIds.has(conta.id) ? 'bg-blue-50 hover:bg-blue-50' : ''}
                      ${conta.status === 'atrasado' ? 'border-l-4 border-l-red-500' : ''}
                    `}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(conta.id)}
                            onCheckedChange={() => toggleSelect(conta.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-slate-900 line-clamp-1">{conta.nome}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-200 text-slate-500">
                                {conta.tipo === 'fixa' ? 'Fixa' : 'Variável'}
                              </Badge>
                              <Badge className={`text-[10px] h-5 px-1.5 ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {conta.status === 'pago' && conta.valor_pago > 0 && conta.valor_pago !== conta.valor_previsto ? (
                            <div>
                              <p className="text-xs text-slate-400 line-through">{formatCurrency(conta.valor_previsto)}</p>
                              <p className="font-semibold text-emerald-600">{formatCurrency(conta.valor_pago)}</p>
                            </div>
                          ) : (
                            <p className="font-semibold text-slate-900">{formatCurrency(conta.valor_previsto)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pl-8">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}</span>
                          {conta.status === 'pago' && conta.data_pagamento && (
                            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                              • <CheckCircle2 className="h-3 w-3" /> Pago em {format(toLocalDate(conta.data_pagamento) ?? new Date(), 'dd/MM')}
                            </span>
                          )}
                          {conta.status === 'agendado' && conta.data_pagamento_agendado && (
                            <span className="text-blue-600 font-medium flex items-center gap-0.5">
                              • <CalendarClock className="h-3 w-3" /> Agendado {format(toLocalDate(conta.data_pagamento_agendado) ?? new Date(), 'dd/MM')}
                              {conta.auto_pagar_na_data && (
                                <span title="Pagamento automático">
                                  <Zap className="h-3 w-3 text-yellow-500" />
                                </span>
                              )}
                            </span>
                          )}
                          {diasRestantes < 0 && conta.status !== 'pago' && (
                            <span className="text-red-600 font-medium">• {Math.abs(diasRestantes)}d atraso</span>
                          )}
                          {diasRestantes === 0 && conta.status !== 'pago' && conta.status !== 'agendado' && (
                            <span className="text-amber-600 font-medium">• Vence hoje</span>
                          )}
                        </div>
                        {permissions.canEdit && conta.status !== 'pago' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            onClick={(e) => handlePagarClick(e, conta)}
                          >
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                      <div className="col-span-1 flex items-center gap-2">
                        <Checkbox
                          checked={selectedIds.has(conta.id)}
                          onCheckedChange={() => toggleSelect(conta.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={`w-8 h-8 rounded-lg ${statusConfig.bg} flex items-center justify-center`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        </div>
                      </div>
                      
                      <div className="col-span-4">
                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {conta.nome}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{conta.categoria}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                          {conta.tipo === 'fixa' ? 'Fixa' : 'Variável'}
                        </Badge>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        {diasRestantes < 0 && (
                          <p className="text-xs text-red-600 mt-0.5">{Math.abs(diasRestantes)} dias em atraso</p>
                        )}
                        {diasRestantes >= 0 && diasRestantes <= 4 && conta.status !== 'pago' && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            {diasRestantes === 0 ? 'Vence hoje' : `Em ${diasRestantes} dias`}
                          </p>
                        )}
                      </div>
                      
                      <div className="col-span-2 text-right">
                        {conta.status === 'pago' && conta.valor_pago > 0 && conta.valor_pago !== conta.valor_previsto ? (
                          <div>
                            <p className="text-xs text-slate-400 line-through">{formatCurrency(conta.valor_previsto)}</p>
                            <p className="font-semibold text-emerald-600">{formatCurrency(conta.valor_pago)}</p>
                          </div>
                        ) : (
                          <p className="font-semibold text-slate-900">{formatCurrency(conta.valor_previsto)}</p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Badge className={`text-[10px] ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                            {statusConfig.label}
                          </Badge>
                          {conta.status === 'pago' && conta.data_pagamento && (
                            <span className="text-[10px] text-slate-400">
                              {format(toLocalDate(conta.data_pagamento) ?? new Date(), 'dd/MM')}
                            </span>
                          )}
                          {conta.status === 'agendado' && conta.data_pagamento_agendado && (
                            <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                              {format(toLocalDate(conta.data_pagamento_agendado) ?? new Date(), 'dd/MM')}
                              {conta.auto_pagar_na_data && (
                                <span title="Automático">
                                  <Zap className="h-3 w-3 text-yellow-500" />
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-1 flex justify-end">
                        {permissions.canEdit && conta.status !== 'pago' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            onClick={(e) => handlePagarClick(e, conta)}
                          >
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <NovaDespesaModal
        open={showNovaDespesaModal}
        onOpenChange={setShowNovaDespesaModal}
        onSuccess={fetchContas}
      />

      <ContaDetalhesDrawer
        open={showDetalhesDrawer}
        onOpenChange={setShowDetalhesDrawer}
        conta={selectedConta}
        onEdit={() => {
          setShowDetalhesDrawer(false);
          setShowEditarModal(true);
        }}
        onPagar={() => {
          setShowDetalhesDrawer(false);
          setShowPagarModal(true);
        }}
        onDelete={fetchContas}
        canEdit={permissions.canEdit}
        canDelete={permissions.canDelete}
      />

      <PagarContaModal
        open={showPagarModal}
        onOpenChange={setShowPagarModal}
        conta={selectedConta}
        onSuccess={fetchContas}
      />

      <EditarContaModal
        open={showEditarModal}
        onOpenChange={setShowEditarModal}
        conta={selectedConta}
        onSuccess={fetchContas}
      />
    </div>
  );
};

export default ContasPagarPage;
