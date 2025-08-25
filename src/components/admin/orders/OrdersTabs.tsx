
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
import { BlockOrderModal } from '@/components/admin/orders/BlockOrderModal';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Trash2, AlertTriangle, Building, DollarSign, Calendar, User, Mail, Shield, ShieldOff } from 'lucide-react';
import { bulkDeletePedidos, bulkDeleteTentativas } from '@/services/bulkDeleteService';
import { toast } from 'sonner';

interface OrdersTabsProps {
  onViewOrderDetails: (orderId: string) => void;
}

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'pago': 'bg-green-100 text-green-800',
    'pago_pendente_video': 'bg-blue-100 text-blue-800',
    'video_enviado': 'bg-purple-100 text-purple-800',
    'video_aprovado': 'bg-emerald-100 text-emerald-800',
    'cancelado': 'bg-red-100 text-red-800',
    'cancelado_automaticamente': 'bg-red-100 text-red-800',
    'tentativa': 'bg-gray-100 text-gray-800',
    'bloqueado': 'bg-red-200 text-red-900'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pendente': 'Aguardando Pagamento',
    'pago': 'Pago',
    'pago_pendente_video': 'Pago - Aguardando Vídeo',
    'video_enviado': 'Vídeo Enviado',
    'video_aprovado': 'Em Exibição',
    'cancelado': 'Cancelado',
    'cancelado_automaticamente': 'Cancelado Automaticamente',
    'tentativa': 'Tentativa Abandonada',
    'bloqueado': 'Bloqueado'
  };
  return statusMap[status] || status;
};

const OrdersTabs: React.FC<OrdersTabsProps> = ({ onViewOrderDetails }) => {
  const { ordersAndAttempts, loading, refetch } = useOrdersWithAttemptsRefactored();
  const { blockOrder, unblockOrder, isBlocking, isUnblocking } = useOrderBlocking();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedOrderForBlocking, setSelectedOrderForBlocking] = useState<string | null>(null);
  const [blockingMode, setBlockingMode] = useState<'block' | 'unblock'>('block');

  // Filtrar itens por categoria - CORREÇÃO: remover 'pendente' de abandonados
  const pendingOrders = ordersAndAttempts.filter(item => 
    item.type === 'order' && item.status === 'pendente'
  );

  const activeOrders = ordersAndAttempts.filter(item => 
    item.type === 'order' && ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado'].includes(item.status)
  );

  // CORREÇÃO: Abandonados agora só inclui tentativas e pedidos cancelados (sem pendente)
  const abandonedItems = ordersAndAttempts.filter(item => 
    (item.type === 'attempt') || 
    (item.type === 'order' && ['cancelado', 'cancelado_automaticamente'].includes(item.status))
  );

  const blockedOrders = ordersAndAttempts.filter(item => 
    item.type === 'order' && item.status === 'bloqueado'
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

      // Deletar pedidos usando a função segura
      if (selectedPedidos.length > 0) {
        const pedidosResult = await bulkDeletePedidos(selectedPedidos, deleteJustification);
        totalDeleted += pedidosResult.deleted_count;
        if (!pedidosResult.success && pedidosResult.error) {
          errors.push(`Pedidos: ${pedidosResult.error}`);
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
    <Card key={item.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-sm">
                  {item.type === 'order' ? `Pedido #${item.id.substring(0, 8)}` : `Tentativa #${item.id.substring(0, 8)}`}
                </CardTitle>
                <Badge className={getStatusColor(item.status)}>
                  {getStatusText(item.status)}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {item.type === 'order' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewOrderDetails(item.id)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                {/* Botões de Bloqueio/Desbloqueio */}
                {item.status === 'bloqueado' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblockOrder(item.id)}
                    disabled={isUnblocking}
                    className="text-green-600 hover:text-green-700"
                  >
                    <ShieldOff className="w-4 h-4" />
                  </Button>
                ) : (
                  ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado'].includes(item.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlockOrder(item.id)}
                      disabled={isBlocking}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-medium">{formatCurrency(item.valor_total || 0)}</span>
          </div>
          
          {item.client_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-xs truncate">{item.client_email}</span>
            </div>
          )}
          
          {item.client_name && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <span className="text-xs truncate">{item.client_name}</span>
            </div>
          )}
          
          {item.plano_meses && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="text-xs">{item.plano_meses} meses</span>
            </div>
          )}
        </div>
        
        {/* Informações específicas do tipo */}
        {item.type === 'order' && item.lista_paineis && item.lista_paineis.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Building className="w-3 h-3" />
              <span>{item.lista_paineis.length} painel(is) selecionado(s)</span>
            </div>
          </div>
        )}
        
        {item.type === 'attempt' && item.selected_buildings && item.selected_buildings.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Building className="w-3 h-3" />
              <span>{item.selected_buildings.length} prédio(s): {item.selected_buildings.map(b => b.nome).join(', ')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="pending" className="relative">
          Aguardando Pagamento
          {pendingOrders.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {pendingOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active" className="relative">
          Ativos
          {activeOrders.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {activeOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="abandoned" className="relative">
          Abandonados
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

      <TabsContent value="pending">
        {renderTab(pendingOrders, 'Pedidos Aguardando Pagamento', 'Nenhum pedido aguardando pagamento encontrado.')}
      </TabsContent>

      <TabsContent value="active">
        {renderTab(activeOrders, 'Pedidos Ativos', 'Nenhum pedido ativo encontrado.')}
      </TabsContent>

      <TabsContent value="abandoned">
        {renderTab(abandonedItems, 'Itens Abandonados', 'Nenhum item abandonado encontrado.')}
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
