import React, { useState } from 'react';
import { Video, HelpCircle, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoSlotGrid } from '@/components/video-management/VideoSlotGrid';
import { VideoSlot } from '@/types/videoManagement';
import { getOrderSecurityStatus } from '@/services/videoUploadSecurityService';
import { Button } from '@/components/ui/button';
import { videoScheduleManagementService } from '@/services/videoScheduleManagementService';
import { TutorialVideoPopup } from '@/components/video-management/TutorialVideoPopup';
import { VideoInstructionsModal } from '@/components/video-management/VideoInstructionsModal';
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
  onDownload,
  onSetBaseVideo,
  onRefreshSlots,
  orderId
}) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
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
      <Card className="shadow-sm">
        <CardHeader className="p-2 sm:p-4 pb-2">
          <CardTitle className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <div>
                <span className="text-sm sm:text-lg font-semibold">Gestão de Vídeos</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {uploadAllowed ? "Até 4 vídeos (máx. 15s, 100MB)" : "Upload disponível apenas para pedidos pagos"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 sm:h-8 sm:w-8" 
                onClick={() => setShowInstructions(true)}
              >
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 sm:h-8 sm:px-3 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700" 
                onClick={() => setShowTutorial(true)}
              >
                <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                <span className="hidden xs:inline">Tutorial</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-2">
          {uploadAllowed ? (
            <VideoSlotGrid 
              videoSlots={videoSlots} 
              uploading={uploading} 
              uploadProgress={uploadProgress} 
              onUpload={onUpload} 
              onActivate={onActivate} 
              onRemove={onRemove} 
              onDownload={onDownload} 
              onSetBaseVideo={onSetBaseVideo} 
              onScheduleVideo={handleScheduleVideo} 
              orderId={orderId} 
            />
          ) : (
            <div className="text-center py-6 sm:py-8 bg-muted/30 rounded-lg border-2 border-dashed">
              <Video className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-muted-foreground" />
              <p className="text-xs sm:text-sm font-medium mb-1">Upload bloqueado</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground px-4">
                Complete o pagamento para liberar
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <VideoInstructionsModal 
        isOpen={showInstructions} 
        onClose={() => setShowInstructions(false)} 
      />
      <TutorialVideoPopup 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </>;
};