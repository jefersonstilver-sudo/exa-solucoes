interface TimelineRulerProps {
  duration: number;
  pixelsPerSecond: number;
}

export const TimelineRuler = ({ duration, pixelsPerSecond }: TimelineRulerProps) => {
  const markers: number[] = [];
  const step = Math.max(1, Math.floor(10 / pixelsPerSecond)); // Adaptive step based on zoom
  
  for (let i = 0; i <= duration; i += step) {
    markers.push(i);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  return (
    <div className="h-10 border-b bg-background/95 relative flex items-end">
      {markers.map((time) => (
        <div
          key={time}
          className="absolute bottom-0 h-full flex flex-col justify-end"
          style={{ left: time * pixelsPerSecond }}
        >
          {/* Tick mark */}
          <div className="w-px h-3 bg-border" />
          {/* Time label */}
          <span className="absolute bottom-full mb-1 text-xs text-muted-foreground whitespace-nowrap transform -translate-x-1/2">
            {formatTime(time)}
          </span>
        </div>
      ))}
      {/* Minor ticks every second */}
      {Array.from({ length: Math.floor(duration) + 1 }).map((_, i) => (
        <div
          key={`minor-${i}`}
          className="absolute bottom-0 w-px h-1.5 bg-border/50"
          style={{ left: i * pixelsPerSecond }}
        />
      ))}
    </div>
  );
};
