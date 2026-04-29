import React from 'react';

interface SimpleTrimmerSliderProps {
  duration: number;
  startTime: number;
  windowSize: number;
  onStartChange: (time: number) => void;
}

const formatTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Slider simples e estável para escolher o início do trecho no mobile.
 * Evita timeline com zoom/drag/thumbnails que travam o Safari/iOS.
 */
export const SimpleTrimmerSlider: React.FC<SimpleTrimmerSliderProps> = ({
  duration,
  startTime,
  windowSize,
  onStartChange,
}) => {
  const maxStart = Math.max(0, duration - windowSize);
  const endTime = Math.min(duration, startTime + windowSize);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-slate-600 tabular-nums">
        <span>Início: {formatTime(startTime)}</span>
        <span className="font-semibold text-[#C7141A]">{Math.round(windowSize)}s</span>
        <span>Fim: {formatTime(endTime)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={maxStart}
        step={0.1}
        value={startTime}
        onChange={(e) => onStartChange(parseFloat(e.target.value))}
        className="w-full h-3 rounded-full appearance-none bg-slate-200 accent-[#C7141A] touch-none"
        aria-label="Selecione o início do trecho"
      />

      <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
        <span>0:00</span>
        <span>Total: {formatTime(duration)}</span>
      </div>
    </div>
  );
};
