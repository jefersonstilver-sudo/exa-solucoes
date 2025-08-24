
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import OrdersAndAttemptsTable from './OrdersAndAttemptsTable';
import BulkActionsToolbar from './BulkActionsToolbar';
import BulkDeleteModal from './BulkDeleteModal';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { bulkDeletePedidos } from '@/services/bulkDeleteService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, Clock, DollarSign, Calendar, Shield } from 'lucide-react';

interface OrdersTabsProps {
  onViewOrderDetails: (orderId: string) => void;
}

const OrdersTabs: React.FC<OrdersTabsProps> = ({ onViewOrderDetails }) => {
  const { ordersAndAttempts, stats, loading, refetch } = useOrdersWithAttemptsRefactored();
  const { isSuperAdmin } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTabOrders, setCurrentTabOrders] = useState<(typeof ordersAndAttempts)>([]);
  
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

  // 1. Pedidos Ativos - usando correct_status da função SQL para classificação correta
  const activePedidos = ordersAndAttempts.filter(item => 
    item.type === 'order' && 
    ((item as any).correct_status === 'ativo' || 
     ['ativo', 'video_aprovado'].includes(item.status)) &&
    isWithinActivePeriod(item)
  );

  const concludedPedidos = ordersAndAttempts.filter(item => 
    item.type === 'order' && 
    (item.status === 'expirado' || 
     (['ativo', 'video_aprovado'].includes(item.status) && !isWithinActivePeriod(item)))
  );

  // CORRIGIDO: Apenas pedidos que nunca tiveram vídeos ativos (usando correct_status da função SQL)
  const waitingVideoPedidos = ordersAndAttempts.filter(item => 
    item.type === 'order' && 
    (item as any).correct_status === 'pago_pendente_video'
  );

  // CORREÇÃO: Filtrar corretamente tentativas abandonadas E pedidos cancelados/pendentes
  const abandonedAttempts = ordersAndAttempts.filter(item => 
    item.type === 'attempt' || 
    (item.type === 'order' && ['cancelado', 'pendente'].includes(item.status))
  );

  // Pedidos Bloqueados
  const blockedPedidos = ordersAndAttempts.filter(item => 
    item.type === 'order' && 
    item.status === 'bloqueado'
  );

  // Bulk selection hooks for each tab
  const activeSelection = useBulkSelection(activePedidos.filter(item => item.type === 'order').map(item => item.id));
  const concludedSelection = useBulkSelection(concludedPedidos.filter(item => item.type === 'order').map(item => item.id));
  const waitingSelection = useBulkSelection(waitingVideoPedidos.filter(item => item.type === 'order').map(item => item.id));
  const abandonedSelection = useBulkSelection(abandonedAttempts.map(item => item.id));
  const blockedSelection = useBulkSelection(blockedPedidos.filter(item => item.type === 'order').map(item => item.id));

  const handleBulkDelete = (orders: typeof ordersAndAttempts, selection: ReturnType<typeof useBulkSelection>) => {
    setCurrentTabOrders(orders);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async (justification: string) => {
    const selectedOrders = currentTabOrders.filter(order => 
      order.type === 'order' && 
      (activeSelection.selectedIds.has(order.id) || 
       concludedSelection.selectedIds.has(order.id) || 
       waitingSelection.selectedIds.has(order.id) || 
       abandonedSelection.selectedIds.has(order.id) ||
       blockedSelection.selectedIds.has(order.id))
    );

    const selectedAttempts = currentTabOrders.filter(item => 
      item.type === 'attempt' && 
      abandonedSelection.selectedIds.has(item.id)
    );

    if (selectedOrders.length === 0 && selectedAttempts.length === 0) return;

    setIsDeleting(true);
    try {
      // Delete pedidos if any are selected
      if (selectedOrders.length > 0) {
        const result = await bulkDeletePedidos(
          selectedOrders.map(order => order.id),
          justification
        );

        if (!result.success) {
          setIsDeleting(false);
          return;
        }
      }

      // Delete tentativas if any are selected
      if (selectedAttempts.length > 0) {
        // Primeiro, verificar se há pedidos associados às tentativas e deletá-los
        const tentativaIds = selectedAttempts.map(attempt => attempt.id);
        
        const { data: relatedPedidos, error: relatedPedidosError } = await supabase
          .from('pedidos')
          .select('id')
          .in('source_tentativa_id', tentativaIds);

        if (relatedPedidosError) {
          console.error('Erro ao buscar pedidos relacionados:', relatedPedidosError);
        }

        // Deletar pedidos relacionados primeiro (se existirem)
        if (relatedPedidos && relatedPedidos.length > 0) {
          const relatedPedidoIds = relatedPedidos.map(p => p.id);
          const bulkDeleteResult = await bulkDeletePedidos(relatedPedidoIds, `Deletion of orders related to abandoned attempts: ${justification}`);
          
          if (!bulkDeleteResult.success) {
            toast.error('Erro ao deletar pedidos relacionados às tentativas');
            return;
          }
        }

        // Agora deletar as tentativas
        const { error: attemptsError } = await supabase
          .from('tentativas_compra')
          .delete()
          .in('id', tentativaIds);

        if (attemptsError) {
          console.error('Erro ao deletar tentativas:', attemptsError);
          toast.error('Erro ao deletar algumas tentativas');
        } else {
          toast.success(`${selectedAttempts.length} tentativa(s) e ${relatedPedidos?.length || 0} pedido(s) relacionado(s) deletados com sucesso`);
        }
      }

      // Clear all selections
      activeSelection.clearSelection();
      concludedSelection.clearSelection();
      waitingSelection.clearSelection();
      abandonedSelection.clearSelection();
      blockedSelection.clearSelection();
      
      // Refresh data
      await refetch();
      
      // Close modal
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

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
      <TabsList className="grid w-full grid-cols-5 mb-6">
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
        <TabsTrigger value="abandoned" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Abandonados
          <Badge variant="destructive" className="ml-2">
            {abandonedAttempts.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="blocked" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Bloqueados
          <Badge variant="destructive" className="ml-2">
            {blockedPedidos.length}
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
            {isSuperAdmin && (
              <BulkActionsToolbar
                selectedCount={activeSelection.selectedCount}
                onBulkDelete={() => handleBulkDelete(activePedidos, activeSelection)}
                onClearSelection={activeSelection.clearSelection}
                loading={isDeleting}
              />
            )}
            <OrdersAndAttemptsTable 
              ordersAndAttempts={activePedidos.map(order => ({
                ...order,
                daysRemaining: calculateDaysRemaining(order)
              }))}
              onViewOrderDetails={onViewOrderDetails}
              selectedIds={activeSelection.selectedIds}
              onSelectionChange={activeSelection.toggleSelectItem}
              onSelectAllChange={activeSelection.toggleSelectAll}
              showBulkActions={isSuperAdmin}
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
            {isSuperAdmin && (
              <BulkActionsToolbar
                selectedCount={concludedSelection.selectedCount}
                onBulkDelete={() => handleBulkDelete(concludedPedidos, concludedSelection)}
                onClearSelection={concludedSelection.clearSelection}
                loading={isDeleting}
              />
            )}
            <OrdersAndAttemptsTable 
              ordersAndAttempts={concludedPedidos} 
              onViewOrderDetails={onViewOrderDetails}
              selectedIds={concludedSelection.selectedIds}
              onSelectionChange={concludedSelection.toggleSelectItem}
              onSelectAllChange={concludedSelection.toggleSelectAll}
              showBulkActions={isSuperAdmin}
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
              Pedidos que foram pagos mas nunca tiveram vídeos ativos (aguardando primeiro envio)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuperAdmin && (
              <BulkActionsToolbar
                selectedCount={waitingSelection.selectedCount}
                onBulkDelete={() => handleBulkDelete(waitingVideoPedidos, waitingSelection)}
                onClearSelection={waitingSelection.clearSelection}
                loading={isDeleting}
              />
            )}
            <OrdersAndAttemptsTable 
              ordersAndAttempts={waitingVideoPedidos} 
              onViewOrderDetails={onViewOrderDetails}
              selectedIds={waitingSelection.selectedIds}
              onSelectionChange={waitingSelection.toggleSelectItem}
              onSelectAllChange={waitingSelection.toggleSelectAll}
              showBulkActions={isSuperAdmin}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="abandoned">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Pedidos Abandonados e Cancelados ({abandonedAttempts.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Tentativas de compra não finalizadas e pedidos cancelados - Oportunidades de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuperAdmin && (
              <BulkActionsToolbar
                selectedCount={abandonedSelection.selectedCount}
                onBulkDelete={() => handleBulkDelete(abandonedAttempts, abandonedSelection)}
                onClearSelection={abandonedSelection.clearSelection}
                loading={isDeleting}
              />
            )}
            <OrdersAndAttemptsTable 
              ordersAndAttempts={abandonedAttempts} 
              onViewOrderDetails={onViewOrderDetails}
              selectedIds={abandonedSelection.selectedIds}
              onSelectionChange={abandonedSelection.toggleSelectItem}
              onSelectAllChange={abandonedSelection.toggleSelectAll}
              showBulkActions={isSuperAdmin}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="blocked">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="h-5 w-5 text-red-600" />
              Pedidos Bloqueados ({blockedPedidos.length})
            </CardTitle>
            <CardDescription className="text-gray-700">
              Pedidos que foram bloqueados e precisam ser revisados para desbloqueio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuperAdmin && (
              <BulkActionsToolbar
                selectedCount={blockedSelection.selectedCount}
                onBulkDelete={() => handleBulkDelete(blockedPedidos, blockedSelection)}
                onClearSelection={blockedSelection.clearSelection}
                loading={isDeleting}
              />
            )}
            <OrdersAndAttemptsTable 
              ordersAndAttempts={blockedPedidos} 
              onViewOrderDetails={onViewOrderDetails}
              selectedIds={blockedSelection.selectedIds}
              onSelectionChange={blockedSelection.toggleSelectItem}
              onSelectAllChange={blockedSelection.toggleSelectAll}
              showBulkActions={isSuperAdmin}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        selectedOrders={currentTabOrders.filter(order => 
          (order.type === 'order' && 
           (activeSelection.selectedIds.has(order.id) || 
            concludedSelection.selectedIds.has(order.id) || 
            waitingSelection.selectedIds.has(order.id) || 
            abandonedSelection.selectedIds.has(order.id) ||
            blockedSelection.selectedIds.has(order.id))) ||
          (order.type === 'attempt' && abandonedSelection.selectedIds.has(order.id))
        )}
        loading={isDeleting}
      />
    </Tabs>
  );
};

export default OrdersTabs;
