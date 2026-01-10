import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
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
        <Card className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar despesas.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gray-100">
            <ArrowDownCircle className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
            <p className="text-gray-500 text-sm">Gestão de despesas fixas e variáveis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchContas} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {permissions.canCreate && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          )}
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold">{formatCurrency(totais.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Pago</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Pendente</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totais.pendente)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Atrasado</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totais.atrasado)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
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
              <SelectTrigger className="w-full sm:w-[150px]">
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
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </Card>
        ) : contasFiltradas.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma conta encontrada</p>
          </Card>
        ) : (
          contasFiltradas.map((conta) => {
            const statusConfig = getStatusConfig(conta.status);
            const StatusIcon = statusConfig.icon;
            const vencimento = new Date(conta.data_vencimento);
            const diasRestantes = differenceInDays(vencimento, new Date());

            return (
              <Card 
                key={conta.id} 
                className={`bg-card/80 backdrop-blur-sm hover:shadow-md transition-all ${
                  conta.status === 'atrasado' ? 'border-destructive/30' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{conta.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {conta.categoria}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {conta.tipo === 'fixa' ? 'Fixa' : 'Variável'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-muted-foreground">Vencimento</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {diasRestantes < 0 && (
                          <p className="text-xs text-destructive">{Math.abs(diasRestantes)} dias em atraso</p>
                        )}
                        {diasRestantes >= 0 && diasRestantes <= 4 && conta.status !== 'pago' && (
                          <p className="text-xs text-amber-500">{diasRestantes === 0 ? 'Vence hoje' : `${diasRestantes} dias`}</p>
                        )}
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold">{formatCurrency(conta.valor_previsto)}</p>
                        <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      {permissions.canEdit && conta.status !== 'pago' && (
                        <Button size="sm" variant="outline">
                          Pagar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ContasPagarPage;
