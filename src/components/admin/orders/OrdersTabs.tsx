
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrdersWithAttempts } from '@/hooks/useOrdersWithAttempts';
import OrdersAndAttemptsTable from './OrdersAndAttemptsTable';
import AttemptsTable from './AttemptsTable';
import { CheckCircle, AlertTriangle, Clock, DollarSign, Calendar } from 'lucide-react';

interface OrdersTabsProps {
  onViewOrderDetails: (orderId: string) => void;
}

const OrdersTabs: React.FC<OrdersTabsProps> = ({ onViewOrderDetails }) => {
  const { ordersAndAttempts, stats, loading } = useOrdersWithAttempts();
  
  // Função para calcular dias restantes
  const calculateDaysRemaining = (order: any) => {
    if (!order.data_fim) return null;
    const today = new Date();
    const endDate = new Date(order.data_fim);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Verificar se um pedido está dentro do período ativo
  const isWithinActivePeriod = (order: any) => {
    if (!order.data_inicio || !order.data_fim) return false;
    const today = new Date();
    const startDate = new Date(order.data_inicio);
    const endDate = new Date(order.data_fim);
    return today >= startDate && today <= endDate;
  };

  // 1. Pedidos Ativos - pagos, com vídeo ativo/selecionado e ainda dentro do período
  const activePedidos = ordersAndAttempts.filter(item => 
    item.type === 'order' && 
    ['ativo', 'video_aprovado'].includes(item.status) &&
    isWithinActivePeriod(item)
  );

  const concludedPedidos = ordersAndAttempts.filter(item => 
    item.type === 'order' && 
    (item.status === 'expirado' || 
     (['ativo', 'video_aprovado'].includes(item.status) && !isWithinActivePeriod(item)))
  );

  const waitingVideoPedidos = ordersAndAttempts.filter(item => 
    item.type === 'order' && 
    ['pago', 'pago_pendente_video', 'video_enviado', 'video_rejeitado'].includes(item.status)
  );

  const canceledAbandoned = ordersAndAttempts.filter(item => 
    item.type === 'attempt' || 
    (item.type === 'order' && ['cancelado', 'pendente'].includes(item.status))
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="active" className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Ativos
          <Badge variant="secondary" className="ml-2">
            {activePedidos.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="concluded" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Concluídos
          <Badge variant="secondary" className="ml-2">
            {concludedPedidos.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="waiting" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Aguardando Vídeo
          <Badge variant="secondary" className="ml-2">
            {waitingVideoPedidos.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="canceled" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Cancelados
          <Badge variant="destructive" className="ml-2">
            {canceledAbandoned.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Pedidos Ativos ({activePedidos.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Pedidos pagos com vídeo ativo e ainda dentro do período contratado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersAndAttemptsTable 
              ordersAndAttempts={activePedidos.map(order => ({
                ...order,
                daysRemaining: calculateDaysRemaining(order)
              }))}
              onViewOrderDetails={onViewOrderDetails}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="concluded">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              Pedidos Concluídos ({concludedPedidos.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Pedidos que foram pagos, exibiram vídeo e já finalizaram o período contratado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersAndAttemptsTable 
              ordersAndAttempts={concludedPedidos} 
              onViewOrderDetails={onViewOrderDetails}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="waiting">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pedidos Pagos Aguardando Vídeo ({waitingVideoPedidos.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Pedidos que foram pagos mas ainda não têm vídeo enviado, aprovado ou estão rejeitados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersAndAttemptsTable 
              ordersAndAttempts={waitingVideoPedidos} 
              onViewOrderDetails={onViewOrderDetails}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="canceled">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Pedidos Cancelados e Tentativas Abandonadas ({canceledAbandoned.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Tentativas de compra não finalizadas e pedidos cancelados - Oportunidades de CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttemptsTable attempts={canceledAbandoned} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default OrdersTabs;
