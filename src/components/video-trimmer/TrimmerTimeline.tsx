
import React, { useRef, useCallback, useState } from 'react';
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
      // When dragging start handle, clamp so selection never exceeds maxDuration
      const newStart = Math.max(0, Math.min(time, endTime - 1));
      // If the new range would be > maxDuration, push end forward
      if (endTime - newStart > maxDuration) {
        onStartChange(newStart);
        onEndChange(Math.min(newStart + maxDuration, duration));
      } else {
        onStartChange(newStart);
      }
    } else if (dragging === 'end') {
      const newEnd = Math.min(time, duration);
      if (newEnd - startTime > maxDuration) {
        onEndChange(newEnd);
        onStartChange(Math.max(newEnd - maxDuration, 0));
      } else if (newEnd > startTime + 0.5) {
        onEndChange(newEnd);
      }
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
  }, [dragging, getTimeFromX, duration, startTime, endTime, maxDuration, onStartChange, onEndChange]);

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
    <div className="w-full space-y-2.5">
      {/* Time display */}
      <div className="flex justify-between items-center text-xs font-mono px-1">
        <span className="text-slate-500">{formatTime(startTime)}</span>
        <span className="text-slate-800 font-bold text-sm tracking-tight">
          {formatTime(endTime - startTime)} / {formatTime(maxDuration)}
        </span>
        <span className="text-slate-500">{formatTime(endTime)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="relative w-full rounded-xl overflow-hidden cursor-pointer select-none touch-none"
        style={{ height: '72px' }}
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
          className="absolute top-0 bottom-0 left-0 bg-black/60 transition-[width] duration-75"
          style={{ width: `${startPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/60 transition-[width] duration-75"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Selected region border */}
        <div
          className="absolute top-0 bottom-0 border-y-[3px] border-[#C7141A] cursor-grab active:cursor-grabbing transition-[left,width] duration-75"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'region')}
        />

        {/* Start handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-7 cursor-ew-resize z-10 flex items-center justify-center",
            "bg-[#C7141A] rounded-l-lg transition-shadow",
            dragging === 'start' && "shadow-[0_0_16px_rgba(199,20,26,0.5)]"
          )}
          style={{ left: `calc(${startPct}% - 14px)` }}
          onPointerDown={(e) => handlePointerDown(e, 'start')}
        >
          <div className="w-[3px] h-8 bg-white/90 rounded-full" />
        </div>

        {/* End handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-7 cursor-ew-resize z-10 flex items-center justify-center",
            "bg-[#C7141A] rounded-r-lg transition-shadow",
            dragging === 'end' && "shadow-[0_0_16px_rgba(199,20,26,0.5)]"
          )}
          style={{ left: `calc(${endPct}% - 14px)` }}
          onPointerDown={(e) => handlePointerDown(e, 'end')}
        >
          <div className="w-[3px] h-8 bg-white/90 rounded-full" />
        </div>

        {/* Playhead */}
        {currentTime >= startTime && currentTime <= endTime && (
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-white z-20 pointer-events-none"
            style={{ left: `${currentPct}%`, boxShadow: '0 0 10px rgba(0,0,0,0.6)' }}
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2 border-slate-300" />
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2 border-slate-300" />
          </div>
        )}
      </div>

      {/* Total duration label */}
      <div className="flex justify-end">
        <span className="text-[11px] text-slate-400 font-mono">
          Duração total: {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
