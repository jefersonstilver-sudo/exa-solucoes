
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TrimmerTimelineProps {
  duration: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  maxDuration: number;
  thumbnails: string[];
  onStartChange: (time: number) => void;
  onEndChange: (time: number) => void;
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
  onEndChange,
  onSeek,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | 'region' | null>(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const dragEndTime = useRef(0);

  const getTimeFromX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * duration;
  }, [duration]);

  const handlePointerDown = useCallback((e: React.PointerEvent, type: 'start' | 'end' | 'region') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    dragStartX.current = e.clientX;
    dragStartTime.current = startTime;
    dragEndTime.current = endTime;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [startTime, endTime]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();

    const time = getTimeFromX(e.clientX);

    if (dragging === 'start') {
      onStartChange(time);
    } else if (dragging === 'end') {
      onEndChange(time);
    } else if (dragging === 'region') {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const dx = e.clientX - dragStartX.current;
      const dt = (dx / rect.width) * duration;
      const regionLen = dragEndTime.current - dragStartTime.current;
      let newStart = dragStartTime.current + dt;
      newStart = Math.max(0, Math.min(newStart, duration - regionLen));
      onStartChange(newStart);
      onEndChange(newStart + regionLen);
    }
  }, [dragging, getTimeFromX, duration, onStartChange, onEndChange]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return;
    const time = getTimeFromX(e.clientX);
    if (time >= startTime && time <= endTime) {
      onSeek(time);
    }
  }, [dragging, getTimeFromX, startTime, endTime, onSeek]);

  const startPct = (startTime / duration) * 100;
  const endPct = (endTime / duration) * 100;
  const currentPct = (currentTime / duration) * 100;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-2">
      {/* Time display */}
      <div className="flex justify-between text-xs text-slate-500 font-mono px-1">
        <span>{formatTime(startTime)}</span>
        <span className="text-slate-700 font-semibold">
          {formatTime(endTime - startTime)} / {formatTime(maxDuration)}
        </span>
        <span>{formatTime(endTime)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden cursor-pointer select-none touch-none"
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
          className="absolute top-0 bottom-0 left-0 bg-black/60 transition-all"
          style={{ width: `${startPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/60 transition-all"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Selected region border */}
        <div
          className="absolute top-0 bottom-0 border-y-[3px] border-[hsl(var(--primary))] transition-all"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'region')}
        />

        {/* Start handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-5 sm:w-6 cursor-ew-resize z-10 flex items-center justify-center",
            "bg-[hsl(var(--primary))] rounded-l-md transition-shadow",
            dragging === 'start' && "shadow-lg shadow-primary/40"
          )}
          style={{ left: `calc(${startPct}% - 10px)` }}
          onPointerDown={(e) => handlePointerDown(e, 'start')}
        >
          <div className="w-0.5 h-6 sm:h-8 bg-white/80 rounded-full" />
        </div>

        {/* End handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-5 sm:w-6 cursor-ew-resize z-10 flex items-center justify-center",
            "bg-[hsl(var(--primary))] rounded-r-md transition-shadow",
            dragging === 'end' && "shadow-lg shadow-primary/40"
          )}
          style={{ left: `calc(${endPct}% - 10px)` }}
          onPointerDown={(e) => handlePointerDown(e, 'end')}
        >
          <div className="w-0.5 h-6 sm:h-8 bg-white/80 rounded-full" />
        </div>

        {/* Playhead */}
        {currentTime >= startTime && currentTime <= endTime && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md z-20 pointer-events-none"
            style={{ left: `${currentPct}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow" />
          </div>
        )}
      </div>

      {/* Total duration label */}
      <div className="flex justify-end">
        <span className="text-[10px] text-slate-400">
          Duração total: {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
