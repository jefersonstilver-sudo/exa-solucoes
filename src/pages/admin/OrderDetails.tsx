
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag,
  Building,
  Calendar,
  Clock,
  CreditCard,
  Download,
  Users,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { usePixMonitor } from '@/services/payment/usePixMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
}

interface OrderDetails {
  id: string;
  created_at: string;
  client_id: string;
  status: string | boolean;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  log_pagamento: any;
  client_email?: string;
  client_name?: string;
  buildings?: Building[];
}

const OrderDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  
  useEffect(() => {
    if (!id) return;
    fetchOrderDetails(id);
  }, [id]);
  
  const fetchOrderDetails = async (orderId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;
      if (!orderData) {
        toast.error('Pedido não encontrado');
        navigate('/admin/pedidos');
        return;
      }
      
      // Fetch client information
      if (orderData.client_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', orderData.client_id)
          .single();
          
        if (!userError && userData) {
          setClientInfo(userData);
          
          // Add client info to order
          orderData.client_email = userData.email;
          orderData.client_name = userData.name || userData.email;
        }
      }
      
      // Fetch buildings information if lista_paineis exists
      if (Array.isArray(orderData.lista_paineis) && orderData.lista_paineis.length > 0) {
        // First get paineis to get building IDs
        const { data: panelsData, error: panelsError } = await supabase
          .from('painels')
          .select('building_id')
          .in('id', orderData.lista_paineis);
          
        if (!panelsError && panelsData && panelsData.length > 0) {
          // Get unique building IDs
          const buildingIds = Array.from(new Set(panelsData.map(p => p.building_id)));
          
          // Fetch buildings data
          const { data: buildingsData, error: buildingsError } = await supabase
            .from('buildings')
            .select('id, nome, endereco, bairro')
            .in('id', buildingIds);
            
          if (!buildingsError && buildingsData) {
            setBuildings(buildingsData);
            orderData.buildings = buildingsData;
          }
        }
      }
      
      setOrder(orderData);
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
      toast.error('Erro ao carregar detalhes do pedido');
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
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Handle status change
  const handleStatusChange = async (newStatus: 'pendente' | 'pago' | 'cancelado') => {
    if (!order) return;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', order.id);
        
      if (error) throw error;
      
      toast.success(`Status do pedido alterado para ${newStatus}`);
      
      // Update local state
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do pedido');
    }
  };
  
  // Check payment status manually
  const checkPaymentStatus = async () => {
    if (!order || !order.id) return;
    
    toast.info('Verificando status de pagamento...');
    
    try {
      const paymentId = order.log_pagamento?.payment_id;
      
      if (!paymentId) {
        toast.error('ID de pagamento não encontrado');
        return;
      }
      
      const { checkNow } = usePixMonitor({
        pedidoId: order.id,
        paymentId,
        onStatusChange: (status) => {
          toast.success(`Status atualizado: ${status}`);
          fetchOrderDetails(order.id);
        }
      });
      
      await checkNow();
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
    }
  };
  
  // Copy order ID to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };
  
  if (isLoading) {
    return (
      <AdminLayout title="Detalhes do Pedido">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!order) {
    return (
      <AdminLayout title="Pedido não encontrado">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pedido não encontrado</h2>
          <p className="text-gray-500 mb-4">Não foi possível encontrar o pedido solicitado</p>
          <Button onClick={() => navigate('/admin/pedidos')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> 
            Voltar para lista de pedidos
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  const status = formatStatus(order.status);

  return (
    <AdminLayout title={`Pedido #${order.id.substring(0, 8)}...`}>
      <div className="space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin/pedidos')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista de pedidos
        </Button>
        
        {/* Main info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-2 text-indexa-purple" />
                        Pedido #{order.id.substring(0, 8)}...
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 h-6 w-6 p-1"
                          onClick={() => copyToClipboard(order.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Criado em {formatDate(order.created_at)}
                      </CardDescription>
                    </div>
                    <Badge className={status.color + ' text-sm py-1 px-3'}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Valor Total</p>
                      <p className="text-lg font-bold">{formatCurrency(order.valor_total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duração</p>
                      <p className="text-lg font-bold">
                        {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Data Início</p>
                      <p className="font-medium">{formatDate(order.data_inicio)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Data Fim</p>
                      <p className="font-medium">{formatDate(order.data_fim)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Painéis Selecionados</p>
                      <p className="font-medium">
                        {Array.isArray(order.lista_paineis) ? order.lista_paineis.length : 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Método de Pagamento</p>
                      <p className="font-medium">
                        {order.log_pagamento?.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" onClick={checkPaymentStatus}>
                    Verificar Pagamento
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => handleStatusChange('cancelado')}>
                      Cancelar Pedido
                    </Button>
                    <Button onClick={() => handleStatusChange('pago')}>
                      Marcar como Pago
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
            
            <Tabs defaultValue="buildings">
              <TabsList className="mb-4">
                <TabsTrigger value="buildings">Prédios</TabsTrigger>
                <TabsTrigger value="payment">Pagamento</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="buildings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Prédios Selecionados
                    </CardTitle>
                    <CardDescription>
                      Locais onde os painéis serão exibidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {buildings.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Bairro</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {buildings.map((building) => (
                            <TableRow key={building.id}>
                              <TableCell className="font-medium">{building.nome}</TableCell>
                              <TableCell>{building.endereco}</TableCell>
                              <TableCell>{building.bairro}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Nenhum prédio encontrado para este pedido
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Detalhes do Pagamento
                    </CardTitle>
                    <CardDescription>
                      Informações sobre a transação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.log_pagamento ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Método</p>
                              <p className="font-medium">
                                {order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">ID do Pagamento</p>
                              <p className="font-medium">
                                {order.log_pagamento.payment_id || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Status</p>
                              <p className="font-medium">
                                {order.log_pagamento.payment_status || 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          {order.log_pagamento.payment_method === 'pix' && order.log_pagamento.pix_data && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <h3 className="font-medium mb-2">Dados do PIX</h3>
                              {order.log_pagamento.pix_data.qr_code_base64 && (
                                <div className="flex justify-center mb-4">
                                  <img 
                                    src={`data:image/png;base64,${order.log_pagamento.pix_data.qr_code_base64}`} 
                                    alt="QR Code PIX" 
                                    className="h-44 w-44"
                                  />
                                </div>
                              )}
                              {order.log_pagamento.pix_data.qr_code && (
                                <div className="relative">
                                  <textarea 
                                    readOnly 
                                    value={order.log_pagamento.pix_data.qr_code}
                                    className="w-full h-24 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                                  />
                                  <Button 
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-1 right-1"
                                    onClick={() => copyToClipboard(order.log_pagamento.pix_data.qr_code)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Nenhum detalhe de pagamento encontrado
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" onClick={checkPaymentStatus}>
                      Atualizar Status de Pagamento
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Logs do Pedido
                    </CardTitle>
                    <CardDescription>
                      Histórico de eventos e alterações
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative pl-6 border-l-2 border-indexa-purple">
                        <div className="absolute w-3 h-3 bg-indexa-purple rounded-full -left-[7px] top-1"></div>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)} {new Date(order.created_at).toLocaleTimeString('pt-BR')}</p>
                        <p className="font-medium">Pedido criado</p>
                      </div>
                      
                      {order.log_pagamento?.order_created_at && (
                        <div className="relative pl-6 border-l-2 border-indexa-purple">
                          <div className="absolute w-3 h-3 bg-indexa-purple rounded-full -left-[7px] top-1"></div>
                          <p className="text-sm text-gray-500">{formatDate(order.log_pagamento.order_created_at)} {new Date(order.log_pagamento.order_created_at).toLocaleTimeString('pt-BR')}</p>
                          <p className="font-medium">Pagamento iniciado</p>
                        </div>
                      )}
                      
                      {order.status === 'pago' && (
                        <div className="relative pl-6 border-l-2 border-green-500">
                          <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1"></div>
                          <p className="text-sm text-gray-500">{formatDate(order.log_pagamento?.payment_date || order.created_at)} {order.log_pagamento?.payment_date ? new Date(order.log_pagamento.payment_date).toLocaleTimeString('pt-BR') : ''}</p>
                          <p className="font-medium">Pagamento confirmado</p>
                        </div>
                      )}
                      
                      {order.status === 'cancelado' && (
                        <div className="relative pl-6 border-l-2 border-red-500">
                          <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1"></div>
                          <p className="text-sm text-gray-500">{formatDate(order.log_pagamento?.canceled_at || order.created_at)}</p>
                          <p className="font-medium">Pedido cancelado</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - Customer & Actions */}
          <div className="space-y-6">
            {/* Customer info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientInfo ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Nome</p>
                        <p className="font-medium">{clientInfo.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{clientInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cliente ID</p>
                        <div className="flex items-center">
                          <p className="font-medium text-sm truncate">{clientInfo.id}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-1 h-6 w-6 p-1"
                            onClick={() => copyToClipboard(clientInfo.id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Informações do cliente não encontradas
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => clientInfo?.id && navigate(`/admin/usuarios/clientes/${clientInfo.id}`)}
                    disabled={!clientInfo?.id}
                  >
                    Ver perfil completo
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => handleStatusChange('pago')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Marcar como Pago
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => checkPaymentStatus()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
                    Verificar Pagamento
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => handleStatusChange('cancelado')}
                  >
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    Cancelar Pedido
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Gerar Recibo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetails;
