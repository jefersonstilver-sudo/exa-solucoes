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
import { videoLogger } from '@/services/logger/VideoActionLogger';
import { useForceCleanup } from '@/hooks/useForceCleanup';
import { VideoQRConfig, VideoQRConfigData } from './VideoQRConfig';
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
  qr_config?: VideoQRConfigData | null;
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
  companyInfoComplete?: boolean;
  tipoProduto?: string;
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
  hasAnyScheduledActiveNow = false,
  companyInfoComplete,
  tipoProduto
}) => {
  const isVertical = tipoProduto === 'vertical_premium' || tipoProduto === 'vertical';
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
  const isPendingWithVideo = slot.video_data && slot.approval_status === 'pending';
  const cardClasses = `transition-all duration-200 rounded-xl animate-fade-in ${slot.is_base_video ? 'border-2 border-yellow-500 bg-yellow-50/50 shadow-lg' : hasActiveSchedule && isScheduledActiveNow() ? 'border-2 border-green-500 bg-green-50/50 shadow-md' : hasActiveSchedule ? 'border border-blue-400 bg-blue-50/50 shadow-sm' : isPendingWithVideo ? 'border-2 border-amber-400 bg-amber-50/60 shadow-md' : isBlocked ? 'border border-gray-300 bg-gray-50 opacity-75' : 'bg-[#F2ECE9]/60 backdrop-blur-sm border border-[#F2ECE9] shadow-sm hover:shadow-md'}`;
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
  const cardElement = <Card className={`${cardClasses} overflow-hidden relative`}>
      {/* Blurred background video - decorative ambient effect */}
      {slot.video_data?.url && (
        <video
          src={slot.video_data.url}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30 scale-110 pointer-events-none z-0"
        />
      )}
      <CardContent className="p-3 sm:p-3 md:p-4 max-w-full overflow-hidden relative z-10">
        {/* Header do Slot */}
        <div className="mb-2 sm:mb-2 space-y-1.5">
          {/* Linha 1: Título do Slot + Status */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base sm:text-base text-foreground">Slot {slot.slot_position}</h3>
            <div className="flex items-center gap-1.5">
              {slot.video_data && getStatusIcon(slot.approval_status)}
              {slot.approval_status === 'rejected' && <Badge variant="destructive" className="text-xs py-0.5 px-2">Rejeitado</Badge>}
              {slot.approval_status === 'pending' && slot.video_data && <Badge className="text-xs py-0.5 px-2 bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-100">Enviado</Badge>}
              {slot.approval_status === 'pending' && !slot.video_data && <Badge variant="secondary" className="text-xs py-0.5 px-2">Aguardando</Badge>}
            </div>
          </div>
          
          {/* Linha 2: Badges e Botões (quando há vídeo aprovado) */}
          {slot.video_data && slot.approval_status === 'approved' && (
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-1">
              {/* Badge Vídeo Principal */}
              {slot.is_base_video && <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1 bg-slate-100 border border-slate-300 text-slate-700 px-2 py-1 sm:px-2 sm:py-1 rounded-lg text-xs sm:text-xs font-medium cursor-help">
                        <Star className="h-3 w-3 sm:h-3 sm:w-3" />
                        <span>Principal</span>
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
              
              {/* Badge "ATIVO" para vídeo principal */}
              {slot.is_base_video && !hasAnyScheduledActiveNow && <div className="flex items-center space-x-1 bg-green-50 border border-green-300 text-green-700 px-2 py-1 sm:px-1.5 sm:py-0.5 rounded-lg text-xs sm:text-xs font-medium">
                  <Tv className="h-3 w-3 sm:h-3 sm:w-3" />
                  <span>ATIVO</span>
                </div>}
              
              {/* Badge "EM EXIBIÇÃO" para vídeos agendados ativos */}
              {!slot.is_base_video && hasActiveSchedule && isScheduledActiveNow() && <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1 bg-green-50 border border-green-300 text-green-700 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-xs font-semibold cursor-help animate-pulse">
                        <Tv className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
              
              {/* Botão "Definir como Principal" */}
              {!slot.is_base_video && totalApprovedVideos >= 2 && <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          console.log('🔄 [BASE_VIDEO] Definindo novo vídeo base:', {
                            oldBaseVideoId: slot.id,
                            newBaseVideoId: slot.id,
                            hasActiveSchedule,
                            willRemoveSchedule: hasActiveSchedule,
                            timestamp: new Date().toISOString()
                          });

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
                        }} 
                        className="text-xs sm:text-xs px-2.5 sm:px-2 py-1 h-9 sm:h-7 border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg" 
                        title={hasActiveSchedule ? "Os agendamentos serão removidos" : "Clique para definir como vídeo principal"}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Definir Principal
                      </Button>
                    </TooltipTrigger>
                    {hasActiveSchedule && <TooltipContent>
                        <p className="font-medium">⚠️ Atenção</p>
                        <p className="text-xs mt-1">Os agendamentos deste vídeo serão removidos ao torná-lo principal</p>
                      </TooltipContent>}
                  </Tooltip>
                </TooltipProvider>}
            </div>
          )}
          
          {/* Aviso para vídeos bloqueados */}
          {isBlocked && <span className="text-xs sm:text-xs text-muted-foreground bg-muted px-2 py-1 sm:px-2 sm:py-1 rounded-lg inline-block">
              Não Selecionável
            </span>}
        </div>

        {/* Progress Bar para Upload - Compacto */}
        {currentProgress !== undefined && <div className="mb-2 sm:mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium text-gray-900">Enviando...</span>
              <span className="text-xs sm:text-sm text-gray-600">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-1.5 sm:h-2" />
          </div>}

        {slot.video_data ? (
          <div className="space-y-2 sm:space-y-4">
            {/* Mobile: Layout Limpo */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between gap-2 bg-muted/30 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate text-foreground" title={slot.video_data.nome}>
                    🎬 {slot.video_data.nome}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span>{formatDuration(slot.video_data.duracao)}</span>
                    <span>•</span>
                    <span className="truncate">{slot.video_data.orientacao}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-9 px-3 text-sm rounded-lg"
                  onClick={() => window.open(slot.video_data!.url, '_blank')}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ver
                </Button>
              </div>

              {/* Motivo de Rejeição - Mobile Compacto */}
              {slot.approval_status === 'rejected' && slot.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mt-2">
                  <p className="text-red-800 text-xs">
                    <strong>Motivo:</strong> {slot.rejection_reason}
                  </p>
                </div>
              )}

              {isBlocked && (
                <div className="bg-muted/50 border border-border rounded-xl p-2.5 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground text-xs">
                      {slot.approval_status === 'pending' ? 'Aguardando aprovação' : 'Vídeo rejeitado'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: Layout com Player (mantém original) */}
            <div className="hidden lg:block">
              <div className={`${isVertical ? 'aspect-[9/16] max-w-[280px] mx-auto' : 'aspect-video'} rounded-lg overflow-hidden relative`}>
                <VideoPlayer 
                  src={slot.video_data.url} 
                  title={slot.video_data.nome} 
                  className="w-full h-full" 
                  muted={true} 
                  controls={true} 
                  onDownload={() => handleDownload(slot.video_data!.url, slot.video_data!.nome)} 
                />
                {isBlocked && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <div className="text-center text-white">
                      <Lock className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Aguardando Aprovação</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="font-medium text-sm truncate text-gray-900" title={slot.video_data.nome}>
                  {slot.video_data.nome}
                </h4>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{formatDuration(slot.video_data.duracao)}</span>
                  <span>{slot.video_data.orientacao}</span>
                  <span>{formatFileSize(slot.video_data.tamanho_arquivo)}</span>
                </div>
              </div>

              {slot.approval_status === 'rejected' && slot.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-red-800 text-sm">
                    <strong>Motivo:</strong> {slot.rejection_reason}
                  </p>
                </div>
              )}

              {isBlocked && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <p className="text-gray-700 text-sm">
                      {slot.approval_status === 'pending' ? 'Aguardando aprovação' : 'Vídeo rejeitado'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <VideoSlotActions 
              slot={slot} 
              onActivate={onActivate} 
              onRemove={onRemove} 
              onDownload={handleDownload} 
              onScheduleVideo={onScheduleVideo} 
              onForceCleanup={handleForceCleanup} 
              totalApprovedVideos={totalApprovedVideos} 
              orderId={orderId} 
            />

            {/* QR Rastreável */}
            {slot.id && slot.approval_status !== 'rejected' && (
              <VideoQRConfig
                pedidoVideoId={slot.id}
                initial={slot.qr_config ?? null}
              />
            )}
          </div>
        ) : slot.id ? (
      // Placeholder para vídeo enviado mas ainda não carregado
      <div className="bg-yellow-50 border border-yellow-300 rounded-md sm:rounded-lg p-3 sm:p-6 text-center space-y-2 sm:space-y-3">
        <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-600 mx-auto" />
        <div>
          <p className="font-medium text-sm sm:text-base text-yellow-900">Vídeo Enviado</p>
          <p className="text-xs sm:text-sm text-yellow-700 mt-0.5 sm:mt-1">Aguardando aprovação</p>
        </div>
      </div>
    ) : (
      <VideoSlotUpload 
        slotPosition={slot.slot_position} 
        uploading={uploading} 
        isUploading={currentProgress !== undefined} 
        onUpload={onUpload}
        companyInfoComplete={companyInfoComplete}
        tipoProduto={tipoProduto}
      />
    )}
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