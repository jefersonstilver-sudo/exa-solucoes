import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, StarOff, CheckCircle, XCircle, Clock, AlertCircle, Lock, Shield, Tv } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { VideoSlotActions } from './VideoSlotActions';
import { VideoSlotUpload } from './VideoSlotUpload';
import { VideoStatusBadge } from './VideoStatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrentVideoDisplay } from '@/hooks/useCurrentVideoDisplay';
import { videoLogger } from '@/services/logger/VideoActionLogger';
import { useForceCleanup } from '@/hooks/useForceCleanup';
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
  uploadProgress: {
    [key: number]: number;
  };
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
  onSetBaseVideo?: (slotId: string) => void;
  onScheduleVideo?: (videoId: string, scheduleRules: any[]) => Promise<void>;
  orderId: string;
  currentDisplayVideoId?: string;
  totalApprovedVideos: number;
  hasAnyScheduledActiveNow?: boolean;
}
export const VideoSlotCard: React.FC<VideoSlotCardProps> = ({
  slot,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onDownload,
  onSetBaseVideo,
  onScheduleVideo,
  orderId,
  currentDisplayVideoId,
  totalApprovedVideos,
  hasAnyScheduledActiveNow = false
}) => {
  const {
    isVideoCurrentlyDisplaying,
    getCurrentDisplayType
  } = useCurrentVideoDisplay({
    orderId,
    enabled: !!slot.video_data?.id
  });
  const {
    forceCleanupSlot
  } = useForceCleanup();
  const handleForceCleanup = async (slotId: string) => {
    console.log('🧹 [SLOT_CARD] Iniciando limpeza forçada:', {
      slotId,
      slotPosition: slot.slot_position,
      videoName: slot.video_data?.nome
    });
    const success = await forceCleanupSlot(slotId, slot.slot_position);
    if (success) {
      // Forçar reload da página após 1 segundo
      setTimeout(() => {
        console.log('🔄 Recarregando página após limpeza...');
        window.location.reload();
      }, 1000);
    }
    return success;
  };
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
  const hasActiveSchedule = slot.schedule_rules && slot.schedule_rules.length > 0 && slot.schedule_rules.some(rule => rule.is_active && rule.days_of_week && rule.days_of_week.length > 0);
  console.log(`🔍 [CARD] SLOT_${slot.slot_position} renderizando:`, {
    hasVideo: !!slot.video_data,
    videoName: slot.video_data?.nome,
    slotId: slot.id,
    isActive: slot.is_active,
    approvalStatus: slot.approval_status,
    selectedForDisplay: slot.selected_for_display,
    isBaseVideo: slot.is_base_video,
    scheduleRules: slot.schedule_rules,
    hasActiveSchedule,
    currentDisplayVideoId,
    timestamp: new Date().toISOString()
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
      if (rule.days_of_week.includes(currentDay) && currentTime >= rule.start_time && currentTime <= rule.end_time) {
        return slot.selected_for_display;
      }
    }
    return false;
  };
  const isBlocked = slot.video_data && slot.approval_status !== 'approved';
  const cardClasses = `transition-all duration-200 bg-white border ${slot.is_base_video ? 'border-4 border-yellow-500 bg-yellow-50 shadow-xl' : hasActiveSchedule && isScheduledActiveNow() ? 'border-3 border-green-500 bg-green-50 shadow-lg' : hasActiveSchedule ? 'border-2 border-blue-400 bg-blue-50 shadow-md' : isBlocked ? 'border-2 border-gray-300 bg-gray-50 opacity-75' : 'border-gray-200 hover:shadow-md'}`;
  const getScheduleTooltipContent = () => {
    if (!hasActiveSchedule || !slot.schedule_rules) return null;
    return <div className="p-2 space-y-2">
        <p className="font-medium text-sm">Agendamento Ativo:</p>
        {slot.schedule_rules.map((rule, index) => <div key={index} className="text-xs">
            <p>Dias: {rule.days_of_week.map(day => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]).join(', ')}</p>
            <p>Horário: {rule.start_time} - {rule.end_time}</p>
          </div>)}
      </div>;
  };
  const cardElement = <Card className={cardClasses}>
      <CardContent className="p-3 sm:p-6 max-w-full overflow-hidden">
        {/* Header do Slot */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-lg text-gray-900">Slot {slot.slot_position}</h3>
            
            {/* Badge Vídeo Principal - Minimalista e Profissional */}
            {slot.video_data && slot.approval_status === 'approved' && slot.is_base_video && <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-help">
                      {/* Badge Minimalista */}
                      <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium">
                        <Star className="h-3.5 w-3.5" />
                        <span>Vídeo Principal</span>
                      </div>
                      
                      {/* Badge "EM EXIBIÇÃO" - apenas se não houver agendamentos ativos */}
                      {!hasAnyScheduledActiveNow && <div className="flex items-center space-x-1 bg-green-50 border border-green-300 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium">
                          <Tv className="h-3 w-3" />
                          <span>EM EXIBIÇÃO</span>
                        </div>}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs bg-slate-900 text-white p-3">
                    <p className="text-sm font-semibold mb-1">⭐ Vídeo Principal</p>
                    <p className="text-xs leading-relaxed">
                      Quando o pedido é ativado, o sistema sempre mantém pelo menos um vídeo em exibição. Este é o vídeo padrão que será exibido automaticamente quando não houver agendamentos ativos.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
            
            {/* Badge "EM EXIBIÇÃO" para vídeos agendados - quando estão no período ativo */}
            {slot.video_data && slot.approval_status === 'approved' && !slot.is_base_video && hasActiveSchedule && isScheduledActiveNow() && <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1 bg-green-50 border border-green-300 text-green-700 px-2.5 py-1.5 rounded-md text-xs font-semibold animate-pulse cursor-help">
                      <Tv className="h-3.5 w-3.5" />
                      <span>EM EXIBIÇÃO</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs bg-green-900 text-white p-3">
                    <p className="text-sm font-semibold mb-1">🎬 Vídeo Agendado em Exibição</p>
                    <p className="text-xs leading-relaxed">
                      Este vídeo está sendo exibido agora de acordo com o agendamento configurado. Quando o período de agendamento terminar, o sistema voltará automaticamente para o vídeo principal.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
            
            {/* Botão para trocar vídeo principal - SOMENTE se há 2+ vídeos aprovados */}
            {slot.video_data && slot.approval_status === 'approved' && !slot.is_base_video && totalApprovedVideos >= 2 && <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={async () => {
                  console.log('🔄 [BASE_VIDEO] Definindo novo vídeo base:', {
                    oldBaseVideoId: slot.id,
                    newBaseVideoId: slot.id,
                    hasActiveSchedule,
                    willRemoveSchedule: hasActiveSchedule,
                    timestamp: new Date().toISOString()
                  });

                  // Se tem agendamento, avisar que será removido
                  if (hasActiveSchedule) {
                    const confirmed = window.confirm('Este vídeo possui agendamentos ativos. Ao defini-lo como vídeo principal, todos os agendamentos serão removidos automaticamente. Deseja continuar?');
                    if (!confirmed) return;
                  }
                  const clickData = {
                    slotId: slot.id,
                    slotPosition: slot.slot_position,
                    videoName: slot.video_data?.nome,
                    isBaseVideo: slot.is_base_video,
                    totalApprovedVideos
                  };
                  console.log('🎯 [SLOT_CARD] Botão "Definir como Principal" clicado:', clickData);
                  videoLogger.logUserClick('set_base_video_button', 'Clique no botão Definir como Principal', clickData);
                  if (slot.id && onSetBaseVideo) {
                    console.log('✅ [SLOT_CARD] Chamando onSetBaseVideo...');
                    videoLogger.logUserClick('set_base_video_calling', 'Chamando callback onSetBaseVideo', {
                      slotId: slot.id
                    });
                    try {
                      onSetBaseVideo(slot.id);
                      videoLogger.logUserClick('set_base_video_callback_called', 'Callback executado', {
                        slotId: slot.id
                      });
                    } catch (error: any) {
                      console.error('❌ [SLOT_CARD] Erro ao chamar onSetBaseVideo:', error);
                      videoLogger.logUserClick('set_base_video_callback_error', 'Erro ao executar callback', {
                        slotId: slot.id,
                        error: error.message,
                        stack: error.stack
                      });
                    }
                  } else {
                    const errorData = {
                      hasSlotId: !!slot.id,
                      hasCallback: !!onSetBaseVideo
                    };
                    console.error('❌ [SLOT_CARD] Não foi possível chamar onSetBaseVideo:', errorData);
                    videoLogger.logUserClick('set_base_video_no_callback', 'Callback não disponível', errorData);
                  }
                }} className="text-xs px-3 py-1 h-7 border-gray-300 text-gray-600 hover:bg-gray-50" title={hasActiveSchedule ? "Os agendamentos serão removidos" : "Clique para definir como vídeo principal"}>
                      Definir como Principal
                    </Button>
                  </TooltipTrigger>
                  {hasActiveSchedule && <TooltipContent>
                      <p className="font-medium">⚠️ Atenção</p>
                      <p className="text-xs mt-1">Os agendamentos deste vídeo serão removidos ao torná-lo principal</p>
                    </TooltipContent>}
                </Tooltip>
              </TooltipProvider>}
            
            {/* Aviso se é o único vídeo aprovado (não pode ser removido/desmarcado) */}
            {slot.is_base_video && totalApprovedVideos === 1 && <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1 bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded-md text-xs cursor-help">
                      <Shield className="h-3 w-3" />
                      <span>Protegido</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs bg-red-900 text-white">
                    <p className="text-sm font-medium">⚠️ Não Pode Ser Removido</p>
                    <p className="text-xs mt-1">
                      Este é o único vídeo aprovado do pedido. Envie outro vídeo e aguarde aprovação antes de remover este.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>}
            
            {slot.video_data && getStatusIcon(slot.approval_status)}
            {isBlocked && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Não Selecionável
              </span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Badges de status de aprovação */}
            {slot.approval_status === 'rejected' && <Badge variant="destructive">REJEITADO</Badge>}
            {slot.approval_status === 'pending' && <Badge variant="secondary">PENDENTE</Badge>}
          </div>
        </div>

        {/* Progress Bar para Upload */}
        {currentProgress !== undefined && <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Enviando vídeo...</span>
              <span className="text-sm text-gray-600">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>}

        {slot.video_data ? <div className="space-y-4">
            {/* Video Player */}
            <div className="aspect-video rounded-lg overflow-hidden relative">
              <VideoPlayer src={slot.video_data.url} title={slot.video_data.nome} className="w-full h-full" muted={true} controls={true} onDownload={() => handleDownload(slot.video_data!.url, slot.video_data!.nome)} />
              {isBlocked && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="text-center text-white">
                    <Lock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Aguardando Aprovação</p>
                  </div>
                </div>}
            </div>
        ) : slot.id ? (
          // Mostrar placeholder para vídeo que existe mas ainda não foi carregado
          

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
            {slot.approval_status === 'rejected' && slot.rejection_reason && <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  <strong>Motivo da rejeição:</strong> {slot.rejection_reason}
                </p>
              </div>}

            {/* Aviso para vídeos não aprovados */}
            {isBlocked && <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700 text-sm">
                    {slot.approval_status === 'pending' ? 'Este vídeo está aguardando aprovação dos administradores.' : 'Este vídeo foi rejeitado e não pode ser selecionado.'}
                  </p>
                </div>
              </div>}

            {/* Botões de Ação */}
            <VideoSlotActions slot={slot} onActivate={onActivate} onRemove={onRemove} onDownload={handleDownload} onScheduleVideo={onScheduleVideo} onForceCleanup={handleForceCleanup} totalApprovedVideos={totalApprovedVideos} orderId={orderId} />
          </div> : <VideoSlotUpload slotPosition={slot.slot_position} uploading={uploading} isUploading={currentProgress !== undefined} onUpload={onUpload} />}
      </CardContent>
    </Card>;

  // Se tem agendamento ativo, envolver com tooltip
  if (hasActiveSchedule) {
    return <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardElement}
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-blue-900 text-white p-3 rounded-lg shadow-lg">
            {getScheduleTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>;
  }
  return cardElement;
};