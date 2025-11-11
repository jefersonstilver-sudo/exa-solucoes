import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseBuildingScheduleMonitorProps {
  buildingId: string;
  onScheduleChange?: () => void;
  intervalMinutes?: number;
  enabled?: boolean;
}

interface ScheduleRule {
  id: string;
  video_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  campaign: {
    id: string;
    video: {
      id: string;
      pedido_videos: {
        id: string;
        is_active: boolean;
        selected_for_display: boolean;
      }[];
    };
  };
}

export const useBuildingScheduleMonitor = ({
  buildingId,
  onScheduleChange,
  intervalMinutes = 1,
  enabled = true
}: UseBuildingScheduleMonitorProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<string>('');
  const isCheckingRef = useRef(false);

  // Função para obter horário de Brasília
  const getBrasiliaTime = useCallback(() => {
    const now = new Date();
    const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    return brasiliaTime;
  }, []);

  // Função para converter "HH:MM" em minutos desde meia-noite
  const timeToMinutes = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);

  // Função para verificar se um vídeo deveria estar ativo agora
  const shouldBeActive = useCallback((rule: ScheduleRule, currentTime: Date): boolean => {
    const currentDay = currentTime.getDay(); // 0 = domingo, 1 = segunda, etc
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    // Verifica se hoje está nos dias programados
    if (!rule.days_of_week.includes(currentDay)) {
      return false;
    }

    const startMinutes = timeToMinutes(rule.start_time);
    const endMinutes = timeToMinutes(rule.end_time);

    // Verifica se está dentro do horário
    if (endMinutes > startMinutes) {
      // Horário normal (ex: 08:00 - 18:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Horário que cruza meia-noite (ex: 22:00 - 02:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }, [timeToMinutes]);

  // Função principal de verificação
  const checkScheduleChanges = useCallback(async () => {
    if (!buildingId || !enabled || isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      const currentTime = getBrasiliaTime();
      const currentTimeStr = currentTime.toTimeString().slice(0, 5); // "HH:MM"

      console.log('🕐 [SCHEDULE_MONITOR] Verificando agendamentos:', {
        buildingId: buildingId.slice(0, 8) + '...',
        currentTime: currentTimeStr,
        day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][currentTime.getDay()]
      });

      // Buscar todos os schedule rules ativos do prédio
      const { data: scheduleRules, error } = await supabase
        .from('campaign_schedule_rules')
        .select(`
          id,
          video_id,
          days_of_week,
          start_time,
          end_time,
          is_active,
          campaign:advanced_campaigns!inner (
            id,
            video:videos!inner (
              id,
              pedido_videos!inner (
                id,
                is_active,
                selected_for_display,
                pedido:pedidos!inner (
                  predio_id
                )
              )
            )
          )
        `)
        .eq('is_active', true)
        .eq('campaign.video.pedido_videos.pedido.predio_id', buildingId) as { data: ScheduleRule[] | null, error: any };

      if (error) {
        console.error('❌ [SCHEDULE_MONITOR] Erro ao buscar regras:', error);
        return;
      }

      if (!scheduleRules || scheduleRules.length === 0) {
        console.log('📝 [SCHEDULE_MONITOR] Nenhuma regra de agendamento encontrada');
        return;
      }

      console.log('📋 [SCHEDULE_MONITOR] Regras encontradas:', scheduleRules.length);

      // Verificar cada regra
      let hasChanges = false;

      for (const rule of scheduleRules) {
        const shouldActive = shouldBeActive(rule, currentTime);
        const isCurrentlySelected = rule.campaign.video.pedido_videos[0]?.selected_for_display || false;

        console.log('🔍 [SCHEDULE_MONITOR] Analisando vídeo:', {
          videoId: rule.video_id.slice(0, 8) + '...',
          shouldActive,
          isCurrentlySelected,
          startTime: rule.start_time,
          endTime: rule.end_time,
          daysOfWeek: rule.days_of_week
        });

        // Se o estado atual está diferente do esperado
        if (shouldActive !== isCurrentlySelected) {
          console.log('⚠️ [SCHEDULE_MONITOR] Mudança detectada!', {
            videoId: rule.video_id.slice(0, 8) + '...',
            shouldActive,
            isCurrentlySelected
          });
          hasChanges = true;
          break; // Já detectou mudança, não precisa verificar mais
        }
      }

      // Se detectou mudanças, chama callback
      if (hasChanges && onScheduleChange) {
        const changeKey = `${currentTimeStr}-${hasChanges}`;
        
        // Evita chamar múltiplas vezes no mesmo minuto
        if (lastCheckRef.current !== changeKey) {
          console.log('🔄 [SCHEDULE_MONITOR] Executando atualização de playlist');
          lastCheckRef.current = changeKey;
          onScheduleChange();
        }
      } else if (!hasChanges) {
        console.log('✅ [SCHEDULE_MONITOR] Nenhuma mudança necessária');
      }

    } catch (error) {
      console.error('❌ [SCHEDULE_MONITOR] Erro na verificação:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [buildingId, enabled, getBrasiliaTime, shouldBeActive, onScheduleChange]);

  // Configurar intervalo de verificação
  useEffect(() => {
    if (!enabled || !buildingId) {
      console.log('🛑 [SCHEDULE_MONITOR] Monitor desabilitado ou sem buildingId');
      return;
    }

    console.log('🚀 [SCHEDULE_MONITOR] Iniciando monitor:', {
      buildingId: buildingId.slice(0, 8) + '...',
      intervalMinutes,
      enabled
    });

    // Primeira verificação após 10 segundos
    const initialTimeout = setTimeout(() => {
      checkScheduleChanges();
    }, 10000);

    // Verificações periódicas
    intervalRef.current = setInterval(() => {
      checkScheduleChanges();
    }, intervalMinutes * 60 * 1000);

    return () => {
      console.log('🛑 [SCHEDULE_MONITOR] Monitor encerrado');
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [buildingId, enabled, intervalMinutes, checkScheduleChanges]);

  return {
    forceCheck: checkScheduleChanges
  };
};
