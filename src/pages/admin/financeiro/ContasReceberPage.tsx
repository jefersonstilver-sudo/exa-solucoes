import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  RefreshCw, 
  Search,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  FileText,
  User
} from 'lucide-react';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';
import { format, differenceInDays } from 'date-fns';
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

interface ContaReceber {
  id: string;
  cliente_nome: string;
  cliente_email?: string;
  pedido_id?: string;
  valor: number;
  data_vencimento: string;
  status: 'pago' | 'pendente' | 'atrasado';
  numero_parcela?: number;
  total_parcelas?: number;
  metodo_pagamento?: string;
}

const ContasReceberPage: React.FC = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [generatingPix, setGeneratingPix] = useState<string | null>(null);
  const permissions = useFinanceiroPermissions();

  const fetchContas = async () => {
    setLoading(true);
    try {
      const { data: parcelas, error } = await supabase
        .from('parcelas')
        .select(`
          *,
          pedido:pedidos(
            id,
            client:users!pedidos_client_id_fkey(nome, email)
          )
        `)
        .in('status', ['pendente', 'atrasado', 'pago'])
        .order('data_vencimento', { ascending: true })
        .limit(100);

      if (error) throw error;

      const hoje = new Date();
      
      const contasFormatadas: ContaReceber[] = (parcelas || []).map((p: any) => {
        const vencimento = new Date(p.data_vencimento);
        const diasAtraso = differenceInDays(hoje, vencimento);
        let status: ContaReceber['status'] = p.status || 'pendente';
        
        if (status !== 'pago' && diasAtraso > 0) {
          status = 'atrasado';
        }

        return {
          id: p.id,
          cliente_nome: p.pedido?.client?.nome || 'Cliente',
          cliente_email: p.pedido?.client?.email,
          pedido_id: p.pedido_id,
          valor: p.valor_final || p.valor || 0,
          data_vencimento: p.data_vencimento,
          status,
          numero_parcela: p.numero_parcela,
          total_parcelas: p.total_parcelas,
          metodo_pagamento: p.metodo_pagamento
        };
      });

      setContas(contasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Erro ao carregar contas a receber');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const handleGerarPix = async (parcelaId: string) => {
    setGeneratingPix(parcelaId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pix-for-parcela', {
        body: { parcela_id: parcelaId }
      });

      if (error) throw error;

      if (data.qrCode) {
        toast.success('PIX gerado com sucesso! QR Code copiado.');
        navigator.clipboard.writeText(data.qrCodeText || data.copyPaste);
      }
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      toast.error(error.message || 'Erro ao gerar PIX');
    } finally {
      setGeneratingPix(null);
    }
  };

  const handleGerarBoleto = async (parcelaId: string) => {
    toast.info('Gerando boleto...');
    try {
      const { data, error } = await supabase.functions.invoke('generate-boleto-for-parcela', {
        body: { parcela_id: parcelaId }
      });

      if (error) throw error;

      if (data.bankSlipUrl) {
        window.open(data.bankSlipUrl, '_blank');
        toast.success('Boleto gerado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error);
      toast.error(error.message || 'Erro ao gerar boleto');
    }
  };

  const contasFiltradas = useMemo(() => {
    return contas.filter(conta => {
      const matchSearch = conta.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          conta.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || conta.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contas, searchTerm, statusFilter]);

  const totais = useMemo(() => {
    const total = contasFiltradas.reduce((acc, c) => acc + c.valor, 0);
    const pago = contasFiltradas.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor, 0);
    const pendente = contasFiltradas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0);
    const atrasado = contasFiltradas.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + c.valor, 0);
    return { total, pago, pendente, atrasado };
  }, [contasFiltradas]);

  const getStatusConfig = (status: ContaReceber['status']) => {
    switch (status) {
      case 'pago':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-white border border-emerald-200', label: 'Recebido' };
      case 'pendente':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-white border border-amber-200', label: 'Aguardando' };
      case 'atrasado':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-white border border-red-200', label: 'Atrasado' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-white border border-gray-200', label: status };
    }
  };

  if (!permissions.canViewRecebimentos) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center bg-white shadow-sm">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm">Você não tem permissão para acessar recebimentos.</p>
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
            <h1 className="text-lg font-semibold text-gray-900">Contas a Receber</h1>
            <p className="text-gray-500 text-sm">Parcelas e cobranças via Asaas</p>
          </div>
        </div>
        <Button onClick={fetchContas} disabled={loading} variant="outline" size="sm" className="bg-white shadow-sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Totais - Cards com hierarquia visual clara */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white shadow-sm border-l-4 border-l-gray-300">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Recebido</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Aguardando</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.pendente)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Em Atraso</p>
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
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-gray-50 border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pago">Recebido</SelectItem>
                <SelectItem value="pendente">Aguardando</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
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
              <ArrowUpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            <User className="h-3 w-3 text-gray-400" />
                            {conta.cliente_nome}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{conta.cliente_email}</p>
                          {conta.numero_parcela && conta.total_parcelas && (
                            <Badge variant="outline" className="text-xs mt-1 border-gray-200 text-gray-600">
                              Parcela {conta.numero_parcela}/{conta.total_parcelas}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
                        <div className="text-left sm:text-right min-w-[100px]">
                          <p className="text-xs text-gray-500">Vencimento</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          {diasRestantes < 0 && conta.status !== 'pago' && (
                            <p className="text-xs text-red-600">{Math.abs(diasRestantes)} dias em atraso</p>
                          )}
                        </div>
                        
                        <div className="text-right min-w-[90px]">
                          <p className="text-base font-semibold text-gray-900">{formatCurrency(conta.valor)}</p>
                          <Badge className={`${statusConfig.bg} ${statusConfig.color} text-xs`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        {conta.status !== 'pago' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGerarPix(conta.id)}
                              disabled={generatingPix === conta.id}
                              className="h-9 bg-white shadow-sm"
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              PIX
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGerarBoleto(conta.id)}
                              className="h-9 bg-white shadow-sm"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Boleto
                            </Button>
                          </div>
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

export default ContasReceberPage;
