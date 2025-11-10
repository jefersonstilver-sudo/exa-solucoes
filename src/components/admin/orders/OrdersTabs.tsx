
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { useOrderBlocking } from '@/hooks/useOrderBlocking';
import { useAuth } from '@/hooks/useAuth';
import { BlockOrderModal } from '@/components/admin/orders/BlockOrderModal';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Trash2, AlertTriangle, Building, DollarSign, Calendar, User, Mail, Shield, ShieldOff } from 'lucide-react';
import { EnhancedOrderCard } from './components/EnhancedOrderCard';
import { bulkDeletePedidos, bulkDeleteTentativas, superAdminBulkDeletePedidos } from '@/services/bulkDeleteService';
import { toast } from 'sonner';

interface OrdersTabsProps {
  onViewOrderDetails: (orderId: string) => void;
}

const getStatusColor = (status: string, correctStatus?: string) => {
  const targetStatus = correctStatus || status;
  const statusMap: Record<string, string> = {
    // Novos status inteligentes
    'em_exibicao': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'aguardando_video': 'bg-blue-100 text-blue-800 border-blue-300',
    'aguardando_aprovacao': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'aguardando_pagamento': 'bg-orange-100 text-orange-800 border-orange-300',
    // Status legados (mantidos para compatibilidade)
    'pendente': 'bg-orange-100 text-orange-800 border-orange-300',
    'pago': 'bg-green-100 text-green-800 border-green-300',
    'pago_pendente_video': 'bg-blue-100 text-blue-800 border-blue-300',
    'video_enviado': 'bg-purple-100 text-purple-800 border-purple-300',
    'video_aprovado': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'cancelado': 'bg-red-100 text-red-800 border-red-300',
    'cancelado_automaticamente': 'bg-red-200 text-red-900 border-red-400',
    'tentativa': 'bg-gray-100 text-gray-800 border-gray-300',
    'bloqueado': 'bg-red-200 text-red-900 border-red-400'
  };
  return statusMap[targetStatus] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusText = (status: string, correctStatus?: string) => {
  const targetStatus = correctStatus || status;
  const statusMap: Record<string, string> = {
    // Novos status inteligentes com emojis
    'em_exibicao': '🟢 Em Exibição',
    'aguardando_video': '📹 Aguardando Vídeo',
    'aguardando_aprovacao': '📤 Aguardando Aprovação',
    'aguardando_pagamento': '⏳ Aguardando Pagamento',
    // Status legados
    'pendente': '⏳ Aguardando Pagamento',
    'pago': '✅ Pago',
    'pago_pendente_video': '📹 Aguardando Vídeo',
    'video_enviado': '📤 Vídeo Enviado',
    'video_aprovado': '🟢 Em Exibição',
    'cancelado': '🚫 Cancelado',
    'cancelado_automaticamente': '⏰ Cancelado Automaticamente',
    'tentativa': '📝 Tentativa Abandonada',
    'bloqueado': '🔒 Bloqueado'
  };
  return statusMap[targetStatus] || targetStatus;
};

const OrdersTabs: React.FC<OrdersTabsProps> = ({ onViewOrderDetails }) => {
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
  
  const isSuperAdmin = userProfile?.role === 'super_admin';

  // ORDENAÇÃO GARANTIDA: Sempre DESC por created_at
  const sortByNewest = (items: any[]) => 
    [...items].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  // NOVA LÓGICA: Consolidar "Aguardando Pagamento" (pendentes + tentativas)
  const pendingOrders = sortByNewest(
    ordersAndAttempts.filter(item => 
      (item.type === 'order' && (item.status === 'pendente' || item.correct_status === 'aguardando_pagamento')) || 
      (item.type === 'attempt')
    )
  );

  const activeOrders = sortByNewest(
    ordersAndAttempts.filter(item => 
      item.type === 'order' && (
        ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado'].includes(item.status) ||
        ['em_exibicao', 'aguardando_video', 'aguardando_aprovacao'].includes(item.correct_status || '')
      )
    )
  );

  // Abandonados agora só inclui pedidos cancelados 
  const abandonedItems = sortByNewest(
    ordersAndAttempts.filter(item => 
      item.type === 'order' && ['cancelado', 'cancelado_automaticamente'].includes(item.status)
    )
  );

  const blockedOrders = sortByNewest(
    ordersAndAttempts.filter(item => 
      item.type === 'order' && item.status === 'bloqueado'
    )
  );

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (items: any[], checked: boolean) => {
    const itemIds = items.map(item => item.id);
    if (checked) {
      setSelectedItems(prev => [...new Set([...prev, ...itemIds])]);
    } else {
      setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um item para excluir');
      return;
    }

    if (!deleteJustification.trim()) {
      toast.error('Justificativa é obrigatória');
      return;
    }

    setIsDeleting(true);

    try {
      // Separar pedidos de tentativas
      const selectedPedidos = selectedItems.filter(id => 
        ordersAndAttempts.find(item => item.id === id && item.type === 'order')
      );
      
      const selectedTentativas = selectedItems.filter(id => 
        ordersAndAttempts.find(item => item.id === id && item.type === 'attempt')
      );

      let totalDeleted = 0;
      const errors: string[] = [];

      // Deletar pedidos usando a função adequada baseado no role
      if (selectedPedidos.length > 0) {
        console.log('🗑️ [ORDERS_TAB] Deletando pedidos:', {
          count: selectedPedidos.length,
          isSuperAdmin,
          ids: selectedPedidos
        });
        
        // Se for super admin, usar a função completa que remove tudo
        if (isSuperAdmin) {
          const pedidosResult = await superAdminBulkDeletePedidos(selectedPedidos, deleteJustification);
          totalDeleted += pedidosResult.deleted_count;
          if (!pedidosResult.success && pedidosResult.error) {
            errors.push(`Pedidos: ${pedidosResult.error}`);
          }
        } else {
          // Para não-super-admins, usar a função padrão com validações
          const pedidosResult = await bulkDeletePedidos(selectedPedidos, deleteJustification);
          totalDeleted += pedidosResult.deleted_count;
          if (!pedidosResult.success && pedidosResult.error) {
            errors.push(`Pedidos: ${pedidosResult.error}`);
          }
        }
      }

      // Deletar tentativas
      if (selectedTentativas.length > 0) {
        const tentativasResult = await bulkDeleteTentativas(selectedTentativas, deleteJustification);
        totalDeleted += tentativasResult.deleted_count;
        if (!tentativasResult.success && tentativasResult.error) {
          errors.push(`Tentativas: ${tentativasResult.error}`);
        }
      }

      // Feedback final
      if (errors.length > 0) {
        toast.error(`Exclusão parcial: ${totalDeleted} itens excluídos. Erros: ${errors.join('; ')}`);
      } else {
        toast.success(`${totalDeleted} item(s) excluído(s) com sucesso`);
      }

      // Limpar seleção e atualizar dados
      setSelectedItems([]);
      setDeleteJustification('');
      setIsDeleteDialogOpen(false);
      await refetch();

    } catch (error) {
      console.error('Erro na exclusão em massa:', error);
      toast.error('Erro inesperado na exclusão');
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

  const handleBlockModalClose = () => {
    setBlockModalOpen(false);
    setSelectedOrderForBlocking(null);
  };

  const renderItemCard = (item: any) => (
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
  );

  const renderTab = (items: any[], title: string, description: string) => (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={items.every(item => selectedItems.includes(item.id))}
              onCheckedChange={(checked) => handleSelectAll(items, checked as boolean)}
            />
            <span className="text-sm font-medium">Selecionar todos ({items.length})</span>
          </div>
          
          {selectedItems.length > 0 && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Selecionados ({selectedItems.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Confirmar Exclusão
                  </DialogTitle>
                </DialogHeader>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta ação não pode ser desfeita. {selectedItems.length} item(s) será(ão) permanentemente excluído(s).
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <label htmlFor="justification" className="text-sm font-medium">
                    Justificativa (obrigatória):
                  </label>
                  <Textarea
                    id="justification"
                    value={deleteJustification}
                    onChange={(e) => setDeleteJustification(e.target.value)}
                    placeholder="Descreva o motivo da exclusão..."
                    className="min-h-[80px]"
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleBulkDelete}
                    disabled={isDeleting || !deleteJustification.trim()}
                  >
                    {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>{description}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(renderItemCard)}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-indexa-purple mx-auto mb-2"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="active" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="active" className="relative">
          Pedidos Ativos
          {activeOrders.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {activeOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="pending" className="relative">
          Aguardando Pagamento
          {pendingOrders.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {pendingOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="abandoned" className="relative">
          Cancelados
          {abandonedItems.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {abandonedItems.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="blocked" className="relative">
          Bloqueados
          {blockedOrders.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {blockedOrders.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        {renderTab(activeOrders, 'Pedidos Ativos', 'Nenhum pedido ativo encontrado.')}
      </TabsContent>

      <TabsContent value="pending">
        {renderTab(pendingOrders, 'Aguardando Pagamento (Pedidos + Cotações)', 'Nenhum item aguardando pagamento encontrado.')}
      </TabsContent>

      <TabsContent value="abandoned">
        {renderTab(abandonedItems, 'Pedidos Cancelados', 'Nenhum pedido cancelado encontrado.')}
      </TabsContent>

      <TabsContent value="blocked">
        {renderTab(blockedOrders, 'Pedidos Bloqueados', 'Nenhum pedido bloqueado encontrado.')}
      </TabsContent>

      {/* Modal de Bloqueio */}
      <BlockOrderModal
        isOpen={blockModalOpen}
        onClose={handleBlockModalClose}
        onConfirm={handleBlockModalConfirm}
        isBlocking={blockingMode === 'block' ? isBlocking : isUnblocking}
        mode={blockingMode}
      />
    </Tabs>
  );
};

export default OrdersTabs;
