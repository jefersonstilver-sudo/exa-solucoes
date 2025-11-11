
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdvertiserProtection } from '@/hooks/useAdvertiserProtection';
import { supabase } from '@/integrations/supabase/client';
import { useOrderViewTracking } from '@/hooks/tracking/useOrderViewTracking';
import { useVideoActivityTracking } from '@/hooks/tracking/useVideoActivityTracking';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useOrderVideoManagement } from '@/hooks/useOrderVideoManagement';
import { VideoActivationSuccessPopup } from '@/components/video-management/VideoActivationSuccessPopup';
import { VideoConflictModal } from '@/components/video-management/VideoConflictModal';
import { setBaseVideo as setBaseVideoService, SetBaseVideoResult } from '@/services/videoBaseService';
import { PurchaseInfoCard } from '@/components/order/PurchaseInfoCard';
import { useEnhancedOrderData } from '@/hooks/useEnhancedOrderData';
import { OrderHeader } from '@/components/order/OrderHeader';
import { OrderSummaryCard } from '@/components/order/OrderSummaryCard';
import { OrderStatusAlerts } from '@/components/order/OrderStatusAlerts';
import { VideoManagementCard } from '@/components/order/VideoManagementCard';
import { ContractStatusAlert } from '@/components/order/ContractStatusAlert';
import { VideoDisplayStatus } from '@/components/order/VideoDisplayStatus';
import { useContractStatus } from '@/hooks/useContractStatus';
import EnhancedContractStatusCard from '@/components/order/EnhancedContractStatusCard';
import { SelectedBuildingsSection } from '@/components/order/SelectedBuildingsSection';
import { VideoScheduleManager } from '@/components/video-management/VideoScheduleManager';
import { MigrationFixButton } from '@/components/order/MigrationFixButton';
import { useVideoScheduleMonitor } from '@/hooks/useVideoScheduleMonitor';
import { BlockedOrderAlert } from '@/components/order/BlockedOrderAlert';
import { OrderNameEdit } from '@/components/order/OrderNameEdit';
import { useSelectedBuildingsDetails } from '@/hooks/useSelectedBuildingsDetails';
import { FloatingDebugButton } from '@/components/debug/FloatingDebugButton';

interface OrderDetails {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  lista_predios?: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  client_id: string;
  log_pagamento?: any;
  blocked_reason?: string;
  blocked_at?: string;
  cupom_id?: string;
  nome_pedido?: string;
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // PROTEÇÃO DE ROTA - Redireciona se não estiver logado
  const { isAuthenticated, isLoading: authLoading } = useAdvertiserProtection();
  
  const { trackOrderView } = useOrderViewTracking();
  const { trackVideoUpload, trackVideoSwap } = useVideoActivityTracking();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Hook para verificar status do contrato - usando orderDetails como parâmetro
  const contractStatus = useContractStatus(orderDetails || {
    id: id,
    data_inicio: undefined,
    data_fim: undefined,
    status: 'pendente',
    plano_meses: 1
  });

  // Hook para dados aprimorados (recuperação de painéis)
  const { 
    enhancedData, 
    loading: enhancedLoading, 
    error: enhancedError 
  } = useEnhancedOrderData(id || '', userProfile?.id || '');

  // CRITICAL: Mover hook useSelectedBuildingsDetails para o topo para evitar erro de hooks
  // Use building IDs from the new lista_predios column
  const displayBuildingIds = orderDetails?.lista_predios || [];
  const { buildings: buildingDetails } = useSelectedBuildingsDetails(displayBuildingIds);

  const {
    videoSlots,
    loading: videosLoading,
    loadError: videosLoadError,
    uploading,
    uploadProgress,
    selectVideoForDisplay,
    activateVideo,
    removeVideo,
    setBaseVideo,
    uploadVideo,
    refreshSlots,
    isSuccessOpen,
    videoName,
    hideSuccess,
    conflictModal
  } = useOrderVideoManagement(id || '');

  // Hook para monitoramento automático de agendamentos - TEMPORARIAMENTE DESABILITADO
  // const { forceUpdate } = useVideoScheduleMonitor({
  //   orderId: id || '',
  //   enabled: false, // Desabilitado para parar os reloads
  //   intervalMinutes: 30,
  //   onDataChange: refreshSlots
  // });

  useEffect(() => {
    if (id && userProfile?.id) {
      loadOrderDetails();
    } else {
      setLoading(false);
    }
  }, [id, userProfile]);

  const loadOrderDetails = async () => {
    if (!id || !userProfile?.id) {
      console.error('❌ [ORDER_DETAILS] Dados inválidos:', { id, userId: userProfile?.id });
      toast.error('Dados inválidos para carregar o pedido');
      navigate('/anunciante/pedidos');
      return;
    }

    try {
      console.log('📊 [ORDER_DETAILS] Iniciando carregamento do pedido:', id);
      console.log('👤 [ORDER_DETAILS] User ID:', userProfile.id);
      
      const { data: userOrder, error: userError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .eq('client_id', userProfile.id)
        .single();

      if (userError) {
        console.error('❌ [ORDER_DETAILS] Erro na query:', userError);
        throw userError;
      }

      if (!userOrder) {
        console.error('❌ [ORDER_DETAILS] Pedido não encontrado');
        toast.error('Pedido não encontrado');
        navigate('/anunciante/pedidos');
        return;
      }

      console.log('✅ [ORDER_DETAILS] Pedido carregado com sucesso:', userOrder);
      console.log('📍 [ORDER_DETAILS] Lista de painéis:', userOrder?.lista_paineis);
      console.log('🏢 [ORDER_DETAILS] Lista de prédios:', userOrder?.lista_predios);
      console.log('💳 [ORDER_DETAILS] Log de pagamento:', userOrder?.log_pagamento);
      console.log('📊 [ORDER_DETAILS] Status:', userOrder?.status);
      
      setOrderDetails(userOrder);
      
      // Track order view
      if (userOrder?.id) {
        trackOrderView(userOrder.id);
      }
    } catch (error: any) {
      console.error('❌ [ORDER_DETAILS] Erro ao carregar pedido:', error);
      toast.error(`Erro ao carregar detalhes: ${error.message || 'Erro desconhecido'}`);
      navigate('/anunciante/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => {
    console.log('🎬 [OrderDetails] handleVideoUpload chamado', {
      slotPosition,
      fileName: file.name,
      fileSize: file.size,
      title,
      hasScheduleRules: !!scheduleRules,
      rulesCount: scheduleRules?.length || 0,
      userId: userProfile?.id,
      orderId: id,
      contractExpired: contractStatus.isExpired
    });

    if (!userProfile?.id || !id) {
      console.error('❌ [OrderDetails] Usuário ou pedido não encontrado');
      toast.error('Erro: dados do usuário ou pedido não disponíveis');
      return;
    }
    
    if (contractStatus.isExpired) {
      console.warn('⚠️ [OrderDetails] Contrato expirado');
      toast.error('Não é possível fazer upload de vídeos para contratos expirados');
      return;
    }
    
    console.log('📋 [ORDER_DETAILS] REPASSANDO REGRAS PARA UPLOAD:', {
      slotPosition,
      title,
      hasScheduleRules: !!scheduleRules,
      rulesCount: scheduleRules?.length || 0,
      scheduleRules
    });

    try {
      console.log('📤 [OrderDetails] Chamando uploadVideo...');
      await uploadVideo(slotPosition, file, userProfile.id, title, scheduleRules);
      console.log('✅ [OrderDetails] Upload concluído com sucesso');
      
      // Track video upload after successful upload
      // Note: We refresh slots after upload to get the new video ID
      console.log('🔄 [OrderDetails] Atualizando slots...');
      await refreshSlots();
      const uploadedSlot = videoSlots.find(slot => slot.slot_position === slotPosition);
      if (uploadedSlot?.video_data?.id) {
        await trackVideoUpload(uploadedSlot.video_data.id, id);
        console.log('✅ [OrderDetails] Upload rastreado');
      }
      console.log('✅ [OrderDetails] handleVideoUpload concluído completamente');
    } catch (error) {
      console.error('💥 [OrderDetails] Erro no handleVideoUpload:', error);
      throw error; // Re-throw para ser tratado pelo componente
    }
  };

  const handleVideoAction = async (action: () => Promise<void>) => {
    if (contractStatus.isExpired) {
      toast.error('Não é possível realizar ações em contratos expirados');
      return;
    }
    
    await action();
  };

  const handleVideoDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  const handleSetBaseVideo = async (slotId: string) => {
    console.log('🎯 [ORDER_DETAILS] Definindo vídeo base:', slotId);
    
    toast.loading('Definindo como vídeo principal...', { id: 'set-base-video' });

    const result: SetBaseVideoResult = await setBaseVideoService(slotId);

    if (result.success) {
      toast.success('✅ Vídeo definido como principal!', { 
        id: 'set-base-video',
        description: 'Este vídeo será exibido quando não houver outros agendados.'
      });
      
      // Recarregar slots para atualizar a UI
      await refreshSlots();
    } else {
      toast.error('❌ Erro ao definir vídeo principal', { 
        id: 'set-base-video',
        description: result.message
      });
    }
  };

  // Enquanto verifica autenticação, não mostrar nada
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (loading || videosLoading || enhancedLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-2 text-lg">Carregando detalhes...</p>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-xl font-medium mb-2">Pedido não encontrado</h3>
        <p className="text-gray-600 mb-4">
          Não foi possível carregar os detalhes do pedido.
        </p>
        <Button onClick={() => navigate('/anunciante/pedidos')}>
          Voltar aos Pedidos
        </Button>
      </div>
    );
  }

  // Usar dados recuperados se disponíveis
  const displayPanels = enhancedData?.recoveredPanels || orderDetails?.lista_paineis || [];
  
  console.log('📊 [ORDER_DETAILS] Calculando métricas:', {
    buildingDetailsCount: buildingDetails.length,
    buildingDetails: buildingDetails.map(b => ({
      nome: b.nome,
      quantidade_telas: b.quantidade_telas,
      numero_elevadores: b.numero_elevadores,
      publico_estimado: b.publico_estimado
    }))
  });
  
  const totalScreens = buildingDetails.reduce((sum, building) => {
    const screens = building.quantidade_telas || building.numero_elevadores || 0;
    console.log(`  📺 ${building.nome}: ${screens} telas`);
    return sum + screens;
  }, 0);
  
  const totalAudience = buildingDetails.reduce((sum, building) => {
    const audience = building.publico_estimado || 0;
    console.log(`  👥 ${building.nome}: ${audience} pessoas`);
    return sum + audience;
  }, 0);

  console.log('📊 [ORDER_DETAILS] Totais calculados:', {
    totalScreens,
    totalAudience
  });

  // Verificar se há dados de localização incompletos
  const hasLocationData = (displayBuildingIds && displayBuildingIds.length > 0) || 
                         (displayPanels && displayPanels.length > 0);

  console.log('🔍 [ORDER_DETAILS] Estado final dos dados:', {
    originalPanels: orderDetails?.lista_paineis,
    recoveredPanels: enhancedData?.recoveredPanels,
    displayPanels,
    displayBuildingIds,
    hasLocationData,
    isRecovered: enhancedData?.isRecovered,
    contractStatus
  });

  console.log('🔍 [ORDER_DETAILS] Building IDs para exibição:', displayBuildingIds);

  // Verificar se o pedido está bloqueado
  if (orderDetails.status === 'bloqueado') {
    return (
      <>
        <div className="space-y-6">
          {/* Header */}
          <OrderHeader orderId={orderDetails.id} />

          {/* Alerta de Pedido Bloqueado */}
          <BlockedOrderAlert 
            reason={orderDetails.blocked_reason}
            blockedAt={orderDetails.blocked_at}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0 py-4">
        {/* Header */}
        <OrderHeader orderId={orderDetails.id} />

        {/* Nome Personalizado do Pedido */}
        <OrderNameEdit 
          orderId={orderDetails.id}
          currentName={orderDetails.nome_pedido}
          onNameUpdate={(newName) => {
            setOrderDetails(prev => prev ? { ...prev, nome_pedido: newName } : null);
          }}
        />

        {/* Migration Fix Button - Show if no location data */}
        {!hasLocationData && (
          <MigrationFixButton orderId={orderDetails.id} />
        )}

        {/* Enhanced Contract Status Card */}
        <EnhancedContractStatusCard
          orderId={orderDetails.id}
          orderDetails={orderDetails}
        />

        {/* Status do Contrato */}
        <ContractStatusAlert
          isActive={contractStatus.isActive}
          isExpired={contractStatus.isExpired}
          isNearExpiration={contractStatus.isExpiringSoon}
          daysRemaining={contractStatus.daysRemaining}
          expiryDate={orderDetails.data_fim}
          hasStarted={contractStatus.hasStarted}
        />


        {/* Locais Selecionados - Show only if we have building data */}
        {hasLocationData && displayBuildingIds.length > 0 && (
          <SelectedBuildingsSection 
            listaPredios={displayBuildingIds}
          />
        )}

        {/* Informações de Compra */}
        <PurchaseInfoCard orderDetails={orderDetails} />

        {/* Alertas de Status */}
        <OrderStatusAlerts
          isRecovered={enhancedData?.isRecovered}
          enhancedError={enhancedError}
          videosLoadError={videosLoadError}
        />

        {/* Resumo do Pedido */}
        <OrderSummaryCard
          orderDetails={orderDetails}
          displayPanels={displayPanels}
          isRecovered={enhancedData?.isRecovered}
          totalScreens={totalScreens}
          totalAudience={totalAudience}
        />

        {/* Gestão de Vídeos */}
        {contractStatus.isExpired ? (
          <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Gestão de Vídeos Bloqueada
              </h3>
              <p className="text-gray-600">
                O contrato expirou. Para reativar a gestão de vídeos, renove seu contrato.
              </p>
            </div>
          </div>
        ) : (
          <>
            <VideoManagementCard
              orderStatus={orderDetails.status}
              videoSlots={videoSlots}
              uploading={uploading}
              uploadProgress={uploadProgress}
              onUpload={handleVideoUpload}
              onActivate={(slotId) => handleVideoAction(() => activateVideo(slotId))}
              onRemove={(slotId) => handleVideoAction(() => removeVideo(slotId))}
              onDownload={handleVideoDownload}
              onSetBaseVideo={(slotId) => handleVideoAction(() => handleSetBaseVideo(slotId))}
              onRefreshSlots={refreshSlots}
              orderId={id || ''}
            />
            
            {/* Video Schedule Manager - Always show, just disable editing when needed */}
            <VideoScheduleManager
              videoSlots={videoSlots}
              onScheduleUpdate={async (videoId: string, scheduleRules: any[]) => {
                console.log('📅 Atualizando programação:', { videoId, scheduleRules });
                // TODO: Implementar lógica de atualização de programação
              }}
              disabled={!contractStatus.isActive || contractStatus.isExpired}
              orderId={id || ''}
            />
          </>
        )}
      </div>

      {/* Popup de Sucesso */}
      <VideoActivationSuccessPopup
        isOpen={isSuccessOpen}
        onClose={hideSuccess}
        videoName={videoName}
      />

      {/* Modal de Conflito de Horário */}
      <VideoConflictModal
        isOpen={conflictModal.isOpen}
        onClose={conflictModal.hideConflictModal}
        conflicts={conflictModal.conflicts}
        suggestions={conflictModal.suggestions}
        newVideoName={conflictModal.newVideoName}
      />

      {/* Botão de Debug - Logs de Vídeo */}
      <FloatingDebugButton />
    </>
  );
};

export default OrderDetails;
