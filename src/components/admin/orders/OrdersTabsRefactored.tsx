import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { useOrderBlocking } from '@/hooks/useOrderBlocking';
import { useAuth } from '@/hooks/useAuth';
import { BlockOrderModal } from '@/components/admin/orders/BlockOrderModal';
import { MinimalOrderCard } from './components/MinimalOrderCard';
import { EnhancedOrderCard } from './components/EnhancedOrderCard';
import { bulkDeletePedidos, bulkDeleteTentativas, superAdminBulkDeletePedidos } from '@/services/bulkDeleteService';
import { Trash2, AlertTriangle, LayoutList, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';

interface OrdersTabsRefactoredProps {
  onViewOrderDetails: (orderId: string) => void;
}

const OrdersTabsRefactored: React.FC<OrdersTabsRefactoredProps> = ({ onViewOrderDetails }) => {
  const { ordersAndAttempts, loading, refetch } = useOrdersWithAttemptsRefactored();
  const { blockOrder, unblockOrder, isBlocking, isUnblocking } = useOrderBlocking();
  const { userProfile } = useAuth();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedOrderForBlocking, setSelectedOrderForBlocking] = useState<string | null>(null);
  const [blockingMode, setBlockingMode] = useState<'block' | 'unblock'>('block');
  const [viewMode, setViewMode] = useState<'minimal' | 'detailed'>('minimal');
  
  const isSuperAdmin = userProfile?.role === 'super_admin';

  // ORDENAÇÃO: Sempre por created_at DESC (mais novos primeiro)
  const sortByNewest = (items: OrderOrAttempt[]) => 
    [...items].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  // Filtrar pedidos por categoria - Lógica consolidada do Fluxo Opção B
  const filteredOrders = useMemo(() => {
    const now = new Date();
    
    // 🟢 ATIVOS: Em exibição (ativo/video_aprovado) E data_fim > hoje
    const active = sortByNewest(
      ordersAndAttempts.filter(item => 
        item.type === 'order' && 
        ['ativo', 'video_aprovado'].includes(item.status) &&
        item.data_fim && new Date(item.data_fim) > now
      )
    );
    
    // 📹 PROCESSANDO: Aguardando vídeo/aprovação
    const processing = sortByNewest(
      ordersAndAttempts.filter(item => 
        item.type === 'order' && 
        ['aguardando_video', 'video_enviado'].includes(item.status)
      )
    );
    
    // 📄 AGUARDANDO CONTRATO: Pedidos com pagamento confirmado aguardando assinatura
    const awaitingContract = sortByNewest(
      ordersAndAttempts.filter(item => 
        item.type === 'order' && 
        item.status === 'aguardando_contrato'
      )
    );
    
    // 💳 PAGOS: Pedidos que têm pagamento confirmado (qualquer status que não seja ativo/finalizado)
    const paid = sortByNewest(
      ordersAndAttempts.filter(item => 
        item.type === 'order' && 
        item.hasPaidInstallment &&
        !['ativo', 'video_aprovado', 'cancelado', 'cancelado_automaticamente', 'bloqueado', 'pago_pendente_video'].includes(item.status)
      )
    );
    
    // ⏳ AGUARDANDO PAGAMENTO: Pendentes + Tentativas (SEM parcela paga)
    const awaitingPayment = sortByNewest(
      ordersAndAttempts.filter(item => 
        (item.type === 'order' && item.status === 'pendente' && !item.hasPaidInstallment) ||
        item.type === 'attempt'
      )
    );
    
    // 🔒 BLOQUEADOS: Bloqueados + Legados (pago_pendente_video)
    const blocked = sortByNewest(
      ordersAndAttempts.filter(item => 
        item.type === 'order' && 
        ['bloqueado', 'pago_pendente_video'].includes(item.status)
      )
    );
    
    // ❌ CANCELADOS: Cancelados
    const canceled = sortByNewest(
      ordersAndAttempts.filter(item => 
        item.type === 'order' && 
        ['cancelado', 'cancelado_automaticamente'].includes(item.status)
      )
    );
    
    // ✅ FINALIZADOS: data_fim <= hoje (já expiraram)
    const completed = sortByNewest(
      ordersAndAttempts.filter(item => 
        item.type === 'order' && 
        ['ativo', 'video_aprovado'].includes(item.status) &&
        item.data_fim && new Date(item.data_fim) <= now
      )
    );
    
    return { active, processing, awaitingContract, paid, awaitingPayment, blocked, canceled, completed };
  }, [ordersAndAttempts]);

  // Handlers
  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (items: OrderOrAttempt[], checked: boolean) => {
    const itemIds = items.map(item => item.id);
    if (checked) {
      setSelectedItems(prev => [...new Set([...prev, ...itemIds])]);
    } else {
      setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!isSuperAdmin) {
      toast.error('Apenas Super Administradores podem excluir pedidos');
      return;
    }
    
    if (selectedItems.length === 0 || !deleteJustification.trim()) {
      toast.error('Selecione itens e forneça justificativa');
      return;
    }

    setIsDeleting(true);
    try {
      const selectedPedidos = selectedItems.filter(id => 
        ordersAndAttempts.find(item => item.id === id && item.type === 'order')
      );
      const selectedTentativas = selectedItems.filter(id => 
        ordersAndAttempts.find(item => item.id === id && item.type === 'attempt')
      );

      let totalDeleted = 0;

      if (selectedPedidos.length > 0) {
        const result = await superAdminBulkDeletePedidos(selectedPedidos, deleteJustification);
        totalDeleted += result.deleted_count;
      }

      if (selectedTentativas.length > 0) {
        const result = await bulkDeleteTentativas(selectedTentativas, deleteJustification);
        totalDeleted += result.deleted_count;
      }

      toast.success(`${totalDeleted} item(s) excluído(s)`);
      setSelectedItems([]);
      setDeleteJustification('');
      setIsDeleteDialogOpen(false);
      await refetch();
    } catch (error) {
      toast.error('Erro na exclusão: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBlockOrder = (orderId: string) => {
    setSelectedOrderForBlocking(orderId);
    setBlockingMode('block');
    setBlockModalOpen(true);
  };

  const handleUnblockOrder = (orderId: string) => {
    setSelectedOrderForBlocking(orderId);
    setBlockingMode('unblock');
    setBlockModalOpen(true);
  };

  const handleBlockModalConfirm = async (reason: string) => {
    if (!selectedOrderForBlocking) return;
    try {
      if (blockingMode === 'block') {
        await blockOrder(selectedOrderForBlocking, reason);
      } else {
        await unblockOrder(selectedOrderForBlocking, reason);
      }
      await refetch();
    } catch (error) {
      console.error('Erro ao processar bloqueio:', error);
    } finally {
      setBlockModalOpen(false);
      setSelectedOrderForBlocking(null);
    }
  };

  // Renderização de lista
  const renderOrdersList = (items: OrderOrAttempt[], emptyMessage: string) => (
    <div className="space-y-2">
      {/* Seleção em massa */}
      {items.length > 0 && isSuperAdmin && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={items.every(item => selectedItems.includes(item.id))}
              onCheckedChange={(checked) => handleSelectAll(items, checked as boolean)}
            />
            <span className="text-sm text-muted-foreground">
              Selecionar todos ({items.length})
            </span>
          </div>
          
          {selectedItems.length > 0 && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir ({selectedItems.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Confirmar Exclusão
                  </DialogTitle>
                </DialogHeader>
                <Alert variant="destructive">
                  <AlertDescription>
                    Esta ação irá deletar {selectedItems.length} item(s) permanentemente.
                  </AlertDescription>
                </Alert>
                <Textarea
                  value={deleteJustification}
                  onChange={(e) => setDeleteJustification(e.target.value)}
                  placeholder="Justificativa obrigatória..."
                  className="min-h-[80px]"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting || !deleteJustification.trim()}>
                    {isDeleting ? 'Excluindo...' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
      
      {/* Lista de items */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : viewMode === 'minimal' ? (
        <div className="space-y-1">
          {items.map(item => (
            <MinimalOrderCard
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelectionChange={handleSelectItem}
              onViewOrderDetails={onViewOrderDetails}
              showCheckbox={isSuperAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <EnhancedOrderCard
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelectionChange={handleSelectItem}
              onViewOrderDetails={onViewOrderDetails}
              onBlockOrder={handleBlockOrder}
              onUnblockOrder={handleUnblockOrder}
              isBlocking={isBlocking}
              isUnblocking={isUnblocking}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle de visualização */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'minimal' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('minimal')}
            className="h-8 px-3"
          >
            <LayoutList className="h-4 w-4 mr-1.5" />
            Compacto
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('detailed')}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Detalhado
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="active" className="flex-1 min-w-[100px]">
            🟢 Ativos
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.active.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex-1 min-w-[110px]">
            📹 Processando
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.processing.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-1 min-w-[90px]">
            💳 Pagos
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.paid.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex-1 min-w-[130px]">
            📄 Ag. Contrato
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.awaitingContract.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex-1 min-w-[140px]">
            ⏳ Ag. Pagamento
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.awaitingPayment.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex-1 min-w-[100px]">
            🔒 Bloqueados
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.blocked.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="canceled" className="flex-1 min-w-[100px]">
            ❌ Cancelados
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.canceled.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-[100px]">
            ✅ Finalizados
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.completed.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {renderOrdersList(filteredOrders.active, 'Nenhum pedido em exibição.')}
        </TabsContent>
        
        <TabsContent value="processing">
          {renderOrdersList(filteredOrders.processing, 'Nenhum pedido aguardando vídeo ou aprovação.')}
        </TabsContent>
        
        <TabsContent value="paid">
          {renderOrdersList(filteredOrders.paid, 'Nenhum pedido com pagamento confirmado aguardando próximas etapas.')}
        </TabsContent>
        
        <TabsContent value="contract">
          {renderOrdersList(filteredOrders.awaitingContract, 'Nenhum pedido aguardando contrato.')}
        </TabsContent>
        
        <TabsContent value="payment">
          {renderOrdersList(filteredOrders.awaitingPayment, 'Nenhum pedido ou tentativa aguardando pagamento.')}
        </TabsContent>
        
        <TabsContent value="blocked">
          {renderOrdersList(filteredOrders.blocked, 'Nenhum pedido bloqueado.')}
        </TabsContent>
        
        <TabsContent value="canceled">
          {renderOrdersList(filteredOrders.canceled, 'Nenhum pedido cancelado.')}
        </TabsContent>
        
        <TabsContent value="completed">
          {renderOrdersList(filteredOrders.completed, 'Nenhum pedido finalizado.')}
        </TabsContent>
      </Tabs>

      {/* Modal de Bloqueio */}
      <BlockOrderModal
        isOpen={blockModalOpen}
        onClose={() => { setBlockModalOpen(false); setSelectedOrderForBlocking(null); }}
        onConfirm={handleBlockModalConfirm}
        isBlocking={blockingMode === 'block' ? isBlocking : isUnblocking}
        mode={blockingMode}
      />
    </div>
  );
};

export default OrdersTabsRefactored;
