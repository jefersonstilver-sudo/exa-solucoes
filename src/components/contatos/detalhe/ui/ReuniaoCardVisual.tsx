import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, MapPin, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReuniaoCardVisualProps {
  id: string;
  title: string;
  date: Date;
  duration?: string;
  location?: string;
  meetingUrl?: string;
  participants?: number;
  status: 'upcoming' | 'past' | 'today';
  eventType: 'reuniao' | 'visita' | 'ligacao' | 'follow_up' | 'outro';
  onAction?: () => void;
  actionLabel?: string;
}

export const ReuniaoCardVisual: React.FC<ReuniaoCardVisualProps> = ({
  title,
  date,
  duration = '1h',
  location,
  meetingUrl,
  participants = 0,
  status,
  eventType,
  onAction,
  actionLabel = 'Detalhes'
}) => {
  const day = format(date, 'dd');
  const month = format(date, 'MMM', { locale: ptBR }).toUpperCase();
  const time = format(date, 'HH:mm');

  const getTypeIcon = () => {
    switch (eventType) {
      case 'reuniao':
        return meetingUrl ? 'Google Meet' : 'Videoconferência';
      case 'visita':
        return location || 'Presencial';
      case 'ligacao':
        return 'Ligação';
      default:
        return 'Evento';
    }
  };

  const isPast = status === 'past';

  return (
    <Card className={cn(
      "border border-gray-100 overflow-hidden transition-all hover:shadow-md",
      isPast && "opacity-70"
    )}>
      <div className="flex">
        {/* Date Column */}
        <div className={cn(
          "w-16 flex-shrink-0 flex flex-col items-center justify-center py-3 border-r",
          status === 'today' ? "bg-[#9C1E1E] text-white" : "bg-gray-50 text-gray-700"
        )}>
          <span className="text-[10px] font-semibold uppercase tracking-wide">
            {month}
          </span>
          <span className="text-2xl font-bold leading-none mt-0.5">
            {day}
          </span>
          <span className="text-xs mt-1 font-medium">
            {time}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-sm text-foreground line-clamp-1">
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              {meetingUrl ? (
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  {getTypeIcon()}
                </span>
              ) : location ? (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              ) : (
                <span>{getTypeIcon()}</span>
              )}
              <span>•</span>
              <span>{duration}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {participants > 0 && (
                <div className="flex items-center -space-x-1.5">
                  {Array.from({ length: Math.min(participants, 3) }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                    >
                      <Users className="w-3 h-3 text-gray-500" />
                    </div>
                  ))}
                  {participants > 3 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      +{participants - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <Button 
              size="sm" 
              variant={status === 'today' && meetingUrl ? 'default' : 'outline'}
              className={cn(
                "h-7 text-xs",
                status === 'today' && meetingUrl && "bg-[#9C1E1E] hover:bg-[#7d1818]"
              )}
              onClick={onAction}
            >
              {status === 'today' && meetingUrl ? (
                <>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Entrar
                </>
              ) : (
                actionLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReuniaoCardVisual;
