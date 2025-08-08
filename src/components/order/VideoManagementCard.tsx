
import React, { useState } from 'react';
import { Video, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoSlotGrid } from '@/components/video-management/VideoSlotGrid';
import { OrderSecurityBanner } from '@/components/order/OrderSecurityBanner';
import { VideoSlot } from '@/types/videoManagement';
import { getOrderSecurityStatus } from '@/services/videoUploadSecurityService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

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
  const [showHelp, setShowHelp] = useState(false);
  const security = getOrderSecurityStatus(orderStatus);
  const uploadAllowed = security.level === 'allowed' || security.level === 'active';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Gestão de Vídeos
          </div>
          <Collapsible open={showHelp} onOpenChange={setShowHelp}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardTitle>
        <Collapsible open={showHelp} onOpenChange={setShowHelp}>
          <CollapsibleContent>
            <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Como Funciona:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Envie até 4 vídeos (MP4, MOV, AVI - máx. 500MB)</li>
                <li>Aguarde a aprovação dos administradores</li>
                <li>Com 2+ vídeos aprovados, você pode agendar horários</li>
                <li>Selecione qual vídeo será exibido nos painéis</li>
                <li>Defina um vídeo como base (padrão) se desejar</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <p className="text-sm text-gray-600">
          {uploadAllowed 
            ? "Envie até 4 vídeos com títulos descritivos e selecione qual será exibido nos painéis."
            : "Upload de vídeos disponível apenas para pedidos pagos."
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
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
