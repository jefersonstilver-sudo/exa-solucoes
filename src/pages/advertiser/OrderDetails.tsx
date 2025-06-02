
import React, { useState, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useOrderDetailsOptimized } from '@/hooks/useOrderDetailsOptimized';
import { OrderDetailsSkeleton } from '@/components/loading/OrderDetailsSkeleton';

// Lazy load dos componentes pesados
const VideoActivationSuccessPopup = lazy(() => 
  import('@/components/video-management/VideoActivationSuccessPopup').then(module => ({
    default: module.VideoActivationSuccessPopup
  }))
);

const PurchaseInfoCard = lazy(() => 
  import('@/components/order/PurchaseInfoCard').then(module => ({
    default: module.PurchaseInfoCard
  }))
);

const OrderHeader = lazy(() => 
  import('@/components/order/OrderHeader').then(module => ({
    default: module.OrderHeader
  }))
);

const OrderSummaryCard = lazy(() => 
  import('@/components/order/OrderSummaryCard').then(module => ({
    default: module.OrderSummaryCard
  }))
);

const OrderStatusAlerts = lazy(() => 
  import('@/components/order/OrderStatusAlerts').then(module => ({
    default: module.OrderStatusAlerts
  }))
);

const VideoManagementCard = lazy(() => 
  import('@/components/order/VideoManagementCard').then(module => ({
    default: module.VideoManagementCard
  }))
);

const ContractStatusAlert = lazy(() => 
  import('@/components/order/ContractStatusAlert').then(module => ({
    default: module.ContractStatusAlert
  }))
);

const VideoDisplayStatus = lazy(() => 
  import('@/components/order/VideoDisplayStatus').then(module => ({
    default: module.VideoDisplayStatus
  }))
);

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [videoName, setVideoName] = useState('');

  const {
    orderDetails,
    videoSlots,
    panelData,
    contractStatus,
    enhancedData,
    loading,
    error,
    refetch
  } = useOrderDetailsOptimized(id || '', userProfile?.id || '');

  // Loading state otimizado
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrderDetailsSkeleton />
      </div>
    );
  }

  // Error state
  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-medium mb-2">
            {error ? 'Erro ao carregar' : 'Pedido não encontrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error || 'Não foi possível carregar os detalhes do pedido.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/anunciante/pedidos')} variant="outline">
              Voltar aos Pedidos
            </Button>
            <Button onClick={refetch} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handlers otimizados
  const handleVideoUpload = async (slotPosition: number, file: File) => {
    if (!userProfile?.id || !id) return;
    
    if (contractStatus.isExpired) {
      toast.error('Não é possível fazer upload de vídeos para contratos expirados');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simular progress para melhor UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // TODO: Implementar upload real
      console.log('Uploading video for slot:', slotPosition);
      
      // Simular upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setVideoName(file.name);
      setIsSuccessOpen(true);
      
      // Refresh data após upload
      await refetch();
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do vídeo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoAction = async (action: () => Promise<void>) => {
    if (contractStatus.isExpired) {
      toast.error('Não é possível realizar ações em contratos expirados');
      return;
    }
    
    try {
      await action();
      await refetch(); // Refresh data após ação
    } catch (error) {
      console.error('Erro na ação do vídeo:', error);
      toast.error('Erro ao processar ação');
    }
  };

  const handleVideoDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  const displayPanels = enhancedData?.recoveredPanels || orderDetails.lista_paineis || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<OrderDetailsSkeleton />}>
          <div className="space-y-6">
            {/* Header */}
            <OrderHeader orderId={orderDetails.id} />

            {/* Status do Contrato */}
            <ContractStatusAlert
              isActive={contractStatus.isActive}
              isExpired={contractStatus.isExpired}
              isNearExpiration={contractStatus.isNearExpiration}
              daysRemaining={contractStatus.daysRemaining}
              expiryDate={contractStatus.expiryDate}
            />

            {/* Status de Exibição */}
            <VideoDisplayStatus orderId={orderDetails.id} />

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Informações de Compra */}
              <PurchaseInfoCard orderDetails={orderDetails} />

              {/* Resumo do Pedido */}
              <OrderSummaryCard
                orderDetails={orderDetails}
                displayPanels={displayPanels}
                isRecovered={enhancedData?.isRecovered}
              />
            </div>

            {/* Alertas de Status */}
            <OrderStatusAlerts
              isRecovered={enhancedData?.isRecovered}
              enhancedError={error}
              videosLoadError={null}
            />

            {/* Gestão de Vídeos */}
            {contractStatus.isExpired ? (
              <div className="bg-gray-100 p-8 rounded-lg border-2 border-gray-300">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    Gestão de Vídeos Bloqueada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    O contrato expirou. Para reativar a gestão de vídeos, renove seu contrato.
                  </p>
                  <Button onClick={() => navigate('/anunciante/pedidos')} variant="outline">
                    Ver Outros Pedidos
                  </Button>
                </div>
              </div>
            ) : (
              <VideoManagementCard
                videoSlots={videoSlots}
                uploading={uploading}
                uploadProgress={uploadProgress}
                onUpload={handleVideoUpload}
                onActivate={(slotId) => handleVideoAction(async () => {
                  console.log('Activating video:', slotId);
                  // TODO: Implementar ativação
                })}
                onRemove={(slotId) => handleVideoAction(async () => {
                  console.log('Removing video:', slotId);
                  // TODO: Implementar remoção
                })}
                onSelectForDisplay={(slotId) => handleVideoAction(async () => {
                  console.log('Selecting for display:', slotId);
                  // TODO: Implementar seleção
                })}
                onDownload={handleVideoDownload}
              />
            )}
          </div>

          {/* Popup de Sucesso */}
          <VideoActivationSuccessPopup
            isOpen={isSuccessOpen}
            onClose={() => setIsSuccessOpen(false)}
            videoName={videoName}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default OrderDetails;
