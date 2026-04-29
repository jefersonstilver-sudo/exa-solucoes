import React, { useCallback, useEffect, useRef, useState } from 'react';

interface MobileTrimmerTimelineProps {
  duration: number;
  startTime: number;
  windowSize: number;
  currentTime: number;
  isPlaying: boolean;
  onStartChange: (time: number) => void;
}

const formatTime = (t: number) => {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Timeline mobile profissional para corte de vídeo.
 * - Trilho com duração total
 * - Janela vermelha FIXA (10s ou 15s) que o usuário arrasta
 * - Marcadores de início/fim atualizados em tempo real
 * - Playhead durante reprodução
 * - Touch fluido com pointer events
 */
export const SimpleTrimmerSlider: React.FC<MobileTrimmerTimelineProps> = ({
  duration,
  startTime,
  windowSize,
  currentTime,
  isPlaying,
  onStartChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ pointerId: number | null; offsetPx: number }>({
    pointerId: null,
    offsetPx: 0,
  });

  const safeDuration = Math.max(duration, windowSize, 0.001);
  const maxStart = Math.max(0, safeDuration - windowSize);
  const endTime = Math.min(safeDuration, startTime + windowSize);

  // Medir largura do trilho (resize-aware)
  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const ro = new ResizeObserver(() => {
      setTrackWidth(el.clientWidth);
    });
    ro.observe(el);
    setTrackWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const pxPerSec = trackWidth / safeDuration;
  const windowPx = windowSize * pxPerSec;
  const startPx = startTime * pxPerSec;
  const playheadPx = Math.max(0, Math.min(currentTime, safeDuration)) * pxPerSec;

  const clampStart = useCallback(
    (sec: number) => Math.max(0, Math.min(sec, maxStart)),
    [maxStart]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;

      // Determinar offset: se clicou DENTRO da janela, manter posição relativa;
      // se clicou FORA, centralizar a janela no toque.
      let offset: number;
      if (pointerX >= startPx && pointerX <= startPx + windowPx) {
        offset = pointerX - startPx;
      } else {
        offset = windowPx / 2;
        // mover imediatamente
        const newStartPx = pointerX - offset;
        onStartChange(clampStart(newStartPx / pxPerSec));
      }

      dragStateRef.current = { pointerId: e.pointerId, offsetPx: offset };
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      try { (navigator as any).vibrate?.(8); } catch {}
    },
    [startPx, windowPx, pxPerSec, onStartChange, clampStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (
        dragStateRef.current.pointerId === null ||
        dragStateRef.current.pointerId !== e.pointerId ||
        !trackRef.current ||
        pxPerSec <= 0
      )
        return;
      const rect = trackRef.current.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const newStartPx = pointerX - dragStateRef.current.offsetPx;
      onStartChange(clampStart(newStartPx / pxPerSec));
    },
    [pxPerSec, onStartChange, clampStart]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId === e.pointerId) {
      dragStateRef.current.pointerId = null;
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  }, []);

  return (
    <div className="w-full space-y-3 select-none">
      {/* Header de tempos */}
      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
        <span className="text-slate-700">
          Início <span className="font-bold text-slate-900">{formatTime(startTime)}</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[#C7141A] text-white font-bold tracking-wide text-[11px]">
          {Math.round(windowSize)}s
        </span>
        <span className="text-slate-700">
          Fim <span className="font-bold text-slate-900">{formatTime(endTime)}</span>
        </span>
      </div>

      {/* Trilho (touch target ≥ 56px) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-14 rounded-2xl bg-slate-100 ring-1 ring-slate-200 overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        role="slider"
        aria-label="Janela de corte do vídeo"
        aria-valuemin={0}
        aria-valuemax={maxStart}
        aria-valuenow={startTime}
      >
        {/* Marcadores de segundo (a cada 5s) */}
        {trackWidth > 0 && safeDuration > 0 &&
          Array.from({ length: Math.floor(safeDuration / 5) + 1 }).map((_, i) => {
            const x = (i * 5) * pxPerSec;
            if (x > trackWidth) return null;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-slate-300/70"
                style={{ left: `${x}px` }}
              />
            );
          })}

        {/* Janela de corte (vermelho EXA) */}
        {trackWidth > 0 && (
          <div
            className={`absolute top-0 bottom-0 bg-[#C7141A]/15 border-2 border-[#C7141A] rounded-xl shadow-[0_4px_14px_rgba(199,20,26,0.35)] transition-shadow ${
              isDragging ? 'shadow-[0_6px_22px_rgba(199,20,26,0.55)]' : ''
            }`}
            style={{
              left: `${startPx}px`,
              width: `${windowPx}px`,
            }}
          >
            {/* Alça central (visual de drag) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <span className="w-0.5 h-4 bg-[#C7141A] rounded-full" />
              <span className="w-0.5 h-5 bg-[#C7141A] rounded-full" />
              <span className="w-0.5 h-4 bg-[#C7141A] rounded-full" />
            </div>
          </div>
        )}

        {/* Playhead */}
        {trackWidth > 0 && isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] pointer-events-none"
            style={{ left: `${playheadPx}px` }}
          >
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-white shadow-md" />
          </div>
        )}
      </div>

      {/* Régua inferior */}
      <div className="flex justify-between text-[10px] text-slate-400 tabular-nums">
        <span>0:00</span>
        <span>Total {formatTime(safeDuration)}</span>
      </div>
    </div>
  );
};
