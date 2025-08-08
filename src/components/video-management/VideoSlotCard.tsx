
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Star,
  StarOff,
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Lock,
  Shield,
  Tv
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { VideoSlotActions } from './VideoSlotActions';
import { VideoSlotUpload } from './VideoSlotUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrentVideoDisplay } from '@/hooks/useCurrentVideoDisplay';

interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
  selected_for_display: boolean;
  is_base_video: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tem_audio: boolean;
    tamanho_arquivo?: number;
    formato?: string;
  };
  rejection_reason?: string;
  schedule_rules?: {
    id: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
}

interface VideoSlotCardProps {
  slot: VideoSlot;
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onSelectForDisplay: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
  onSetBaseVideo?: (slotId: string) => void;
  onScheduleVideo?: (videoId: string, scheduleRules: any[]) => Promise<void>;
  orderId: string;
  currentDisplayVideoId?: string;
  totalApprovedVideos: number;
}

export const VideoSlotCard: React.FC<VideoSlotCardProps> = ({
  slot,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onSelectForDisplay,
  onDownload,
  onSetBaseVideo,
  onScheduleVideo,
  orderId,
  currentDisplayVideoId,
  totalApprovedVideos
}) => {
  const { isVideoCurrentlyDisplaying, getCurrentDisplayType } = useCurrentVideoDisplay({
    orderId,
    enabled: !!slot.video_data?.id
  });
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Verificar se o vídeo tem agendamento ativo
  const hasActiveSchedule = slot.schedule_rules && 
    slot.schedule_rules.length > 0 && 
    slot.schedule_rules.some(rule => rule.is_active && rule.days_of_week && rule.days_of_week.length > 0);
  
  console.log(`🔍 [SLOT_${slot.slot_position}] Status debug:`, {
    hasVideo: !!slot.video_data,
    isActive: slot.is_active,
    approvalStatus: slot.approval_status,
    selectedForDisplay: slot.selected_for_display,
    isBaseVideo: slot.is_base_video,
    scheduleRules: slot.schedule_rules,
    hasActiveSchedule,
    currentDisplayVideoId
  });
  
  // Verificar se o agendamento está ativo AGORA (verificação temporal)
  const isScheduledActiveNow = () => {
    if (!hasActiveSchedule) return false;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return slot.schedule_rules!.some(rule => {
      if (!rule.is_active) return false;
      
      // Verificar se hoje está nos dias programados
      const isDayMatched = rule.days_of_week.includes(currentDay);
      
      // Verificar se está no horário programado
      const isTimeMatched = currentTime >= rule.start_time && currentTime <= rule.end_time;
      
      return isDayMatched && isTimeMatched;
    });
  };
  
  console.log(`🔍 [VIDEO_SLOT] Slot ${slot.slot_position} DEBUG:`, {
    videoData: !!slot.video_data,
    videoId: slot.video_data?.id,
    approvalStatus: slot.approval_status,
    hasScheduleRules: !!slot.schedule_rules,
    rulesCount: slot.schedule_rules?.length || 0,
    hasActiveSchedule: hasActiveSchedule,
    isScheduledActiveNow: isScheduledActiveNow(),
    isBaseVideo: slot.is_base_video,
    rules: slot.schedule_rules
  });

  const getStatusBadge = () => {
    if (!slot.video_data) return null;
    
    const videoId = slot.video_data.id;
    const isCurrentlyShowing = isVideoCurrentlyDisplaying(videoId);
    
    console.log(`🔍 [SLOT_${slot.slot_position}] Calculando status:`, {
      approvalStatus: slot.approval_status,
      isCurrentlyShowing,
      hasActiveSchedule,
      isActive: slot.is_active,
      scheduleRulesCount: slot.schedule_rules?.length || 0
    });

    // Se está sendo exibido atualmente (base video), tem prioridade máxima
    if (isCurrentlyShowing) {
      return <Badge className="bg-green-600 text-white">EM EXIBIÇÃO</Badge>;
    }

    if (slot.approval_status === 'rejected') {
      return <Badge variant="destructive">REJEITADO</Badge>;
    }

    if (slot.approval_status === 'pending') {
      return <Badge variant="secondary">PENDENTE</Badge>;
    }

    if (slot.approval_status === 'approved') {
      // Se tem agendamento ativo e NÃO está em exibição, mostra AGENDADO
      if (hasActiveSchedule && !isCurrentlyShowing) {
        console.log(`✅ [SLOT_${slot.slot_position}] Status AGENDADO aplicado`);
        return <Badge className="bg-blue-600 text-white">AGENDADO</Badge>;
      }
      
      // Se está ativo mas sem agendamento específico
      if (slot.is_active) {
        return <Badge className="bg-yellow-600 text-white">ATIVO</Badge>;
      }
      
      // Apenas aprovado, sem ativação ou agendamento
      return <Badge variant="outline" className="text-green-600 border-green-600">APROVADO</Badge>;
    }

    return null;
  };

  const getSelectionIcon = (slot: VideoSlot) => {
    if (slot.approval_status !== 'approved') {
      return <Lock className="h-5 w-5 text-gray-400" />;
    }
    
    // Só mostra estrela preenchida se realmente está ativo no horário
    if (isScheduledAndActive()) {
      return <Star className="h-5 w-5 text-yellow-500 fill-current" />;
    }
    
    // Se tem agendamento mas não está ativo, mostrar ícone de relógio
    if (slot.schedule_rules && slot.schedule_rules.length > 0) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    
    // Se não tem agendamento e está selecionado, mostrar estrela
    if (slot.selected_for_display) {
      return <Star className="h-5 w-5 text-yellow-500 fill-current" />;
    }
    
    return <StarOff className="h-5 w-5 text-gray-400" />;
  };

  const getScheduleBadge = (slot: VideoSlot) => {
    // Não mostrar mais badges de agendamento
    return null;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  const handleDownload = (videoUrl: string, fileName: string) => {
    if (onDownload) {
      onDownload(videoUrl, fileName);
    } else {
      window.open(videoUrl, '_blank');
    }
  };

  const currentProgress = uploadProgress[slot.slot_position];

  // Verificar se deve ter borda amarela (apenas quando realmente ativo no horário)
  const isScheduledAndActive = () => {
    if (!slot.schedule_rules || slot.schedule_rules.length === 0) {
      return slot.selected_for_display;
    }
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    for (const rule of slot.schedule_rules) {
      if (rule.days_of_week.includes(currentDay) && 
          currentTime >= rule.start_time && 
          currentTime <= rule.end_time) {
        return slot.selected_for_display;
      }
    }
    return false;
  };

  const isBlocked = slot.video_data && slot.approval_status !== 'approved';
  const cardClasses = `transition-all duration-200 bg-white border ${
    slot.is_base_video
      ? 'border-2 border-yellow-400 bg-yellow-50 shadow-lg' 
      : hasActiveSchedule
        ? 'border-2 border-blue-400 bg-blue-50 shadow-md'
      : isBlocked
        ? 'border-2 border-gray-300 bg-gray-50 opacity-75'
        : 'border-gray-200 hover:shadow-md'
  }`;

  const getScheduleTooltipContent = () => {
    if (!hasActiveSchedule || !slot.schedule_rules) return null;
    
    return (
      <div className="p-2 space-y-2">
        <p className="font-medium text-sm">Agendamento Ativo:</p>
        {slot.schedule_rules.map((rule, index) => (
          <div key={index} className="text-xs">
            <p>Dias: {rule.days_of_week.map(day => 
              ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]
            ).join(', ')}</p>
            <p>Horário: {rule.start_time} - {rule.end_time}</p>
          </div>
        ))}
      </div>
    );
  };

  const cardElement = (
    <Card className={cardClasses}>
      <CardContent className="p-3 sm:p-6 max-w-full overflow-hidden">
        {/* Header do Slot */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-lg text-gray-900">Slot {slot.slot_position}</h3>
            
            {/* Botão Vídeo Principal */}
            {slot.video_data && slot.approval_status === 'approved' && totalApprovedVideos >= 2 && (
              <Button
                variant={slot.is_base_video ? "default" : "outline"}
                size="sm"
                onClick={() => slot.id && onSetBaseVideo && onSetBaseVideo(slot.id)}
                className={`text-xs px-3 py-1 h-7 ${
                  slot.is_base_video 
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                title={slot.is_base_video ? "Este é o vídeo principal" : "Clique para definir como vídeo principal"}
              >
                Vídeo Principal
              </Button>
            )}
            
            {slot.video_data && getStatusIcon(slot.approval_status)}
            {isBlocked && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Não Selecionável
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Progress Bar para Upload */}
        {currentProgress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Enviando vídeo...</span>
              <span className="text-sm text-gray-600">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
        )}

        {slot.video_data ? (
          <div className="space-y-4">
            {/* Video Player */}
            <div className="aspect-video rounded-lg overflow-hidden relative">
              <VideoPlayer
                src={slot.video_data.url}
                title={slot.video_data.nome}
                className="w-full h-full"
                muted={true}
                controls={true}
                onDownload={() => handleDownload(slot.video_data!.url, slot.video_data!.nome)}
              />
              {isScheduledAndActive() && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-yellow-500 text-white flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-current" />
                    <span>SELECIONADO</span>
                  </Badge>
                </div>
              )}
              {isBlocked && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="text-center text-white">
                    <Lock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Aguardando Aprovação</p>
                  </div>
                </div>
              )}
            </div>

            {/* Informações do Vídeo */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm truncate text-gray-900" title={slot.video_data.nome}>
                {slot.video_data.nome}
              </h4>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{formatDuration(slot.video_data.duracao)}</span>
                <span>{slot.video_data.orientacao}</span>
                <span>{formatFileSize(slot.video_data.tamanho_arquivo)}</span>
              </div>
            </div>

            {/* Motivo de Rejeição */}
            {slot.approval_status === 'rejected' && slot.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  <strong>Motivo da rejeição:</strong> {slot.rejection_reason}
                </p>
              </div>
            )}

            {/* Aviso para vídeos não aprovados */}
            {isBlocked && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700 text-sm">
                    {slot.approval_status === 'pending' 
                      ? 'Este vídeo está aguardando aprovação dos administradores.'
                      : 'Este vídeo foi rejeitado e não pode ser selecionado.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <VideoSlotActions
              slot={slot}
              onActivate={onActivate}
              onRemove={onRemove}
              onSelectForDisplay={onSelectForDisplay}
              onDownload={handleDownload}
              onScheduleVideo={onScheduleVideo}
              totalApprovedVideos={totalApprovedVideos}
            />
          </div>
        ) : (
          <VideoSlotUpload
            slotPosition={slot.slot_position}
            uploading={uploading}
            isUploading={currentProgress !== undefined}
            onUpload={onUpload}
          />
        )}
      </CardContent>
    </Card>
  );

  // Se tem agendamento ativo, envolver com tooltip
  if (hasActiveSchedule) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardElement}
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-blue-900 text-white p-3 rounded-lg shadow-lg">
            {getScheduleTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardElement;
};
