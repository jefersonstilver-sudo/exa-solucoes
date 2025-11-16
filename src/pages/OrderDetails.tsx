
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useRealOrderDetails } from '@/hooks/useRealOrderDetails';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { useOrderViewTracking } from '@/hooks/tracking/useOrderViewTracking';
import { useAutoErrorDetection } from '@/hooks/useAutoErrorDetection';
import { useDebugContext } from '@/contexts/DebugContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoManagementCard } from '@/components/order/VideoManagementCard';
// import { VideoManagementLogs } from '@/components/order/VideoManagementLogs';
import { BlockedOrderAlert } from '@/components/order/BlockedOrderAlert';
import { Loader2, Package, AlertTriangle, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const OrderDetails: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const { user } = useUserSession();
  const { loading, orderDetails, orderVideos, panelData } = useRealOrderDetails(orderId || '');
  const { trackOrderView } = useOrderViewTracking();
  const { isDebugMode } = useDebugContext();
  
  const videoManagement = useVideoManagement({
    orderId: orderId || '',
    userId: user?.id || '',
    orderStatus: orderDetails?.status || ''
  });

  // Auto-detecção de erros nos videoSlots (apenas quando debug mode estiver ativo)
  useAutoErrorDetection({
    videoSlots: videoManagement.videoSlots,
    orderId: orderId || '',
    enabled: isDebugMode
  });

  // Track order view when order details are loaded
  useEffect(() => {
    if (orderDetails?.id) {
      trackOrderView(orderDetails.id);
    }
  }, [orderDetails?.id, trackOrderView]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orderDetails) {
    return (
      <Layout>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <Card className="mx-2 sm:mx-0">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mb-3" />
              <span className="text-base sm:text-lg font-medium">Pedido não encontrado</span>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Se o pedido está bloqueado, mostrar tela especial
  if (orderDetails.status === 'bloqueado') {
    return (
      <Layout>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <h1 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 px-2 sm:px-0">
            Pedido #{orderDetails.id.slice(-8)}
          </h1>
          <BlockedOrderAlert 
            reason={(orderDetails as any).blocked_reason} 
            blockedAt={(orderDetails as any).blocked_at} 
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-8 space-y-3 sm:space-y-6">
        {/* Header do pedido - Mobile Otimizado */}
        <Card className="shadow-sm">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center text-base sm:text-xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
              <span className="truncate">Pedido #{orderDetails.id.slice(-8)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Status</p>
              <p className="font-semibold text-sm sm:text-base truncate">{orderDetails.status}</p>
            </div>
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Valor Total</p>
              <p className="font-semibold text-sm sm:text-base">R$ {orderDetails.valor_total?.toFixed(2)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg col-span-2 md:col-span-1">
              <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Data do Pedido</p>
              <p className="font-semibold text-sm sm:text-base">
                {new Date(orderDetails.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Painéis selecionados */}
        {panelData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Painéis Selecionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {panelData.map((building) => {
                  const getImageUrl = (imagePath?: string) => {
                    if (!imagePath) return null;
                    if (imagePath.startsWith('http')) return imagePath;
                    return supabase.storage.from('buildings').getPublicUrl(imagePath).data.publicUrl;
                  };

                  const imageUrl = getImageUrl(building.imagem_principal) || 
                                 getImageUrl(building.imageurl) || 
                                 (building.image_urls && building.image_urls.length > 0 ? getImageUrl(building.image_urls[0]) : null);

                  return (
                    <div key={building.id} className="flex items-center gap-4 p-3 border rounded">
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={building.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{building.nome}</p>
                        <p className="text-sm text-gray-600">{building.endereco}</p>
                        <p className="text-xs text-gray-500">Bairro: {building.bairro}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gestão de vídeos com validação de segurança */}
        <VideoManagementCard
          orderStatus={orderDetails.status}
          videoSlots={videoManagement.videoSlots}
          uploading={videoManagement.uploading}
          uploadProgress={videoManagement.uploadProgress}
          onUpload={videoManagement.handleUpload}
          onActivate={videoManagement.handleActivate}
          onRemove={videoManagement.handleRemove}
          onDownload={videoManagement.handleDownload}
          onSetBaseVideo={videoManagement.handleSetBaseVideo}
          orderId={orderId || ''}
        />

        {/* Log de Agendamentos */}
        {/* <VideoManagementLogs orderId={orderId || ''} /> */}
      </div>
    </Layout>
  );
};

export default OrderDetails;
