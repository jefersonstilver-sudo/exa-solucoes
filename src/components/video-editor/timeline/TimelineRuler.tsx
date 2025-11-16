interface TimelineRulerProps {
  duration: number;
  pixelsPerSecond: number;
}

export const TimelineRuler = ({ duration, pixelsPerSecond }: TimelineRulerProps) => {
  const markers: number[] = [];
  const step = 1; // 1 second intervals
  
  for (let i = 0; i <= duration; i += step) {
    markers.push(i);
  }

  return (
    <div className="h-12 border-b bg-muted/50 relative">
      {markers.map((time) => (
        <div
          key={time}
          className="absolute top-0 h-full border-l border-border/50"
          style={{ left: time * pixelsPerSecond }}
        >
          <span className="absolute top-2 left-2 text-xs text-muted-foreground">
            {time}s
          </span>
        </div>
      ))}
    </div>
  );
};
