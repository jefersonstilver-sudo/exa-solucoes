
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrdersWithAttempts } from '@/hooks/useOrdersWithAttempts';
import OrdersAndAttemptsTable from './OrdersAndAttemptsTable';
import AttemptsTable from './AttemptsTable';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const OrdersTabs: React.FC = () => {
  const { ordersAndAttempts, stats, loading } = useOrdersWithAttempts();
  
  // Separar pedidos concluídos de tentativas
  const completedOrders = ordersAndAttempts.filter(item => 
    item.type === 'order' && item.status !== 'pendente'
  );
  
  const attempts = ordersAndAttempts.filter(item => 
    item.type === 'attempt' || (item.type === 'order' && item.status === 'pendente')
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
    <Tabs defaultValue="completed" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="completed" className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Pedidos Concluídos
          <Badge variant="secondary" className="ml-2">
            {completedOrders.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="attempts" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Tentativas/Intenções
          <Badge variant="destructive" className="ml-2">
            {attempts.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="completed">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Pedidos Concluídos ({completedOrders.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Pedidos que foram pagos e estão em processamento ou concluídos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersAndAttemptsTable ordersAndAttempts={completedOrders} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="attempts">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Tentativas e Intenções de Compra ({attempts.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Usuários que iniciaram o processo de compra mas não finalizaram o pagamento - Oportunidades de CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttemptsTable attempts={attempts} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default OrdersTabs;
