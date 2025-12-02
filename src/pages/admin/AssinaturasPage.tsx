import React, { useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Search, Filter, CreditCard, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/priceUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AssinaturasPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useAdvancedResponsive();
  const { canViewOrders, isLoadingCustom } = useUserPermissions();
  const { ordersAndAttempts, loading, refetch } = useOrdersWithAttemptsRefactored();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');

  // Filtrar apenas pedidos fidelidade
  const fidelityOrders = useMemo(() => {
    return ordersAndAttempts.filter(item => 
      item.type === 'order' && item.is_fidelidade === true
    );
  }, [ordersAndAttempts]);

  // Aplicar filtros
  const filteredOrders = useMemo(() => {
    return fidelityOrders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const matchesPayment = paymentTypeFilter === 'all' ||
        (paymentTypeFilter === 'boleto' && order.tipo_pagamento === 'boleto_fidelidade') ||
        (paymentTypeFilter === 'pix' && order.tipo_pagamento === 'pix_fidelidade');
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [fidelityOrders, searchTerm, statusFilter, paymentTypeFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = fidelityOrders.length;
    const ativos = fidelityOrders.filter(o => ['video_aprovado', 'ativo', 'em_exibicao'].includes(o.status)).length;
    const pendentes = fidelityOrders.filter(o => o.status === 'pendente' || o.status === 'aguardando_pagamento').length;
    const mrr = fidelityOrders
      .filter(o => ['video_aprovado', 'ativo', 'em_exibicao'].includes(o.status))
      .reduce((acc, o) => acc + (o.valor_total / (o.plano_meses || 1)), 0);
    
    return { total, ativos, pendentes, mrr };
  }, [fidelityOrders]);

  if (isLoadingCustom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canViewOrders) {
    return <Navigate to="/admin" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'video_aprovado':
      case 'ativo':
      case 'em_exibicao':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">Ativo</Badge>;
      case 'pendente':
      case 'aguardando_pagamento':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">Pendente</Badge>;
      case 'atrasado':
      case 'suspenso':
        return <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[10px]">Atrasado</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getPaymentBadge = (tipo: string) => {
    if (tipo === 'boleto_fidelidade') {
      return <Badge variant="outline" className="text-[10px]">Boleto</Badge>;
    }
    if (tipo === 'pix_fidelidade') {
      return <Badge variant="outline" className="text-[10px] bg-primary/5">PIX</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{tipo}</Badge>;
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] shadow-lg">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white">Assinaturas</h1>
                  <p className="text-[10px] text-white/80">{filteredOrders.length} fidelidade</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="p-3 bg-white border-b">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="text-sm font-bold">{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Ativos</p>
              <p className="text-sm font-bold text-emerald-600">{stats.ativos}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Pendentes</p>
              <p className="text-sm font-bold text-amber-600">{stats.pendentes}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">MRR</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(stats.mrr)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Mobile List */}
        <div className="p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma assinatura encontrada
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className="overflow-hidden border-l-2 border-l-primary hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/super_admin/pedidos/${order.id}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{order.client_name || 'Cliente'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{order.client_email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.tipo_pagamento || '')}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
                    </span>
                    <span className="font-semibold">{formatCurrency(order.valor_total)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/90 border-b border-border/30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Assinaturas Fidelidade</h1>
                <p className="text-sm text-muted-foreground">{fidelityOrders.length} contratos ativos</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-background/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de Assinaturas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.ativos}</p>
                  <p className="text-xs text-muted-foreground">Assinaturas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendentes}</p>
                  <p className="text-xs text-muted-foreground">Aguardando Pagamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.mrr)}</p>
                  <p className="text-xs text-muted-foreground">Receita Mensal (MRR)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="video_aprovado">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="boleto">Boleto Fidelidade</SelectItem>
                  <SelectItem value="pix">PIX Fidelidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Cliente</TableHead>
                  <TableHead className="text-xs">Plano</TableHead>
                  <TableHead className="text-xs">Pagamento</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Valor Total</TableHead>
                  <TableHead className="text-xs text-right">Valor Mensal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/super_admin/pedidos/${order.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.client_name || 'Cliente'}</p>
                          <p className="text-xs text-muted-foreground">{order.client_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
                      </TableCell>
                      <TableCell>{getPaymentBadge(order.tipo_pagamento || '')}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {formatCurrency(order.valor_total)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatCurrency(order.valor_total / (order.plano_meses || 1))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssinaturasPage;
