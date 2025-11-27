import { memo } from 'react';

interface TimelineRulerPremiumProps {
  pixelsPerHour: number;
  startHour?: number;
  endHour?: number;
}

export const TimelineRulerPremium = memo(({ 
  pixelsPerHour, 
  startHour = 0, 
  endHour = 24 
}: TimelineRulerPremiumProps) => {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div className="relative h-12 border-b border-border/20 bg-background/60 backdrop-blur-sm">
      {hours.map((hour) => {
        const position = (hour - startHour) * pixelsPerHour;
        
        return (
          <div key={hour} className="absolute top-0 h-full" style={{ left: position }}>
            {/* Hour line */}
            <div className="h-full w-px bg-border/40" />
            
            {/* Hour label */}
            <div className="absolute -left-4 top-1 text-xs font-medium text-muted-foreground">
              {hour.toString().padStart(2, '0')}:00
            </div>
            
            {/* 15-minute ticks */}
            {[0.25, 0.5, 0.75].map((fraction) => {
              const tickPosition = position + fraction * pixelsPerHour;
              return (
                <div
                  key={fraction}
                  className="absolute top-0 h-2 w-px bg-border/20"
                  style={{ left: fraction * pixelsPerHour }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

TimelineRulerPremium.displayName = 'TimelineRulerPremium';
