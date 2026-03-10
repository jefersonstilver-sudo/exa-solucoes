import React, { useState } from 'react';
import { Video, HelpCircle, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoSlotGrid } from '@/components/video-management/VideoSlotGrid';
import { VideoSlot } from '@/types/videoManagement';
import { getOrderSecurityStatus } from '@/services/videoUploadSecurityService';
import { Button } from '@/components/ui/button';
import { videoScheduleManagementService } from '@/services/videoScheduleManagementService';
import { TutorialVideoPopup } from '@/components/video-management/TutorialVideoPopup';
import { useVideoSpecifications } from '@/hooks/useVideoSpecifications';

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
  tipoProduto?: string;
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
  orderId,
  tipoProduto
}) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const security = getOrderSecurityStatus(orderStatus);
  const uploadAllowed = security.level === 'allowed' || security.level === 'active';

  // Determinar tipo de vídeo baseado no tipo_produto
  const isVertical = tipoProduto === 'vertical_premium' || tipoProduto === 'vertical';
  const videoTipo: 'horizontal' | 'vertical' = isVertical ? 'vertical' : 'horizontal';

  // Buscar especificações dinâmicas
  const { getSpecsDisplay } = useVideoSpecifications();
  const specs = getSpecsDisplay(videoTipo);

  const orientacaoLabel = isVertical ? 'vertical' : 'horizontal';
  const maxDuracaoLabel = `${specs.duracao}s`;

  const handleScheduleVideo = async (videoId: string, scheduleRules: any[]) => {
    try {
      console.log('📅 [VIDEO_MGMT] Agendando vídeo:', {
        videoId,
        scheduleRules
      });

      const videoSlot = videoSlots.find(slot => slot.video_id === videoId);
      const slotPosition = videoSlot?.slot_position || 1;
      console.log('📅 [VIDEO_MGMT] Slot position encontrada:', slotPosition);
      const success = await videoScheduleManagementService.updateVideoScheduleRules(videoId, scheduleRules, slotPosition);
      if (success) {
        console.log('✅ [VIDEO_MGMT] Agendamento realizado com sucesso');
        if (onRefreshSlots) {
          await onRefreshSlots();
        }
      }
    } catch (error) {
      console.error('❌ [VIDEO_MGMT] Erro ao agendar vídeo:', error);
    }
  };

  return <>
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-lg">
        <CardHeader className="p-3 sm:p-5 pb-2">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Video className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm sm:text-lg font-semibold">Gestão de Vídeos</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {uploadAllowed 
                    ? `${videoSlots.filter(s => s.video_id).length} / ${videoSlots.length} slots utilizados · máx. ${maxDuracaoLabel}, ${orientacaoLabel}, 100MB`
                    : "Upload disponível apenas para pedidos pagos"}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 sm:h-8 sm:px-3 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 flex-shrink-0" 
              onClick={() => setShowTutorial(true)}
            >
              <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="hidden xs:inline">Tutorial</span>
            </Button>
          </CardTitle>
        </CardHeader>
        
        {/* Instruções - Colapsável */}
        {uploadAllowed && (
          <div className="px-2 sm:px-4 pb-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 justify-between text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Como funciona?
              </span>
              {instructionsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            
            {instructionsExpanded && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 text-[10px] sm:text-xs text-muted-foreground">
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 font-semibold">•</span>
                  <span>Envie até {videoSlots.length} vídeo{videoSlots.length !== 1 ? 's' : ''} (máx. {maxDuracaoLabel}, {orientacaoLabel}, 100MB)</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 font-semibold">•</span>
                  <span>Selecione qual vídeo será exibido nos painéis</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 font-semibold">•</span>
                  <span>Aguarde aprovação dos administradores</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 mt-0.5 font-semibold">•</span>
                  <span>Vídeo aprovado será ativado automaticamente</span>
                </p>
              </div>
            )}
          </div>
        )}
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
              tipoProduto={tipoProduto}
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
      
      <TutorialVideoPopup 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </>;
};
