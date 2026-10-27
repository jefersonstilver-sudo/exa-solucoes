import { useLogoEmpresa } from '@/hooks/exa2/useLogoEmpresa';
import React, { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffectiveAuth as useAuth } from '@/hooks/useEffectiveAuth';
import { useUserOrdersAndAttempts } from '@/hooks/useUserOrdersAndAttempts';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useAttemptFinalizer } from '@/hooks/useAttemptFinalizer';
import { generateOrderPix } from '@/services/asaasPaymentService';
import { useOrderGroups } from '@/hooks/useOrderGroups';
import { VideoDisplayPopup } from '@/components/video-management/VideoDisplayPopup';
import { Loader2, ShoppingBag, Search, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { CortesiaOrderSuccessModal } from '@/components/orders/CortesiaOrderSuccessModal';
import { useCortesiaSuccessDetection } from '@/hooks/useCortesiaSuccessDetection';
import { CreateGroupDialog } from '@/components/orders/CreateGroupDialog';
import { OrderGroupHeader } from '@/components/orders/OrderGroupHeader';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLogoImageUrl } from '@/hooks/useLogoImageUrl';

import { AdvertiserDashboardHeader } from '@/components/advertiser/orders/AdvertiserDashboardHeader';
import { AdvertiserOrderStats } from '@/components/advertiser/orders/AdvertiserOrderStats';
import { AdvertiserOrderCard } from '@/components/advertiser/orders/AdvertiserOrderCard';
import { SortableOrderCard } from '@/components/advertiser/orders/SortableOrderCard';
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { applyCardOrder, moveCard } from '@/lib/orderCardOrdering';

const AdvertiserOrders = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userOrdersAndAttempts, loading } = useUserOrdersAndAttempts(userProfile?.id);
  const isProcessingCheckout = false;
  const [savedCardOrder, setSavedCardOrder] = useState<string[]>([]);
  const cardOrderKey = userProfile?.id ? `exa:order-cards:${userProfile.id}` : null;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(cardOrderKey ? localStorage.getItem(cardOrderKey) || '[]' : '[]');
      setSavedCardOrder(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []);
    } catch { setSavedCardOrder([]); }
  }, [cardOrderKey]);
  const handleCardReorder = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = applyCardOrder(userOrdersAndAttempts, savedCardOrder).map(item => item.id);
    const reordered = moveCard(ids, String(active.id), String(over.id));
    setSavedCardOrder(reordered);
    if (cardOrderKey) {
      try { localStorage.setItem(cardOrderKey, JSON.stringify(reordered)); }
      catch { toast.error('A ordem não pôde ser salva neste navegador'); }
    }
  };

  // Fetch company data from users table (not included in useAuth profile)
  const [companyData, setCompanyData] = useState<{
    empresa_nome?: string;
    empresa_documento?: string;
    logo_url?: string;
  } | null>(null);
  const [logoScale, setLogoScale] = useState(1);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!userProfile?.id) return;
      const { data } = await supabase.
      from('users').
      select('empresa_nome, empresa_documento, avatar_url').
      eq('id', userProfile.id).
      single();
      if (data) {
        setCompanyData({
          empresa_nome: data.empresa_nome,
          empresa_documento: data.empresa_documento,
          logo_url: data.avatar_url
        });
      }
      // Read logo_scale from auth user_metadata
      const { data: authData } = await supabase.auth.getUser();
      const raw = authData?.user?.user_metadata?.logo_scale;
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw));
      if (!isNaN(parsed)) setLogoScale(Math.min(3, Math.max(0.5, parsed)));
    };
    fetchCompanyData();
  }, [userProfile?.id]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [videoDisplayPopup, setVideoDisplayPopup] = useState<{isOpen: boolean;orderId: string | null;}>({
    isOpen: false,
    orderId: null
  });

  // Resolve logo URL via signed URL for private bucket
  // EXA 2.0: logo enviada na aba Empresa do pedido / para a Sofia tem prioridade sobre a foto do perfil
  const logoMarca = useLogoEmpresa(userProfile?.id, companyData?.logo_url || userProfile?.avatar_url || null);
  const rawLogoUrl = logoMarca;
  const logoInput = React.useMemo(() => {
    if (!rawLogoUrl) return null;
    const supabasePattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(\?|#|$)/;
    const match = rawLogoUrl.match(supabasePattern);
    if (match) {
      return {
        file_url: rawLogoUrl,
        storage_bucket: match[1],
        storage_key: match[2]
      };
    }
    return { file_url: rawLogoUrl };
  }, [rawLogoUrl]);

  const { imageUrl: resolvedLogoUrl } = useLogoImageUrl(logoInput);

  // Preserve #original fragment on resolved URL
  const finalLogoUrl = React.useMemo(() => {
    if (!resolvedLogoUrl) return undefined;
    const hasOriginal = rawLogoUrl?.includes('#original');
    if (hasOriginal && !resolvedLogoUrl.includes('#original')) {
      return resolvedLogoUrl + '#original';
    }
    return resolvedLogoUrl;
  }, [resolvedLogoUrl, rawLogoUrl]);


  // PIX dialog state
  const [pixDialog, setPixDialog] = useState<{
    isOpen: boolean;
    pixData: {qrCodeBase64?: string;qrCodeText?: string;pedidoId?: string;} | null;
  }>({ isOpen: false, pixData: null });
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemType: 'order' | 'attempt';
  }>({ isOpen: false, itemId: null, itemType: 'order' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Order groups
  const { groups, createGroup, updateGroup, deleteGroup, moveOrderToGroup } = useOrderGroups(userProfile?.id);
  const [showGrouped, setShowGrouped] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDrop = async (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault();
    setDragOverGroupId(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (orderId) {
      await moveOrderToGroup(orderId, groupId);
    }
    setDraggedOrderId(null);
  };

  const { finalizeAttemptToOrder, isProcessing: isProcessingAttempt } = useAttemptFinalizer();

  // Delete handler
  const handleDeleteItem = async () => {
    if (!deleteConfirm.itemId) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.itemType === 'attempt') {
        const { error } = await supabase.from('tentativas_compra').delete().eq('id', deleteConfirm.itemId);
        if (error) throw error;
        toast.success('Tentativa excluída com sucesso');
      } else {
        const { error } = await supabase.from('pedidos').delete().eq('id', deleteConfirm.itemId);
        if (error) throw error;
        toast.success('Pedido excluído com sucesso');
      }
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir item', { description: error.message || 'Tente novamente' });
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, itemId: null, itemType: 'order' });
    }
  };

  // Video display popup listener
  useEffect(() => {
    const handleOpenVideoDisplay = (event: CustomEvent) => {
      setVideoDisplayPopup({ isOpen: true, orderId: event.detail.orderId });
    };
    window.addEventListener('openVideoDisplay', handleOpenVideoDisplay as EventListener);
    return () => window.removeEventListener('openVideoDisplay', handleOpenVideoDisplay as EventListener);
  }, []);

  // Stats calculation
  const orders = userOrdersAndAttempts.filter((item) => item.type === 'order');
  const attempts = userOrdersAndAttempts.filter((item) => item.type === 'attempt');

  const { showModal, orderData, closeModal } = useCortesiaSuccessDetection(orders, loading);

  // PIX generation
  const handleGeneratePix = async (orderId: string) => {
    setIsGeneratingPix(true);
    try {
      const data = await generateOrderPix(orderId);
      setPixDialog({ isOpen: true, pixData: { qrCodeBase64: data.qr_base64, qrCodeText: data.copia_cola, pedidoId: orderId } });
    } catch (error: any) {
      toast.error('Erro ao gerar QR Code PIX', { description: error.message || 'Tente novamente' });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Existing card callback now opens the only supported payment method.
  const handleStripePayment = handleGeneratePix;

  // Active period check
  const isWithinActivePeriod = (order: any) => {
    if (!order.data_inicio || !order.data_fim) return false;
    const today = new Date();
    return today >= new Date(order.data_inicio) && today <= new Date(order.data_fim);
  };

  const stats = {
    pedidosAtivos: orders.filter((order) =>
    (order.status === 'video_aprovado' || order.status === 'ativo') && isWithinActivePeriod(order)
    ).length,
    aguardandoVideo: orders.filter((order) =>
    ['pago', 'pago_pendente_video'].includes(order.status)
    ).length + attempts.length,
    pedidosFinalizados: orders.filter((order) =>
    order.status === 'expirado' ||
    ['pago', 'pago_pendente_video', 'video_aprovado'].includes(order.status) && !isWithinActivePeriod(order)
    ).length
  };

  // Filters
  const filteredItems = applyCardOrder(userOrdersAndAttempts, savedCardOrder).filter((item) => {
    const matchesSearch =
    item.type === 'order' && item.nome_pedido && item.nome_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.valor_total.toString().includes(searchTerm);
    const matchesStatus =
    statusFilter === 'todos' ||
    item.type === 'order' && item.status === statusFilter ||
    item.type === 'attempt' && statusFilter === 'tentativa';
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-base text-muted-foreground">Carregando pedidos...</p>
      </div>);

  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      {/* Section 1: Company Header */}
      <AdvertiserDashboardHeader
        logoUrl={finalLogoUrl}
        companyName={companyData?.empresa_nome}
        cnpj={companyData?.empresa_documento}
        ownerName={userProfile?.nome}
        logoScale={logoScale} />
      

      {/* Section 2: Metrics */}
      



      

      {/* Section 5: Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por ID ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 rounded-2xl border-0 bg-white pl-10 text-[14px] shadow-[0_1px_2px_rgba(27,23,25,0.05)] ring-1 ring-[#1b1719]/[0.06] focus-visible:ring-2 focus-visible:ring-[#9C1E1E]/30" />
          
        </div>
        {!isMobile &&
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-full rounded-2xl border-0 bg-white text-[14px] shadow-[0_1px_2px_rgba(27,23,25,0.05)] ring-1 ring-[#1b1719]/[0.06] sm:w-[210px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="tentativa">Tentativas</SelectItem>
              <SelectItem value="aguardando_contrato">Aguardando contrato</SelectItem>
              <SelectItem value="pago_pendente_video">Aguardando vídeo</SelectItem>
              <SelectItem value="ativo">No ar</SelectItem>
              <SelectItem value="video_aprovado">Vídeo aprovado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        }
        <Button
          variant={showGrouped ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowGrouped(!showGrouped)}
          className="h-11 gap-1.5 rounded-2xl border-0 bg-white px-4 shadow-[0_1px_2px_rgba(27,23,25,0.05)] ring-1 ring-[#1b1719]/[0.06] hover:bg-white"
        >
          <FolderOpen className="h-4 w-4" />
          {!isMobile && 'Agrupar'}
        </Button>
        {showGrouped && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateGroupDialogOpen(true)}
            className="h-11 gap-1.5 rounded-2xl border-0 bg-white px-4 shadow-[0_1px_2px_rgba(27,23,25,0.05)] ring-1 ring-[#1b1719]/[0.06] hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            {!isMobile && 'Novo grupo'}
          </Button>
        )}
      </div>

      {/* Section 3: Campaign List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCardReorder}>
      <SortableContext items={filteredItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
      {filteredItems.length === 0 ?
      <div className="rounded-[22px] bg-white p-8 text-center shadow-[0_1px_2px_rgba(27,23,25,0.04)] ring-1 ring-[#1b1719]/[0.05] sm:p-12">
          <div className="mx-auto bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-foreground">
            {searchTerm || statusFilter !== 'todos' ?
          'Nenhum pedido encontrado' :
          'Você ainda não fez nenhum pedido'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {searchTerm || statusFilter !== 'todos' ?
          'Tente ajustar os filtros para encontrar seus pedidos.' :
          'Comece criando sua primeira campanha publicitária.'}
          </p>
          <Button
          onClick={() => navigate('/paineis-digitais/loja')}
          className="min-h-[44px] sm:min-h-[36px]">
          
            Explorar Painéis
          </Button>
        </div> :

      showGrouped ? (
        /* Grouped view */
        <div className="space-y-4">
          {groups.map((group) => {
            const groupItems = filteredItems.filter((item: any) => item.grupo_id === group.id);
            const isExpanded = expandedGroups[group.id] !== false; // default expanded
            return (
              <div key={group.id} className="space-y-2">
                <OrderGroupHeader
                  group={group}
                  count={groupItems.length}
                  isExpanded={isExpanded}
                  onToggle={() => toggleGroupExpanded(group.id)}
                  onEdit={(g) => setEditingGroup(g)}
                  onDelete={(id) => deleteGroup(id)}
                  isDragOver={dragOverGroupId === group.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOverGroupId(group.id); }}
                  onDragLeave={() => setDragOverGroupId(null)}
                  onDrop={(e) => handleGroupDrop(e, group.id)}
                />
                {isExpanded && groupItems.length > 0 && (
                  <div className="space-y-3 pl-4">
                    {groupItems.map((item: any) => (
                      <SortableOrderCard key={`${item.type}-${item.id}`} id={item.id}>
                      <AdvertiserOrderCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        isMobile={isMobile}
                        onNavigate={(path) => navigate(path)}
                        onDelete={(id, type) => setDeleteConfirm({ isOpen: true, itemId: id, itemType: type })}
                        onFinalize={(id) => finalizeAttemptToOrder(id)}
                        isProcessingAttempt={isProcessingAttempt}
                        isGeneratingPix={isGeneratingPix}
                        handleGeneratePix={handleGeneratePix}
                        handleStripePayment={handleStripePayment}
                        groups={groups}
                        onMoveToGroup={moveOrderToGroup}
                        onCreateGroup={() => setCreateGroupDialogOpen(true)}
                        companyName={companyData?.empresa_nome}
                        draggable
                        onDragStart={handleDragStart}
                      />
                      </SortableOrderCard>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sem grupo */}
          {(() => {
            const ungroupedItems = filteredItems.filter((item: any) => !item.grupo_id);
            const isExpanded = expandedGroups['__ungrouped__'] !== false;
            if (ungroupedItems.length === 0) return null;
            return (
              <div className="space-y-2">
                <OrderGroupHeader
                  group={null}
                  count={ungroupedItems.length}
                  isExpanded={isExpanded}
                  onToggle={() => toggleGroupExpanded('__ungrouped__')}
                  isDragOver={dragOverGroupId === '__ungrouped__'}
                  onDragOver={(e) => { e.preventDefault(); setDragOverGroupId('__ungrouped__'); }}
                  onDragLeave={() => setDragOverGroupId(null)}
                  onDrop={(e) => handleGroupDrop(e, null)}
                />
                {isExpanded && (
                  <div className="space-y-3 pl-4">
                    {ungroupedItems.map((item: any) => (
                      <SortableOrderCard key={`${item.type}-${item.id}`} id={item.id}>
                      <AdvertiserOrderCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        isMobile={isMobile}
                        onNavigate={(path) => navigate(path)}
                        onDelete={(id, type) => setDeleteConfirm({ isOpen: true, itemId: id, itemType: type })}
                        onFinalize={(id) => finalizeAttemptToOrder(id)}
                        isProcessingAttempt={isProcessingAttempt}
                        isGeneratingPix={isGeneratingPix}
                        handleGeneratePix={handleGeneratePix}
                        handleStripePayment={handleStripePayment}
                        groups={groups}
                        onMoveToGroup={moveOrderToGroup}
                        onCreateGroup={() => setCreateGroupDialogOpen(true)}
                        companyName={companyData?.empresa_nome}
                        draggable
                        onDragStart={handleDragStart}
                      />
                      </SortableOrderCard>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        /* Flat view */
        <div className="space-y-4">
          {filteredItems.slice(0, visibleCount).map((item) =>
        <SortableOrderCard key={`${item.type}-${item.id}`} id={item.id}>
        <AdvertiserOrderCard
          key={`${item.type}-${item.id}`}
          item={item}
          isMobile={isMobile}
          onNavigate={(path) => navigate(path)}
          onDelete={(id, type) => setDeleteConfirm({ isOpen: true, itemId: id, itemType: type })}
          onFinalize={(id) => finalizeAttemptToOrder(id)}
          isProcessingAttempt={isProcessingAttempt}
          isGeneratingPix={isGeneratingPix}
          handleGeneratePix={handleGeneratePix}
          handleStripePayment={handleStripePayment}
          groups={groups}
          onMoveToGroup={moveOrderToGroup}
          onCreateGroup={() => setCreateGroupDialogOpen(true)}
                        companyName={companyData?.empresa_nome} />
        </SortableOrderCard>
        )}

          {/* Load more + counter */}
          {filteredItems.length > visibleCount &&
        <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Mostrando {Math.min(visibleCount, filteredItems.length)} de {filteredItems.length} pedidos
              </p>
              <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="min-h-[44px] sm:min-h-[36px] w-full sm:w-auto">
            
                Carregar mais
              </Button>
            </div>
        }
        </div>
      )
      }

      {/* Dialogs & Modals */}
      </SortableContext>
      </DndContext>
      {videoDisplayPopup.orderId &&
      <VideoDisplayPopup
        orderId={videoDisplayPopup.orderId}
        isOpen={videoDisplayPopup.isOpen}
        onClose={() => setVideoDisplayPopup({ isOpen: false, orderId: null })} />

      }

      <CortesiaOrderSuccessModal
        isOpen={showModal}
        pedidoId={orderData?.id || ''}
        buildingName={orderData?.selected_buildings?.[0]?.nome || orderData?.nomes_predios?.[0]}
        buildingAddress={`${orderData?.selected_buildings?.[0]?.endereco || ''}, ${orderData?.selected_buildings?.[0]?.bairro || ''}`}
        panelCount={orderData?.lista_paineis?.length || orderData?.selected_buildings?.length || 1}
        onClose={closeModal} />
      

      <PixQrCodeDialog
        isOpen={pixDialog.isOpen}
        onClose={() => setPixDialog({ isOpen: false, pixData: null })}
        qrCodeBase64={pixDialog.pixData?.qrCodeBase64}
        qrCodeText={pixDialog.pixData?.qrCodeText}
        userId={userProfile?.id}
        pedidoId={pixDialog.pixData?.pedidoId} />
      

      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, itemId: null, itemType: 'order' })}>
        <AlertDialogContent className={isMobile ? 'max-w-[90vw] rounded-xl' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deleteConfirm.itemType === 'attempt' ? 'esta tentativa' : 'este pedido'}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isMobile ? 'flex-row gap-2' : ''}>
            <AlertDialogCancel disabled={isDeleting} className={isMobile ? 'flex-1' : ''}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 ${isMobile ? 'flex-1' : ''}`}
              disabled={isDeleting}>
              
              {isDeleting ?
              <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Excluindo...
                </> :
              'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group Dialogs */}
      <CreateGroupDialog
        isOpen={createGroupDialogOpen}
        onClose={() => setCreateGroupDialogOpen(false)}
        onConfirm={(nome, cor) => createGroup(nome, cor)}
      />
      {editingGroup && (
        <CreateGroupDialog
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
          onConfirm={(nome, cor) => {
            updateGroup(editingGroup.id, { nome, cor });
            setEditingGroup(null);
          }}
          initialName={editingGroup.nome}
          initialColor={editingGroup.cor}
          title="Editar Grupo"
        />
      )}
    </div>);

};

export default AdvertiserOrders;