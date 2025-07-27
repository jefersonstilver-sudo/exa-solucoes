import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Video, Calendar } from 'lucide-react';
import { DAYS_OF_WEEK } from '@/types/campaignScheduling';
import { CampaignWithSchedule } from '@/hooks/useCampaignWithSchedule';

interface CampaignScheduleDetailsProps {
  campaign: CampaignWithSchedule;
  isExpanded?: boolean;
}

export const CampaignScheduleDetails: React.FC<CampaignScheduleDetailsProps> = ({
  campaign,
  isExpanded = false
}) => {
  if (!campaign.video_schedules || campaign.video_schedules.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhum agendamento configurado
      </div>
    );
  }

  // Get unique days from all schedule rules
  const allDays = new Set<number>();
  const timeRanges = new Set<string>();
  
  campaign.video_schedules.forEach(schedule => {
    schedule.schedule_rules.forEach(rule => {
      rule.days_of_week.forEach(day => allDays.add(day));
      timeRanges.add(`${rule.start_time} - ${rule.end_time}`);
    });
  });

  const dayNames = Array.from(allDays)
    .sort()
    .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.short || '')
    .filter(Boolean);

  const timeRangesList = Array.from(timeRanges);

  if (!isExpanded) {
    // Compact view - summary
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Video className="h-4 w-4" />
          <span>{campaign.video_schedules.length} vídeo(s)</span>
          
          {dayNames.length > 0 && (
            <>
              <Calendar className="h-4 w-4 ml-2" />
              <span>{dayNames.join('-')}</span>
            </>
          )}
          
          {timeRangesList.length > 0 && (
            <>
              <Clock className="h-4 w-4 ml-2" />
              <span>{timeRangesList[0]}</span>
              {timeRangesList.length > 1 && <span>+{timeRangesList.length - 1}</span>}
            </>
          )}
        </div>
      </div>
    );
  }

  // Expanded view - detailed
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Vídeos Agendados</h4>
        {campaign.video_schedules.map((schedule, index) => (
          <div key={schedule.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="font-medium text-sm">{schedule.video_data?.nome}</span>
              <Badge variant="outline" className="text-xs">
                Posição {schedule.slot_position}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Prioridade {schedule.priority}
              </Badge>
            </div>
            
            {schedule.video_data?.duracao && (
              <div className="text-xs text-muted-foreground">
                Duração: {Math.floor(schedule.video_data.duracao / 60)}:{(schedule.video_data.duracao % 60).toString().padStart(2, '0')}
              </div>
            )}

            {schedule.schedule_rules.map((rule, ruleIndex) => (
              <div key={rule.id} className="ml-6 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="h-3 w-3" />
                  <div className="flex gap-1">
                    {rule.days_of_week.map(dayValue => {
                      const day = DAYS_OF_WEEK.find(d => d.value === dayValue);
                      return (
                        <Badge key={dayValue} variant="outline" className="text-xs">
                          {day?.short}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{rule.start_time} - {rule.end_time}</span>
                  {!rule.is_active && (
                    <Badge variant="destructive" className="text-xs">
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};