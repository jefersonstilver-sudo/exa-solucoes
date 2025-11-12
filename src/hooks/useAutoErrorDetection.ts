/**
 * Hook de Auto-Detecção de Erros para VideoSlots
 * Analisa automaticamente os slots e detecta problemas em tempo real
 */

import { useEffect } from 'react';
import { VideoSlot } from '@/types/videoManagement';
import { usePageDebug } from './usePageDebug';

interface UseAutoErrorDetectionProps {
  videoSlots: VideoSlot[];
  orderId: string;
  enabled: boolean; // Só detecta quando debug mode estiver ativo
}

export const useAutoErrorDetection = ({ videoSlots, orderId, enabled }: UseAutoErrorDetectionProps) => {
  const { addDetectedError, clearErrors } = usePageDebug();

  useEffect(() => {
    if (!enabled || videoSlots.length === 0) {
      return;
    }

    console.log('🔍 [AUTO-DETECT] Iniciando análise automática de erros...', {
      totalSlots: videoSlots.length,
      orderId
    });

    // Limpar erros anteriores
    clearErrors();

    // 1. DETECTAR URLs CORROMPIDAS
    videoSlots.forEach(slot => {
      if (slot.video_data?.url) {
        const url = slot.video_data.url;
        const hasCorruptedUrl = 
          url.includes('undefined') ||
          url.includes('null') ||
          !url.startsWith('http');
        
        if (hasCorruptedUrl) {
          addDetectedError({
            code: 'CORRUPTED_VIDEO_URL',
            description: `Slot ${slot.slot_position}: Vídeo com URL corrompida ou inválida`,
            solution: 'Usar Force Cleanup (ative no painel de debug) para remover este slot corrompido',
            severity: 'critical',
            sqlFix: `DELETE FROM pedido_videos WHERE id = '${slot.id}';`,
            data: {
              slotId: slot.id,
              slotPosition: slot.slot_position,
              videoId: slot.video_id,
              corruptedUrl: url,
              videoName: slot.video_data.nome
            }
          });
          
          console.error('❌ [AUTO-DETECT] URL corrompida detectada:', {
            slotId: slot.id,
            position: slot.slot_position,
            url
          });
        }
      }
    });

    // 2. DETECTAR FALTA DE VÍDEO BASE
    const videoSlotsFilled = videoSlots.filter(s => s.video_data);
    const baseVideos = videoSlotsFilled.filter(s => s.is_base_video);
    
    if (videoSlotsFilled.length > 0 && baseVideos.length === 0) {
      addDetectedError({
        code: 'NO_BASE_VIDEO',
        description: 'Nenhum vídeo definido como base (principal)',
        solution: 'Defina o Slot 1 como vídeo base ou use o botão "Definir como Principal" em qualquer slot',
        severity: 'high',
        sqlFix: `UPDATE pedido_videos SET is_base_video = true, is_active = true, selected_for_display = true WHERE pedido_id = '${orderId}' AND slot_position = 1;`,
        data: {
          totalVideos: videoSlotsFilled.length,
          baseVideosCount: baseVideos.length
        }
      });
      
      console.warn('⚠️ [AUTO-DETECT] Nenhum vídeo base encontrado:', {
        totalVideos: videoSlotsFilled.length
      });
    } else if (baseVideos.length > 1) {
      addDetectedError({
        code: 'MULTIPLE_BASE_VIDEOS',
        description: `Múltiplos vídeos marcados como base (${baseVideos.length})`,
        solution: 'Apenas um vídeo deve ser base. Escolha qual manter e remova os outros',
        severity: 'high',
        data: {
          baseVideos: baseVideos.map(v => ({
            slotId: v.id,
            position: v.slot_position,
            videoName: v.video_data?.nome
          }))
        }
      });
      
      console.error('❌ [AUTO-DETECT] Múltiplos vídeos base:', baseVideos.length);
    }

    // 3. DETECTAR VÍDEOS ATIVOS SEM APROVAÇÃO
    videoSlots.forEach(slot => {
      if (slot.is_active && slot.approval_status !== 'approved' && slot.video_data) {
        addDetectedError({
          code: 'ACTIVE_WITHOUT_APPROVAL',
          description: `Slot ${slot.slot_position}: Vídeo ativo mas não aprovado (status: ${slot.approval_status})`,
          solution: 'Aprovar vídeo ou desativar slot',
          severity: 'medium',
          sqlFix: `UPDATE pedido_videos SET approval_status = 'approved' WHERE id = '${slot.id}';`,
          data: {
            slotId: slot.id,
            slotPosition: slot.slot_position,
            approvalStatus: slot.approval_status,
            videoName: slot.video_data.nome
          }
        });
        
        console.warn('⚠️ [AUTO-DETECT] Vídeo ativo sem aprovação:', {
          slotId: slot.id,
          position: slot.slot_position,
          status: slot.approval_status
        });
      }
    });

    // 4. DETECTAR VÍDEO REFERENCIANDO ID INEXISTENTE
    videoSlots.forEach(slot => {
      if (slot.video_id && !slot.video_data) {
        addDetectedError({
          code: 'MISSING_VIDEO_DATA',
          description: `Slot ${slot.slot_position}: Referencia video_id mas o vídeo não existe na tabela videos`,
          solution: 'Remover este slot (Force Cleanup) ou recriar o registro do vídeo',
          severity: 'critical',
          sqlFix: `DELETE FROM pedido_videos WHERE id = '${slot.id}';`,
          data: {
            slotId: slot.id,
            slotPosition: slot.slot_position,
            missingVideoId: slot.video_id
          }
        });
        
        console.error('❌ [AUTO-DETECT] Vídeo inexistente referenciado:', {
          slotId: slot.id,
          position: slot.slot_position,
          videoId: slot.video_id
        });
      }
    });

    // 5. DETECTAR CONFLITOS DE AGENDAMENTO (simplificado)
    const activeScheduledVideos = videoSlots.filter(s => 
      s.is_active && 
      s.schedule_rules && 
      s.schedule_rules.length > 0 &&
      s.schedule_rules.some(r => r.is_active)
    );

    if (activeScheduledVideos.length > 1) {
      // Verificar sobreposição de horários (simplificado)
      addDetectedError({
        code: 'POTENTIAL_SCHEDULE_CONFLICTS',
        description: `${activeScheduledVideos.length} vídeos com agendamento ativo - possível conflito de horários`,
        solution: 'Revisar regras de agendamento e garantir que não há sobreposição',
        severity: 'medium',
        data: {
          conflictingVideos: activeScheduledVideos.map(v => ({
            slotId: v.id,
            position: v.slot_position,
            videoName: v.video_data?.nome,
            rulesCount: v.schedule_rules?.length || 0
          }))
        }
      });
      
      console.warn('⚠️ [AUTO-DETECT] Possíveis conflitos de agendamento:', {
        count: activeScheduledVideos.length
      });
    }

    // 6. DETECTAR SLOTS VAZIOS EM SEQUÊNCIA
    const emptySlots = videoSlots.filter(s => !s.video_data);
    if (emptySlots.length > 2) {
      addDetectedError({
        code: 'MANY_EMPTY_SLOTS',
        description: `${emptySlots.length} slots vazios encontrados`,
        solution: 'Informativo: Você pode fazer upload de mais vídeos nestes slots',
        severity: 'low',
        data: {
          emptySlotPositions: emptySlots.map(s => s.slot_position)
        }
      });
    }

    console.log('✅ [AUTO-DETECT] Análise concluída');

  }, [videoSlots, orderId, enabled, addDetectedError, clearErrors]);
};
