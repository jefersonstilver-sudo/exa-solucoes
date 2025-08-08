import { VideoSlot } from '@/types/videoManagement';

interface RemovalValidation {
  canRemove: boolean;
  reason?: string;
  isLastActiveVideo: boolean;
  activeVideosCount: number;
}

export const useVideoRemovalValidation = () => {
  const validateRemoval = (
    targetSlotId: string,
    videoSlots: VideoSlot[],
    contractStarted: boolean = false
  ): RemovalValidation => {
    // Contar vídeos ativos aprovados
    const activeApprovedVideos = videoSlots.filter(slot => 
      slot.approval_status === 'approved' && 
      slot.is_active && 
      slot.id
    );

    const activeVideosCount = activeApprovedVideos.length;
    const isLastActiveVideo = activeVideosCount === 1 && 
      activeApprovedVideos.some(slot => slot.id === targetSlotId);

    // Se o contrato não foi iniciado, sempre pode remover
    if (!contractStarted) {
      return {
        canRemove: true,
        isLastActiveVideo: false,
        activeVideosCount
      };
    }

    // Se é o último vídeo ativo e o contrato já iniciou, não pode remover
    if (isLastActiveVideo) {
      return {
        canRemove: false,
        reason: 'Não é possível remover o último vídeo ativo de um contrato ativo. Envie outro vídeo primeiro.',
        isLastActiveVideo: true,
        activeVideosCount
      };
    }

    return {
      canRemove: true,
      isLastActiveVideo: false,
      activeVideosCount
    };
  };

  return {
    validateRemoval
  };
};