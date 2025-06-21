
import React from 'react';
import { useParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useRealOrderDetails } from '@/hooks/useRealOrderDetails';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoManagementCard } from '@/components/order/VideoManagementCard';
import { Loader2, Package, AlertTriangle } from 'lucide-react';

const OrderDetails: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const { user } = useUserSession();
  const { loading, orderDetails, orderVideos, panelData } = useRealOrderDetails(orderId || '');
  
  const videoManagement = useVideoManagement({
    orderId: orderId || '',
    userId: user?.id || '',
    orderStatus: orderDetails?.status || ''
  });

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
                {panelData.map((panel) => (
                  <div key={panel.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{panel.building_name}</p>
                      <p className="text-sm text-gray-600">{panel.building_address}</p>
                      <p className="text-xs text-gray-500">Código: {panel.code}</p>
                    </div>
                  </div>
                ))}
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
        />
      </div>
    </Layout>
  );
};

export default OrderDetails;
