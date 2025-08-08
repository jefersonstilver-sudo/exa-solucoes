
import React from 'react';
import { Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoSlotGrid } from '@/components/video-management/VideoSlotGrid';
import { OrderSecurityBanner } from '@/components/order/OrderSecurityBanner';
import { VideoSlot } from '@/types/videoManagement';
import { getOrderSecurityStatus } from '@/services/videoUploadSecurityService';

interface VideoManagementCardProps {
  orderStatus: string;
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => Promise<void>;
  onActivate: (slotId: string) => Promise<void>;
  onRemove: (slotId: string) => Promise<void>;
  onSelectForDisplay: (slotId: string) => Promise<void>;
  onDownload: (videoUrl: string, fileName: string) => void;
  onSetBaseVideo: (slotId: string) => Promise<void>;
  orderId: string;
}

export const VideoManagementCard: React.FC<VideoManagementCardProps> = ({
  orderStatus,
  videoSlots,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload,
  onSetBaseVideo,
  orderId
}) => {
  const security = getOrderSecurityStatus(orderStatus);
  const uploadAllowed = security.level === 'allowed' || security.level === 'active';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Video className="h-5 w-5 mr-2" />
          Gestão de Vídeos
        </CardTitle>
        <p className="text-sm text-gray-600">
          {uploadAllowed 
            ? "Envie até 4 vídeos com títulos descritivos e selecione qual será exibido nos painéis."
            : "Upload de vídeos disponível apenas para pedidos pagos."
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Banner de segurança */}
        <OrderSecurityBanner orderStatus={orderStatus} />
        
        {/* Grid de vídeos - só mostra se upload for permitido */}
        {uploadAllowed ? (
          <VideoSlotGrid
            videoSlots={videoSlots}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUpload={onUpload}
            onActivate={onActivate}
            onRemove={onRemove}
            onSelectForDisplay={onSelectForDisplay}
            onDownload={onDownload}
            onSetBaseVideo={onSetBaseVideo}
            onScheduleVideo={async (videoId: string, scheduleRules: any[]) => {
              console.log('Agendamento individual:', { videoId, scheduleRules });
            }}
            orderId={orderId}
          />
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 font-medium">Upload de vídeos bloqueado</p>
            <p className="text-sm text-gray-500 mt-2">
              Complete o pagamento do pedido para liberar o envio de vídeos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
