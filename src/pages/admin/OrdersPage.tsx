import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Filter, 
  Search, 
  RefreshCw, 
  Download, 
  Calendar, 
  ChevronDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { usePixMonitor } from '@/services/payment/usePixMonitor';

interface Pedido {
  id: string;
  created_at: string;
  status: string | boolean;
  valor_total: number;
  lista_paineis: string[] | null;
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  client_id: string;
  log_pagamento?: any;
}

const OrdersPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  // Carregar todos os pedidos
  useEffect(() => {
    fetchPedidos();

    // Configurar inscrição em tempo real para atualizações de pedidos
    const channel = supabase
      .channel('public:pedidos')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        (payload) => {
          console.log('Mudança detectada em pedidos:', payload);
          fetchPedidos(); // Recarregar todos os pedidos quando houver mudanças
        }
      )
      .subscribe();

    // Limpar inscrição ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPedidos = async () => {
    try {
      setIsLoading(true);
      
      // Buscar todos os pedidos
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro detalhado ao carregar pedidos:', error);
        throw error;
      }
      
      console.log("Pedidos carregados:", data);
      setPedidos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error.message || error);
      toast.error('Não foi possível carregar os pedidos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatador de status para exibição
  const formatStatus = (status: string | boolean) => {
    // Convertendo o status para string para garantir compatibilidade
    const statusString = String(status).toLowerCase();
    
    switch (statusString) {
      case 'pendente':
      case 'false':
        return { label: 'Pendente', color: 'bg-yellow-200 text-yellow-800' };
      case 'pago':
      case 'true':
        return { label: 'Pago', color: 'bg-green-200 text-green-800' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'bg-red-200 text-red-800' };
      default:
        return { label: statusString || 'Desconhecido', color: 'bg-gray-200 text-gray-800' };
    }
  };

  // Formatador de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Filter and search functions
  const filterOrders = () => {
    return pedidos.filter(pedido => {
      // Status filter
      if (statusFilter && String(pedido.status).toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      
      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return pedido.id.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  };
  
  // Handle status change
  const handleStatusChange = async (pedidoId: string, newStatus: 'pendente' | 'pago' | 'cancelado') => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', pedidoId);
        
      if (error) throw error;
      
      toast.success(`Status do pedido alterado para ${newStatus}`);
      fetchPedidos(); // Refresh the list
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do pedido');
    }
  };
  
  // Check payment status manually
  const checkPaymentStatus = async (pedido: Pedido) => {
    if (!pedido.id) return;
    
    toast.info('Verificando status de pagamento...');
    
    try {
      const paymentId = pedido.log_pagamento?.payment_id;
      
      if (!paymentId) {
        toast.error('ID de pagamento não encontrado');
        return;
      }
      
      const { checkNow } = usePixMonitor({
        pedidoId: pedido.id,
        paymentId,
        onStatusChange: (status) => {
          toast.success(`Status atualizado: ${status}`);
          fetchPedidos();
        }
      });
      
      await checkNow();
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
    }
  };
  
  // Export orders as CSV
  const exportToCSV = () => {
    const filteredOrders = filterOrders();
    
    // Define CSV headers
    let csv = 'ID,Data,Status,Valor,Duração,Data Início,Data Fim\n';
    
    // Add data rows
    filteredOrders.forEach(order => {
      const row = [
        order.id,
        formatDate(order.created_at),
        String(order.status),
        order.valor_total,
        order.plano_meses,
        formatDate(order.data_inicio),
        formatDate(order.data_fim)
      ].join(',');
      
      csv += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = filterOrders();

  return (
    <AdminLayout title="Gerenciamento de Pedidos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <ShoppingBag className="mr-2 h-6 w-6 text-indexa-purple" />
              Gerenciamento de Pedidos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os pedidos do sistema
            </p>
          </motion.div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPedidos} 
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="todos" onClick={() => setStatusFilter(null)}>
              Todos
            </TabsTrigger>
            <TabsTrigger value="pendentes" onClick={() => setStatusFilter('pendente')}>
              Pendentes
            </TabsTrigger>
            <TabsTrigger value="pagos" onClick={() => setStatusFilter('pago')}>
              Pagos
            </TabsTrigger>
            <TabsTrigger value="cancelados" onClick={() => setStatusFilter('cancelado')}>
              Cancelados
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Lista de Pedidos</CardTitle>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Buscar por ID do pedido..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID do Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Qtd. Painéis</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((pedido) => {
                          const status = formatStatus(pedido.status);
                          const paineisList = Array.isArray(pedido.lista_paineis) ? pedido.lista_paineis : [];
                          
                          return (
                            <TableRow key={pedido.id}>
                              <TableCell className="font-medium">
                                {pedido.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell>
                                {formatDate(pedido.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                R$ {pedido.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
                              </TableCell>
                              <TableCell>
                                {pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>
                                    {formatDate(pedido.data_inicio)} - {formatDate(pedido.data_fim)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {paineisList.length}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/pedidos/detalhes/${pedido.id}`)}
                                  >
                                    Detalhes
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => checkPaymentStatus(pedido)}>
                                        Verificar Pagamento
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pago')}>
                                        Marcar como Pago
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pendente')}>
                                        Marcar como Pendente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'cancelado')}>
                                        Cancelar Pedido
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum pedido encontrado com os filtros atuais
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between py-4">
                <div className="text-sm text-gray-500">
                  Mostrando {filteredOrders.length} de {pedidos.length} pedidos
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Other tabs use the same content but with different filters */}
          <TabsContent value="pendentes" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Lista de Pedidos Pendentes</CardTitle>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Buscar por ID do pedido..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID do Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Qtd. Painéis</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((pedido) => {
                          const status = formatStatus(pedido.status);
                          const paineisList = Array.isArray(pedido.lista_paineis) ? pedido.lista_paineis : [];
                          
                          return (
                            <TableRow key={pedido.id}>
                              <TableCell className="font-medium">
                                {pedido.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell>
                                {formatDate(pedido.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                R$ {pedido.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
                              </TableCell>
                              <TableCell>
                                {pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>
                                    {formatDate(pedido.data_inicio)} - {formatDate(pedido.data_fim)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {paineisList.length}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/pedidos/detalhes/${pedido.id}`)}
                                  >
                                    Detalhes
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => checkPaymentStatus(pedido)}>
                                        Verificar Pagamento
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pago')}>
                                        Marcar como Pago
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pendente')}>
                                        Marcar como Pendente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'cancelado')}>
                                        Cancelar Pedido
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum pedido encontrado com os filtros atuais
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between py-4">
                <div className="text-sm text-gray-500">
                  Mostrando {filteredOrders.length} de {pedidos.length} pedidos
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="pagos" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Lista de Pedidos Pagos</CardTitle>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Buscar por ID do pedido..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID do Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Qtd. Painéis</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((pedido) => {
                          const status = formatStatus(pedido.status);
                          const paineisList = Array.isArray(pedido.lista_paineis) ? pedido.lista_paineis : [];
                          
                          return (
                            <TableRow key={pedido.id}>
                              <TableCell className="font-medium">
                                {pedido.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell>
                                {formatDate(pedido.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                R$ {pedido.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
                              </TableCell>
                              <TableCell>
                                {pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>
                                    {formatDate(pedido.data_inicio)} - {formatDate(pedido.data_fim)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {paineisList.length}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/pedidos/detalhes/${pedido.id}`)}
                                  >
                                    Detalhes
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => checkPaymentStatus(pedido)}>
                                        Verificar Pagamento
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pago')}>
                                        Marcar como Pago
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pendente')}>
                                        Marcar como Pendente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'cancelado')}>
                                        Cancelar Pedido
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum pedido encontrado com os filtros atuais
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between py-4">
                <div className="text-sm text-gray-500">
                  Mostrando {filteredOrders.length} de {pedidos.length} pedidos
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="cancelados" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Lista de Pedidos Cancelados</CardTitle>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Buscar por ID do pedido..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID do Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Qtd. Painéis</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((pedido) => {
                          const status = formatStatus(pedido.status);
                          const paineisList = Array.isArray(pedido.lista_paineis) ? pedido.lista_paineis : [];
                          
                          return (
                            <TableRow key={pedido.id}>
                              <TableCell className="font-medium">
                                {pedido.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell>
                                {formatDate(pedido.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                R$ {pedido.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
                              </TableCell>
                              <TableCell>
                                {pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                  <span>
                                    {formatDate(pedido.data_inicio)} - {formatDate(pedido.data_fim)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {paineisList.length}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/pedidos/detalhes/${pedido.id}`)}
                                  >
                                    Detalhes
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => checkPaymentStatus(pedido)}>
                                        Verificar Pagamento
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pago')}>
                                        Marcar como Pago
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'pendente')}>
                                        Marcar como Pendente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(pedido.id, 'cancelado')}>
                                        Cancelar Pedido
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum pedido encontrado com os filtros atuais
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between py-4">
                <div className="text-sm text-gray-500">
                  Mostrando {filteredOrders.length} de {pedidos.length} pedidos
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
