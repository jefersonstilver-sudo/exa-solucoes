import React, { useState } from 'react';
import { Video, ChevronDown, ChevronUp, HelpCircle, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoSlotGrid } from '@/components/video-management/VideoSlotGrid';
import { OrderSecurityBanner } from '@/components/order/OrderSecurityBanner';
import { VideoSlot } from '@/types/videoManagement';
import { getOrderSecurityStatus } from '@/services/videoUploadSecurityService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { videoScheduleManagementService } from '@/services/videoScheduleManagementService';
import { toast } from 'sonner';
import { TutorialVideoPopup } from '@/components/video-management/TutorialVideoPopup';
interface VideoManagementCardProps {
  orderStatus: string;
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: {
    [key: number]: number;
  };
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => Promise<void>;
  onActivate: (slotId: string) => Promise<void>;
  onRemove: (slotId: string) => Promise<void>;
  onSelectForDisplay: (slotId: string) => Promise<void>;
  onDownload: (videoUrl: string, fileName: string) => void;
  onSetBaseVideo: (slotId: string) => Promise<void>;
  onRefreshSlots?: () => Promise<void>;
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
  onRefreshSlots,
  orderId
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const security = getOrderSecurityStatus(orderStatus);
  const uploadAllowed = security.level === 'allowed' || security.level === 'active';
  const handleScheduleVideo = async (videoId: string, scheduleRules: any[]) => {
    try {
      console.log('📅 [VIDEO_MGMT] Agendando vídeo:', {
        videoId,
        scheduleRules
      });

      // Encontrar a posição do slot do vídeo
      const videoSlot = videoSlots.find(slot => slot.video_id === videoId);
      const slotPosition = videoSlot?.slot_position || 1;
      console.log('📅 [VIDEO_MGMT] Slot position encontrada:', slotPosition);
      const success = await videoScheduleManagementService.updateVideoScheduleRules(videoId, scheduleRules, slotPosition);
      if (success) {
        console.log('✅ [VIDEO_MGMT] Agendamento realizado com sucesso');
        // Refresh the slots to show the updated schedule
        if (onRefreshSlots) {
          await onRefreshSlots();
        }
      }
    } catch (error) {
      console.error('❌ [VIDEO_MGMT] Erro ao agendar vídeo:', error);
    }
  };
  return <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Video className="h-5 w-5 mr-2" />
              Gestão de Vídeos
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:bg-primary/10 text-primary" onClick={() => setShowTutorial(true)}>
                <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                Tutorial
              </Button>
              <Collapsible open={showHelp} onOpenChange={setShowHelp}>
                <CollapsibleTrigger asChild>
                  
                </CollapsibleTrigger>
              </Collapsible>
            </div>
          </CardTitle>
          <Collapsible open={showHelp} onOpenChange={setShowHelp}>
            <CollapsibleContent>
              
            </CollapsibleContent>
          </Collapsible>
          <p className="text-sm text-gray-600">
            {uploadAllowed ? "Envie até 4 vídeos com títulos descritivos e selecione qual será exibido nos painéis." : "Upload de vídeos disponível apenas para pedidos pagos."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Grid de vídeos - só mostra se upload for permitido */}
          {uploadAllowed ? <VideoSlotGrid videoSlots={videoSlots} uploading={uploading} uploadProgress={uploadProgress} onUpload={onUpload} onActivate={onActivate} onRemove={onRemove} onSelectForDisplay={onSelectForDisplay} onDownload={onDownload} onSetBaseVideo={onSetBaseVideo} onScheduleVideo={handleScheduleVideo} orderId={orderId} /> : <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium">Upload de vídeos bloqueado</p>
              <p className="text-sm text-gray-500 mt-2">
                Complete o pagamento do pedido para liberar o envio de vídeos
              </p>
            </div>}
        </CardContent>
      </Card>
      
      <TutorialVideoPopup isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>;
};