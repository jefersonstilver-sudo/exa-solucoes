import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
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
    if (!isDragging && !isDraggingPlayhead) return;
    e.preventDefault();

    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();

    if (isDraggingPlayhead) {
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      onSeek(ratio * duration);
      return;
    }

    if (isDragging) {
      const dx = e.clientX - dragStartX.current;
      const dt = (dx / rect.width) * duration;
      const windowSize = Math.min(maxDuration, duration);
      let newStart = dragStartTimeRef.current + dt;
      newStart = Math.max(0, Math.min(newStart, duration - windowSize));
      onStartChange(newStart);
    }
  }, [isDragging, isDraggingPlayhead, duration, maxDuration, onStartChange, onSeek]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsDraggingPlayhead(false);
  }, []);

  const handlePlayheadPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || isDraggingPlayhead) return;
    const time = getTimeFromX(e.clientX);
    if (time >= startTime && time <= endTime) {
      onSeek(time);
    } else {
      const windowSize = Math.min(maxDuration, duration);
      const newStart = Math.max(0, Math.min(time - windowSize / 2, duration - windowSize));
      onStartChange(newStart);
    }
  }, [isDragging, isDraggingPlayhead, getTimeFromX, startTime, endTime, maxDuration, duration, onStartChange, onSeek]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 1, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoomLevel(prev => Math.min(prev + 0.5, 10));
      } else {
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
      }
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || zoomLevel <= 1) return;
    const centerTime = (startTime + endTime) / 2;
    const centerRatio = centerTime / duration;
    const innerWidth = container.scrollWidth;
    const visibleWidth = container.clientWidth;
    const targetScroll = centerRatio * innerWidth - visibleWidth / 2;
    container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
  }, [zoomLevel, startTime, endTime, duration]);

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
      {/* Time display + Zoom controls */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-mono text-slate-400 tabular-nums">{formatTime(startTime)}</span>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1.5 py-1">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-[11px] font-bold text-slate-600 tabular-nums min-w-[28px] text-center">
              {zoomLevel.toFixed(zoomLevel % 1 === 0 ? 0 : 1)}x
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 10}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800 tabular-nums tracking-tight">
              {maxDuration}s
            </span>
            <span className="text-xs text-slate-400">fixo</span>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 tabular-nums">{formatTime(endTime)}</span>
      </div>

      {/* Scrollable timeline container */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent rounded-2xl"
        onWheel={handleWheel}
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Timeline track */}
        <div
          ref={trackRef}
          className="relative rounded-2xl overflow-hidden select-none touch-none"
          style={{
            height: '88px',
            width: zoomLevel <= 1 ? '100%' : `${100 * zoomLevel}%`,
            minWidth: '100%',
          }}
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
          <div
            className={`absolute top-0 bottom-0 w-[3px] z-10 ${
              isDraggingPlayhead ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: `${currentPct}%`,
              boxShadow: '0 0 8px rgba(0,0,0,0.7), 0 0 2px rgba(255,255,255,0.5)',
              transition: (isDragging || isDraggingPlayhead) ? 'none' : 'left 0.05s linear',
            }}
            onPointerDown={handlePlayheadPointerDown}
          >
            <div className="absolute -left-3 -right-3 top-0 bottom-0" />
            <div className="absolute inset-0 bg-white rounded-full" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-white" />
            {isDraggingPlayhead && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm whitespace-nowrap">
                <span className="text-[10px] font-mono font-bold text-white tabular-nums">
                  {formatTime(currentTime)}
                </span>
              </div>
            )}
          </div>
        </div>
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
