import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Home, Calendar } from 'lucide-react';

interface VideoStatusBadgeProps {
  isBaseVideo: boolean;
  hasScheduleRules: boolean;
  scheduleRuleCount?: number;
}

export const VideoStatusBadge: React.FC<VideoStatusBadgeProps> = ({
  isBaseVideo,
  hasScheduleRules,
  scheduleRuleCount = 0
}) => {
  if (isBaseVideo) {
    return (
      <Badge 
        variant="default" 
        className="bg-green-600 hover:bg-green-700 text-white font-medium gap-1"
      >
        <Home className="h-3 w-3" />
        Vídeo Principal - Sempre ativo
      </Badge>
    );
  }

  if (hasScheduleRules) {
    const label = scheduleRuleCount > 1 
      ? `Agendado - ${scheduleRuleCount} regras`
      : 'Agendado';
      
    return (
      <Badge 
        variant="default"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1"
      >
        <Calendar className="h-3 w-3" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-medium text-muted-foreground">
      Sem agendamento
    </Badge>
  );
};