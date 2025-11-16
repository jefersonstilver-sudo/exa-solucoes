interface PlayheadProps {
  currentTime: number;
  pixelsPerSecond: number;
}

export const Playhead = ({ currentTime, pixelsPerSecond }: PlayheadProps) => {
  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-primary z-50 pointer-events-none"
      style={{ left: currentTime * pixelsPerSecond }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
    </div>
  );
};
