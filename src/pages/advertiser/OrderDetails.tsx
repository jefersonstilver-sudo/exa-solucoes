
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useOrderVideoManagement } from '@/hooks/useOrderVideoManagement';
import { VideoActivationSuccessPopup } from '@/components/video-management/VideoActivationSuccessPopup';
import { PurchaseInfoCard } from '@/components/order/PurchaseInfoCard';
import { useEnhancedOrderData } from '@/hooks/useEnhancedOrderData';
import { OrderHeader } from '@/components/order/OrderHeader';
import { OrderSummaryCard } from '@/components/order/OrderSummaryCard';
import { OrderStatusAlerts } from '@/components/order/OrderStatusAlerts';
import { VideoManagementCard } from '@/components/order/VideoManagementCard';

interface OrderDetails {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  client_id: string;
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Hook para dados aprimorados (recuperação de painéis)
  const { 
    enhancedData, 
    loading: enhancedLoading, 
    error: enhancedError 
  } = useEnhancedOrderData(id || '', userProfile?.id || '');

  const {
    videoSlots,
    loading: videosLoading,
    loadError: videosLoadError,
    uploading,
    uploadProgress,
    selectVideoForDisplay,
    activateVideo,
    removeVideo,
    uploadVideo,
    isSuccessOpen,
    videoName,
    hideSuccess
  } = useOrderVideoManagement(id || '');

  useEffect(() => {
    if (id && userProfile?.id) {
      loadOrderDetails();
    } else {
      setLoading(false);
    }
  }, [id, userProfile]);

  const loadOrderDetails = async () => {
    if (!id || !userProfile?.id) return;

    try {
      const { data: userOrder, error: userError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .eq('client_id', userProfile.id)
        .single();

      if (userError) throw userError;

      console.log('📊 [ORDER_DETAILS] Pedido carregado:', userOrder);
      console.log('📍 [ORDER_DETAILS] Lista de painéis:', userOrder?.lista_paineis);
      
      setOrderDetails(userOrder);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast.error('Erro ao carregar detalhes do pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (slotPosition: number, file: File) => {
    if (!userProfile?.id || !id) return;
    await uploadVideo(slotPosition, file, userProfile.id);
  };

  const handleVideoDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  if (loading || videosLoading || enhancedLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
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
  const displayPanels = enhancedData?.recoveredPanels || orderDetails.lista_paineis || [];

  console.log('🔍 [ORDER_DETAILS] Dados finais para exibição:', {
    originalPanels: orderDetails.lista_paineis,
    recoveredPanels: enhancedData?.recoveredPanels,
    displayPanels,
    isRecovered: enhancedData?.isRecovered
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <OrderHeader orderId={orderDetails.id} />

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
        />

        {/* Gestão de Vídeos */}
        <VideoManagementCard
          videoSlots={videoSlots}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onUpload={handleVideoUpload}
          onActivate={activateVideo}
          onRemove={removeVideo}
          onSelectForDisplay={selectVideoForDisplay}
          onDownload={handleVideoDownload}
        />
      </div>

      {/* Popup de Sucesso */}
      <VideoActivationSuccessPopup
        isOpen={isSuccessOpen}
        onClose={hideSuccess}
        videoName={videoName}
      />
    </>
  );
};

export default OrderDetails;
