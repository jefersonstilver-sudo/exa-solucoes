
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useRealOrderDetails } from '@/hooks/useRealOrderDetails';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { useOrderViewTracking } from '@/hooks/tracking/useOrderViewTracking';
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
  
  const videoManagement = useVideoManagement({
    orderId: orderId || '',
    userId: user?.id || '',
    orderStatus: orderDetails?.status || ''
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
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!orderDetails) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <span>Pedido não encontrado</span>
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
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Detalhes do Pedido #{orderDetails.id.slice(-8)}</h1>
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
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header do pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-6 w-6 mr-2" />
              Detalhes do Pedido #{orderDetails.id.slice(-8)}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{orderDetails.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="font-medium">R$ {orderDetails.valor_total?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data do Pedido</p>
              <p className="font-medium">
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
          onSelectForDisplay={videoManagement.handleSelectForDisplay}
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
