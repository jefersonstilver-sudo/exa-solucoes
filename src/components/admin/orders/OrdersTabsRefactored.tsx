import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { useOrderBlocking } from '@/hooks/useOrderBlocking';
import { useAuth } from '@/hooks/useAuth';
import { BlockOrderModal } from '@/components/admin/orders/BlockOrderModal';
import { MinimalOrderCard } from './components/MinimalOrderCard';
import { EnhancedOrderCard } from './components/EnhancedOrderCard';
import { SortSelector, SortField, SortDirection } from './components/SortSelector';
import { SortableTab } from './components/SortableTab';
import { bulkDeletePedidos, bulkDeleteTentativas, superAdminBulkDeletePedidos } from '@/services/bulkDeleteService';
import { Trash2, AlertTriangle, LayoutList, LayoutGrid, Users } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';

interface OrdersTabsRefactoredProps {
  onViewOrderDetails: (orderId: string) => void;
}

// Configuração das abas
const TAB_CONFIG: Record<string, { icon: string; label: string; shortLabel: string }> = {
  todos: { icon: '📋', label: 'Todos', shortLabel: 'Todos' },
  pendente: { icon: '⏳', label: 'Pendente', shortLabel: 'Pendente' },
  aguardando_contrato: { icon: '📄', label: 'Ag. Contrato', shortLabel: 'Ag. Contrato' },
  aguardando_video: { icon: '📹', label: 'Ag. Vídeo', shortLabel: 'Ag. Vídeo' },
  video_enviado: { icon: '📤', label: 'Vídeo Enviado', shortLabel: 'Enviado' },
  video_aprovado: { icon: '✅', label: 'Vídeo Aprovado', shortLabel: 'Aprovado' },
  ativo: { icon: '🟢', label: 'Ativo', shortLabel: 'Ativo' },
  finalizado: { icon: '✔️', label: 'Finalizado', shortLabel: 'Finalizado' },
  cancelado: { icon: '❌', label: 'Cancelado', shortLabel: 'Cancelado' },
  bloqueado: { icon: '🔒', label: 'Bloqueado', shortLabel: 'Bloqueado' },
};

const DEFAULT_TAB_ORDER = [
  'todos', 'pendente', 'aguardando_contrato', 'aguardando_video',
  'video_enviado', 'video_aprovado', 'ativo', 'finalizado', 
  'cancelado', 'bloqueado'
];

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
  const [groupByClient, setGroupByClient] = useState(false);
  // Estado de ordenação
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Estado de ordem das abas (salvo no localStorage)
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orders_tab_order');
      return saved ? JSON.parse(saved) : DEFAULT_TAB_ORDER;
    } catch {
      return DEFAULT_TAB_ORDER;
    }
  });
  
  const isSuperAdmin = userProfile?.role === 'super_admin';

  // Sensor para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Função de ordenação dinâmica
  const sortItems = (items: OrderOrAttempt[]) => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'client_name':
          comparison = (a.client_name || '').localeCompare(b.client_name || '', 'pt-BR');
          break;
        case 'valor_total':
          comparison = (a.valor_total || 0) - (b.valor_total || 0);
          break;
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  };

  // Filtrar pedidos por STATUS INDIVIDUAL - MÁQUINA DE ESTADOS CANÔNICA v1.0
  const filteredOrders = useMemo(() => {
    const now = new Date();
    
    return {
      // 📋 TODOS: Todos os pedidos e tentativas
      todos: sortItems(ordersAndAttempts),
      
      // ⏳ PENDENTE: Aguardando pagamento (pedidos + tentativas)
      pendente: sortItems(
        ordersAndAttempts.filter(item => 
          (item.type === 'order' && item.status === 'pendente') ||
          item.type === 'attempt'
        )
      ),
      
      // 📄 AGUARDANDO CONTRATO
      aguardando_contrato: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'aguardando_contrato'
        )
      ),
      
      // 📹 AGUARDANDO VÍDEO
      aguardando_video: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'aguardando_video'
        )
      ),
      
      // 📤 VÍDEO ENVIADO
      video_enviado: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'video_enviado'
        )
      ),
      
      // ✅ VÍDEO APROVADO
      video_aprovado: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'video_aprovado'
        )
      ),
      
      // 🟢 ATIVO: Em exibição E dentro do período
      ativo: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && 
          item.status === 'ativo' &&
          item.data_fim && new Date(item.data_fim) > now
        )
      ),
      
      // ✔️ FINALIZADO: Campanhas encerradas
      finalizado: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && 
          (item.status === 'finalizado' || 
           (item.status === 'ativo' && item.data_fim && new Date(item.data_fim) <= now))
        )
      ),
      
      // ❌ CANCELADO: Cancelados manualmente ou automaticamente
      cancelado: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && 
          ['cancelado', 'cancelado_automaticamente'].includes(item.status)
        )
      ),
      
      // 🔒 BLOQUEADO
      bloqueado: sortItems(
        ordersAndAttempts.filter(item => 
          item.type === 'order' && item.status === 'bloqueado'
        )
      )
    };
  }, [ordersAndAttempts, sortField, sortDirection]);

  // Handler para mudança de ordenação
  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Handler para drag & drop das abas
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tabOrder.indexOf(active.id as string);
      const newIndex = tabOrder.indexOf(over.id as string);
      const newOrder = arrayMove(tabOrder, oldIndex, newIndex);
      setTabOrder(newOrder);
      localStorage.setItem('orders_tab_order', JSON.stringify(newOrder));
    }
  };

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
      {/* Barra de controles */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Seletor de ordenação */}
        <SortSelector
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
        
        {/* Toggle de visualização */}
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
      
      <Tabs defaultValue="todos" className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tabOrder} strategy={horizontalListSortingStrategy}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {tabOrder.map((tabId) => {
                const config = TAB_CONFIG[tabId];
                if (!config) return null;
                const count = filteredOrders[tabId as keyof typeof filteredOrders]?.length || 0;
                
                return (
                  <SortableTab key={tabId} id={tabId}>
                    <TabsTrigger value={tabId} className="min-w-[80px] cursor-grab active:cursor-grabbing">
                      {config.icon} {config.shortLabel}
                      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  </SortableTab>
                );
              })}
            </TabsList>
          </SortableContext>
        </DndContext>

        <TabsContent value="todos">
          {renderOrdersList(filteredOrders.todos, 'Nenhum pedido ou tentativa encontrada.')}
        </TabsContent>

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
