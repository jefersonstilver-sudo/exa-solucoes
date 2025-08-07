import { supabase } from '@/integrations/supabase/client';

export interface ScheduleConflict {
  conflictingVideoName: string;
  conflictingDay: number;
  conflictingStartTime: string;
  conflictingEndTime: string;
  newStartTime: string;
  newEndTime: string;
}

export interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// Converter horário "HH:MM" para minutos
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Verificar se dois horários se sobrepõem
const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return (start1Min < end2Min) && (end1Min > start2Min);
};

// Converter número do dia para nome
const getDayName = (dayNumber: number): string => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayNumber] || `Dia ${dayNumber}`;
};

export const validateScheduleConflicts = async (
  orderId: string, 
  newScheduleRules: ScheduleRule[]
): Promise<ScheduleConflict[]> => {
  try {
    // Buscar vídeos aprovados e selecionados para exibição
    const { data: pedidoVideos, error } = await supabase
      .from('pedido_videos')
      .select(`
        id,
        video_id,
        videos!inner (
          id,
          nome
        )
      `)
      .eq('pedido_id', orderId)
      .eq('approval_status', 'approved')
      .eq('selected_for_display', true);

    if (error) {
      console.error('Erro ao buscar vídeos do pedido:', error);
      return [];
    }

    if (!pedidoVideos || pedidoVideos.length === 0) {
      return []; // Nenhum vídeo em exibição, sem conflitos
    }

    const conflicts: ScheduleConflict[] = [];

    // Para cada vídeo em exibição, buscar suas regras de agendamento
    for (const pedidoVideo of pedidoVideos) {
      // Buscar campanhas avançadas associadas ao pedido
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns_advanced')
        .select('id')
        .eq('pedido_id', orderId);

      if (campaignError) {
        console.error('Erro ao buscar campanhas:', campaignError);
        continue;
      }

      if (!campaigns || campaigns.length === 0) {
        continue;
      }

      // Para cada campanha, buscar regras de agendamento
      for (const campaign of campaigns) {
        const { data: schedules, error: scheduleError } = await supabase
          .from('campaign_video_schedules')
          .select('id')
          .eq('campaign_id', campaign.id)
          .eq('video_id', pedidoVideo.video_id);

        if (scheduleError) {
          console.error('Erro ao buscar schedules:', scheduleError);
          continue;
        }

        if (!schedules || schedules.length === 0) {
          continue;
        }

        // Para cada schedule, buscar regras
        for (const schedule of schedules) {
          const { data: rules, error: rulesError } = await supabase
            .from('campaign_schedule_rules')
            .select('days_of_week, start_time, end_time, is_active')
            .eq('campaign_video_schedule_id', schedule.id)
            .eq('is_active', true);

          if (rulesError) {
            console.error('Erro ao buscar regras:', rulesError);
            continue;
          }

          if (!rules || rules.length === 0) {
            continue;
          }

          // Verificar conflitos com as novas regras
          for (const existingRule of rules) {
            for (const newRule of newScheduleRules) {
              if (!newRule.is_active) continue;

              // Verificar se há dias em comum
              const commonDays = newRule.days_of_week.filter(day => 
                existingRule.days_of_week.includes(day)
              );

              // Para cada dia em comum, verificar sobreposição de horários
              for (const day of commonDays) {
                if (hasTimeOverlap(
                  newRule.start_time,
                  newRule.end_time,
                  existingRule.start_time,
                  existingRule.end_time
                )) {
                  conflicts.push({
                    conflictingVideoName: pedidoVideo.videos?.nome || 'Vídeo sem nome',
                    conflictingDay: day,
                    conflictingStartTime: existingRule.start_time,
                    conflictingEndTime: existingRule.end_time,
                    newStartTime: newRule.start_time,
                    newEndTime: newRule.end_time
                  });
                }
              }
            }
          }
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error('Erro na validação de conflitos:', error);
    return [];
  }
};

// Sugerir horários livres para um dia específico
export const suggestAvailableTimeSlots = (
  conflicts: ScheduleConflict[],
  targetDay: number
): string[] => {
  const suggestions: string[] = [];
  
  // Buscar conflitos apenas para o dia alvo
  const dayConflicts = conflicts.filter(c => c.conflictingDay === targetDay);
  
  if (dayConflicts.length === 0) {
    return [`${getDayName(targetDay)} está completamente livre`];
  }
  
  // Lógica simples para sugerir horários alternativos
  const conflictingTimes = dayConflicts.map(c => ({
    start: timeToMinutes(c.conflictingStartTime),
    end: timeToMinutes(c.conflictingEndTime)
  }));
  
  // Sugerir antes do primeiro conflito
  const firstConflict = Math.min(...conflictingTimes.map(c => c.start));
  if (firstConflict > 60) { // Se há pelo menos 1 hora antes
    const endTime = Math.floor(firstConflict / 60);
    suggestions.push(`00:00 às ${endTime.toString().padStart(2, '0')}:00`);
  }
  
  // Sugerir depois do último conflito
  const lastConflict = Math.max(...conflictingTimes.map(c => c.end));
  if (lastConflict < 1380) { // Se há pelo menos 1 hora depois (antes de 23:00)
    const startTime = Math.ceil(lastConflict / 60);
    suggestions.push(`${startTime.toString().padStart(2, '0')}:00 às 23:59`);
  }
  
  return suggestions.length > 0 ? suggestions : ['Nenhum horário livre encontrado'];
};

export const formatConflictMessage = (conflicts: ScheduleConflict[]): string => {
  if (conflicts.length === 0) return '';
  
  let message = '❌ CONFLITO DE HORÁRIO DETECTADO\n\n';
  
  // Agrupar conflitos por vídeo
  const groupedConflicts = conflicts.reduce((acc, conflict) => {
    const key = conflict.conflictingVideoName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(conflict);
    return acc;
  }, {} as Record<string, ScheduleConflict[]>);
  
  Object.entries(groupedConflicts).forEach(([videoName, videoConflicts]) => {
    message += `O vídeo "${videoName}" já está em exibição:\n`;
    
    videoConflicts.forEach(conflict => {
      message += `• ${getDayName(conflict.conflictingDay)} das ${conflict.conflictingStartTime} às ${conflict.conflictingEndTime}\n`;
    });
    
    message += '\n';
  });
  
  // Sugerir horários alternativos
  const uniqueDays = [...new Set(conflicts.map(c => c.conflictingDay))];
  
  if (uniqueDays.length > 0) {
    message += 'Sugestões de horários livres:\n';
    
    uniqueDays.forEach(day => {
      const suggestions = suggestAvailableTimeSlots(conflicts, day);
      message += `${getDayName(day)}: ${suggestions.join(', ')}\n`;
    });
  }
  
  return message;
};