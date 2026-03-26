
import React, { useRef, useCallback, useState } from 'react';

interface TrimmerTimelineProps {
  duration: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  maxDuration: number;
  thumbnails: string[];
  onStartChange: (time: number) => void;
  onSeek: (time: number) => void;
}

export const TrimmerTimeline: React.FC<TrimmerTimelineProps> = ({
  duration,
  startTime,
  endTime,
  currentTime,
  maxDuration,
  thumbnails,
  onStartChange,
  onSeek,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartTimeRef = useRef(0);

  const getTimeFromX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * duration;
  }, [duration]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartTimeRef.current = startTime;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [startTime]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const dx = e.clientX - dragStartX.current;
    const dt = (dx / rect.width) * duration;
    const windowSize = Math.min(maxDuration, duration);
    let newStart = dragStartTimeRef.current + dt;
    newStart = Math.max(0, Math.min(newStart, duration - windowSize));
    onStartChange(newStart);
  }, [isDragging, duration, maxDuration, onStartChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    const time = getTimeFromX(e.clientX);
    // If clicking inside the window, seek; if outside, move window there
    if (time >= startTime && time <= endTime) {
      onSeek(time);
    } else {
      // Center the window on click position
      const windowSize = Math.min(maxDuration, duration);
      const newStart = Math.max(0, Math.min(time - windowSize / 2, duration - windowSize));
      onStartChange(newStart);
    }
  }, [isDragging, getTimeFromX, startTime, endTime, maxDuration, duration, onStartChange, onSeek]);

  const startPct = (startTime / duration) * 100;
  const endPct = (endTime / duration) * 100;
  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const windowPct = endPct - startPct;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-3">
      {/* Time display */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-mono text-slate-400 tabular-nums">{formatTime(startTime)}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-slate-800 tabular-nums tracking-tight">
            {maxDuration}s
          </span>
          <span className="text-xs text-slate-400">fixo</span>
        </div>
        <span className="text-xs font-mono text-slate-400 tabular-nums">{formatTime(endTime)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="relative w-full rounded-2xl overflow-hidden select-none touch-none"
        style={{ height: '88px' }}
        onClick={handleTrackClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Thumbnails */}
        <div className="absolute inset-0 flex">
          {thumbnails.map((thumb, i) => (
            <div key={i} className="flex-1 h-full overflow-hidden">
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-slate-200" />
              )}
            </div>
          ))}
          {thumbnails.length === 0 && (
            <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse" />
          )}
        </div>

        {/* Dimmed areas outside selection */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-black/65 pointer-events-none"
          style={{ width: `${startPct}%`, transition: isDragging ? 'none' : 'width 0.15s ease-out' }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/65 pointer-events-none"
          style={{ width: `${100 - endPct}%`, transition: isDragging ? 'none' : 'width 0.15s ease-out' }}
        />

        {/* Selected region — the single draggable block */}
        <div
          className={`absolute top-0 bottom-0 border-y-[4px] border-[#C7141A] ${
            isDragging ? 'cursor-grabbing shadow-[0_0_24px_rgba(199,20,26,0.35)]' : 'cursor-grab'
          }`}
          style={{
            left: `${startPct}%`,
            width: `${windowPct}%`,
            transition: isDragging ? 'none' : 'left 0.15s ease-out, width 0.15s ease-out',
          }}
          onPointerDown={handlePointerDown}
        >
          {/* Left edge bar */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-[#C7141A] rounded-l-xl flex items-center justify-center">
            <div className="w-[3px] h-8 bg-white/90 rounded-full" />
          </div>

          {/* Right edge bar */}
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-[#C7141A] rounded-r-xl flex items-center justify-center">
            <div className="w-[3px] h-8 bg-white/90 rounded-full" />
          </div>

          {/* Center duration badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm">
              <span className="text-[11px] font-bold text-white tabular-nums tracking-wide">
                {maxDuration}s
              </span>
            </div>
          </div>
        </div>

        {/* Playhead */}
        {currentTime >= startTime && currentTime <= endTime && (
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-white pointer-events-none"
            style={{
              left: `${currentPct}%`,
              boxShadow: '0 0 8px rgba(0,0,0,0.7), 0 0 2px rgba(255,255,255,0.5)',
              transition: isDragging ? 'none' : 'left 0.05s linear',
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-white" />
          </div>
        )}
      </div>

      {/* Total duration label */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[11px] text-slate-400">
          Arraste para escolher o trecho
        </span>
        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
          Total: {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
