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

  // Filtrar pedidos por STATUS INDIVIDUAL - MÁQUINA DE ESTADOS CANÔNICA v1.0
  // 9 abas: Pendente, Ag. Contrato, Ag. Vídeo, Vídeo Enviado, Vídeo Aprovado, Ativo, Finalizado, Cancelado, Bloqueado
  const filteredOrders = useMemo(() => {
    const now = new Date();
    
    return {
      // ⏳ PENDENTE: Aguardando pagamento (pedidos + tentativas)
      pendente: sortByNewest(
        ordersAndAttempts.filter(item => 
          (item.type === 'order' && item.status === 'pendente') ||
          item.type === 'attempt'
        )
      ),
      
      // 📄 AGUARDANDO CONTRATO
      aguardando_contrato: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'aguardando_contrato'
        )
      ),
      
      // 📹 AGUARDANDO VÍDEO
      aguardando_video: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'aguardando_video'
        )
      ),
      
      // 📤 VÍDEO ENVIADO
      video_enviado: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'video_enviado'
        )
      ),
      
      // ✅ VÍDEO APROVADO
      video_aprovado: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'video_aprovado'
        )
      ),
      
      // 🟢 ATIVO: Em exibição E dentro do período
      ativo: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && 
          item.status === 'ativo' &&
          item.data_fim && new Date(item.data_fim) > now
        )
      ),
      
      // ✔️ FINALIZADO: Campanhas encerradas
      finalizado: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && 
          (item.status === 'finalizado' || 
           (item.status === 'ativo' && item.data_fim && new Date(item.data_fim) <= now))
        )
      ),
      
      // ❌ CANCELADO: Cancelados manualmente ou automaticamente
      cancelado: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && 
          ['cancelado', 'cancelado_automaticamente'].includes(item.status)
        )
      ),
      
      // 🔒 BLOQUEADO
      bloqueado: sortByNewest(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'bloqueado'
        )
      )
    };
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
      
      <Tabs defaultValue="ativo" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="pendente" className="min-w-[90px]">
            ⏳ Pendente
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.pendente.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aguardando_contrato" className="min-w-[100px]">
            📄 Ag. Contrato
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.aguardando_contrato.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aguardando_video" className="min-w-[90px]">
            📹 Ag. Vídeo
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.aguardando_video.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="video_enviado" className="min-w-[100px]">
            📤 Vídeo Enviado
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.video_enviado.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="video_aprovado" className="min-w-[100px]">
            ✅ Vídeo Aprovado
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.video_aprovado.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ativo" className="min-w-[80px]">
            🟢 Ativo
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.ativo.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="finalizado" className="min-w-[90px]">
            ✔️ Finalizado
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.finalizado.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelado" className="min-w-[90px]">
            ❌ Cancelado
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.cancelado.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="bloqueado" className="min-w-[90px]">
            🔒 Bloqueado
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {filteredOrders.bloqueado.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendente">
          {renderOrdersList(filteredOrders.pendente, 'Nenhum pedido ou tentativa aguardando pagamento.')}
        </TabsContent>
        
        <TabsContent value="aguardando_contrato">
          {renderOrdersList(filteredOrders.aguardando_contrato, 'Nenhum pedido aguardando contrato.')}
        </TabsContent>
        
        <TabsContent value="aguardando_video">
          {renderOrdersList(filteredOrders.aguardando_video, 'Nenhum pedido aguardando vídeo.')}
        </TabsContent>
        
        <TabsContent value="video_enviado">
          {renderOrdersList(filteredOrders.video_enviado, 'Nenhum vídeo em análise.')}
        </TabsContent>
        
        <TabsContent value="video_aprovado">
          {renderOrdersList(filteredOrders.video_aprovado, 'Nenhum vídeo aprovado aguardando ativação.')}
        </TabsContent>
        
        <TabsContent value="ativo">
          {renderOrdersList(filteredOrders.ativo, 'Nenhuma campanha em exibição.')}
        </TabsContent>
        
        <TabsContent value="finalizado">
          {renderOrdersList(filteredOrders.finalizado, 'Nenhuma campanha finalizada.')}
        </TabsContent>
        
        <TabsContent value="cancelado">
          {renderOrdersList(filteredOrders.cancelado, 'Nenhum pedido cancelado.')}
        </TabsContent>
        
        <TabsContent value="bloqueado">
          {renderOrdersList(filteredOrders.bloqueado, 'Nenhum pedido bloqueado.')}
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
