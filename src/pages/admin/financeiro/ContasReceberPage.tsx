import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
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
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Recebido' };
      case 'pendente':
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Aguardando' };
      case 'atrasado':
        return { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 animate-pulse', label: 'Atrasado' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: status };
    }
  };

  if (!permissions.canViewRecebimentos) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar recebimentos.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <ArrowUpCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground text-sm">Parcelas e cobranças via Asaas</p>
          </div>
        </div>
        <Button onClick={fetchContas} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold">{formatCurrency(totais.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 mb-1">Recebido</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-amber-600 mb-1">Aguardando</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(totais.pendente)}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <p className="text-xs text-destructive mb-1">Em Atraso</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(totais.atrasado)}</p>
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
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
                        <p className="font-medium flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {conta.cliente_nome}
                        </p>
                        <p className="text-sm text-muted-foreground">{conta.cliente_email}</p>
                        {conta.numero_parcela && conta.total_parcelas && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Parcela {conta.numero_parcela}/{conta.total_parcelas}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-muted-foreground">Vencimento</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {diasRestantes < 0 && conta.status !== 'pago' && (
                          <p className="text-xs text-destructive">{Math.abs(diasRestantes)} dias em atraso</p>
                        )}
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold">{formatCurrency(conta.valor)}</p>
                        <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
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
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            PIX
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGerarBoleto(conta.id)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Boleto
                          </Button>
                        </div>
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

export default ContasReceberPage;
