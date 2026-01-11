import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  RefreshCw, 
  Plus, 
  Search,
  ArrowDownCircle,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';
import { format, differenceInDays, addDays } from 'date-fns';
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

interface ContaPagar {
  id: string;
  nome: string;
  categoria: string;
  valor_previsto: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'pago' | 'pendente' | 'atrasado' | 'parcial';
  tipo: 'fixa' | 'variavel';
  responsavel?: string;
  observacoes?: string;
}

const ContasPagarPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const permissions = useFinanceiroPermissions();

  const fetchContas = async () => {
    setLoading(true);
    try {
      // Buscar despesas fixas
      const { data: fixas, error: fixasError } = await supabase
        .from('despesas_fixas')
        .select('*')
        .order('data_vencimento', { ascending: true });

      // Buscar despesas variáveis
      const { data: variaveis, error: variaveisError } = await supabase
        .from('despesas_variaveis')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (fixasError) throw fixasError;
      if (variaveisError) throw variaveisError;

      const hoje = new Date();
      
      // Transformar para formato unificado
      const contasUnificadas: ContaPagar[] = [
        ...(fixas || []).map((d: any) => {
          const vencimento = new Date(d.data_vencimento);
          const diasAtraso = differenceInDays(hoje, vencimento);
          let status: ContaPagar['status'] = 'pendente';
          
          if (d.status === 'pago') status = 'pago';
          else if (diasAtraso > 0) status = 'atrasado';
          else if (diasAtraso >= -4) status = 'pendente'; // Vencendo em 4 dias
          
          return {
            id: d.id,
            nome: d.descricao || d.nome,
            categoria: d.categoria || 'Fixas',
            valor_previsto: d.valor || 0,
            valor_pago: d.valor_pago || 0,
            data_vencimento: d.data_vencimento,
            status,
            tipo: 'fixa' as const,
            responsavel: d.responsavel,
            observacoes: d.observacoes
          };
        }),
        ...(variaveis || []).map((d: any) => {
          const vencimento = new Date(d.data_vencimento);
          const diasAtraso = differenceInDays(hoje, vencimento);
          let status: ContaPagar['status'] = 'pendente';
          
          if (d.status === 'pago') status = 'pago';
          else if (diasAtraso > 0) status = 'atrasado';
          
          return {
            id: d.id,
            nome: d.descricao || d.nome,
            categoria: d.categoria || 'Variáveis',
            valor_previsto: d.valor || 0,
            valor_pago: d.valor_pago || 0,
            data_vencimento: d.data_vencimento,
            status,
            tipo: 'variavel' as const,
            responsavel: d.responsavel,
            observacoes: d.observacoes
          };
        })
      ].sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

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
    const pago = contasFiltradas.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor_previsto, 0);
    const pendente = contasFiltradas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor_previsto, 0);
    const atrasado = contasFiltradas.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + c.valor_previsto, 0);
    return { total, pago, pendente, atrasado };
  }, [contasFiltradas]);

  const getStatusConfig = (status: ContaPagar['status']) => {
    switch (status) {
      case 'pago':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-white border border-emerald-200', label: 'Pago' };
      case 'pendente':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-white border border-amber-200', label: 'Pendente' };
      case 'atrasado':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-white border border-red-200', label: 'Atrasado' };
      case 'parcial':
        return { icon: XCircle, color: 'text-orange-600', bg: 'bg-white border border-orange-200', label: 'Parcial' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-white border border-gray-200', label: status };
    }
  };

  if (!permissions.canViewDespesas) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center bg-white shadow-sm">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm">Você não tem permissão para acessar despesas.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(buildPath('financeiro'))}
            className="h-9 w-9 rounded-xl bg-white/60 hover:bg-white border border-gray-200/50 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Contas a Pagar</h1>
            <p className="text-gray-500 text-sm">Gestão de despesas fixas e variáveis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchContas} disabled={loading} variant="outline" size="sm" className="bg-white shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {permissions.canCreate && (
            <Button size="sm" className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          )}
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white shadow-sm border-l-4 border-l-gray-300">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Pago</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Pendente</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.pendente)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Atrasado</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.atrasado)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] bg-gray-50 border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[140px] bg-gray-50 border-gray-200">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="fixa">Fixas</SelectItem>
                <SelectItem value="variavel">Variáveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : contasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDownCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Nenhuma conta encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contasFiltradas.map((conta) => {
                const statusConfig = getStatusConfig(conta.status);
                const StatusIcon = statusConfig.icon;
                const vencimento = new Date(conta.data_vencimento);
                const diasRestantes = differenceInDays(vencimento, new Date());

                return (
                  <div 
                    key={conta.id} 
                    className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                      conta.status === 'atrasado' ? 'border-l-4 border-l-red-500 border-red-100' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{conta.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                              {conta.categoria}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                              {conta.tipo === 'fixa' ? 'Fixa' : 'Variável'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
                        <div className="text-left sm:text-right min-w-[100px]">
                          <p className="text-xs text-gray-500">Vencimento</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          {diasRestantes < 0 && (
                            <p className="text-xs text-red-600">{Math.abs(diasRestantes)} dias em atraso</p>
                          )}
                          {diasRestantes >= 0 && diasRestantes <= 4 && conta.status !== 'pago' && (
                            <p className="text-xs text-amber-600">{diasRestantes === 0 ? 'Vence hoje' : `${diasRestantes} dias`}</p>
                          )}
                        </div>
                        
                        <div className="text-right min-w-[90px]">
                          <p className="text-base font-semibold text-gray-900">{formatCurrency(conta.valor_previsto)}</p>
                          <Badge className={`${statusConfig.bg} ${statusConfig.color} text-xs`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        {permissions.canEdit && conta.status !== 'pago' && (
                          <Button size="sm" variant="outline" className="h-9 bg-white shadow-sm">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ContasPagarPage;
