import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crosshair, QrCode } from 'lucide-react';

const QR_SIZE = 200; // em pixels do CANVAS canônico

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  videoUrl: string;
  initialPosition?: { x: number; y: number } | null;
  onConfirm?: (positionInCanonicalPx: { x: number; y: number }) => void;
  /** Orientação do vídeo. 'vertical' usa canvas 1080x1920, qualquer outro usa 1920x1080. */
  orientation?: 'vertical' | 'horizontal';
  /** Modo somente leitura — desabilita drag/click e botão de confirmar. */
  readOnly?: boolean;
}

/**
 * Editor de posição do QR rastreável.
 *
 * IMPORTANTE: independente da resolução real do vídeo enviado, todas as coordenadas
 * são tratadas no canvas canônico 1920x1080 (ou 1080x1920 para vertical). Isso garante
 * que o backend e os monitores recebam sempre o mesmo sistema de referência.
 *
 * O vídeo é exibido com object-fit: contain dentro desse canvas — letterbox/pillarbox
 * são considerados parte do quadro e a sombra de 200x200 também pode ficar nessa área
 * (que será preenchida pelo backend ao renderizar em 1920x1080).
 */
export const VideoQRLocatorModal: React.FC<Props> = ({ open, onOpenChange, videoUrl, initialPosition, onConfirm, orientation = 'horizontal', readOnly = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Canvas canônico — SEMPRE 1920x1080 (ou 1080x1920 para vertical)
  const CANON_W = orientation === 'vertical' ? 1080 : 1920;
  const CANON_H = orientation === 'vertical' ? 1920 : 1080;
  const clampPosition = (pos: { x: number; y: number }) => ({
    x: Math.max(0, Math.min(CANON_W - QR_SIZE, Math.round(pos.x))),
    y: Math.max(0, Math.min(CANON_H - QR_SIZE, Math.round(pos.y))),
  });
  const defaultPosition = () => clampPosition({ x: (CANON_W - QR_SIZE) / 2, y: (CANON_H - QR_SIZE) / 2 });

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  // posição do canto superior esquerdo do QR em pixels do CANVAS CANÔNICO (1920x1080)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(initialPosition ?? null);
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({ dragging: false, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (open) {
      setPosition(initialPosition ? clampPosition(initialPosition) : defaultPosition());
    }
  }, [open, initialPosition?.x, initialPosition?.y, CANON_W, CANON_H]);

  // Track stage size on resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    // Atrasa para garantir que o Dialog já montou o stage
    const raf = requestAnimationFrame(update);
    const t = setTimeout(update, 50);
    let ro: ResizeObserver | null = null;
    if (stageRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(stageRef.current);
    }
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const handleLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    setNatural({ w, h });
    if (!position) {
      // centro visual do canvas canônico, salvando o canto superior esquerdo do QR
      setPosition(defaultPosition());
    }
  };

  // Escalas independentes em X e Y — evita "perder" a borda direita/inferior caso
  // o stage seja levemente diferente da razão canônica (por maxHeight, arredondamento, etc.)
  const scaleX = stageSize.w ? stageSize.w / CANON_W : 0;
  const scaleY = stageSize.h ? stageSize.h / CANON_H : 0;
  const ready = scaleX > 0 && scaleY > 0;

  const getStageMetrics = () => {
    if (!stageRef.current) return null;
    const rect = stageRef.current.getBoundingClientRect();
    return { rect, scaleX: rect.width / CANON_W, scaleY: rect.height / CANON_H };
  };

  const canonToStage = (px: { x: number; y: number }) => {
    const metrics = getStageMetrics();
    const currentScaleX = metrics?.scaleX ?? scaleX;
    const currentScaleY = metrics?.scaleY ?? scaleY;
    // Mapeia exatamente a área canônica 200x200 para o stage atual.
    // A borda visual fica dentro dessa área via boxSizing: border-box.
    return { left: px.x * currentScaleX, top: px.y * currentScaleY, width: QR_SIZE * currentScaleX, height: QR_SIZE * currentScaleY };
  };

  const stageToCanon = (clientX: number, clientY: number, anchor: 'topLeft' | 'center' = 'topLeft'): { x: number; y: number } | null => {
    const metrics = getStageMetrics();
    if (!metrics) return null;
    const xStage = clientX - metrics.rect.left;
    const yStage = clientY - metrics.rect.top;
    const offset = anchor === 'center' ? QR_SIZE / 2 : 0;
    let xCanon = (xStage / metrics.scaleX) - offset;
    let yCanon = (yStage / metrics.scaleY) - offset;
    xCanon = Math.max(0, Math.min(CANON_W - QR_SIZE, xCanon));
    yCanon = Math.max(0, Math.min(CANON_H - QR_SIZE, yCanon));
    return { x: Math.round(xCanon), y: Math.round(yCanon) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    if (!position) return;
    const metrics = getStageMetrics();
    if (!metrics) return;
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    const overlay = canonToStage(position);
    dragRef.current = {
      dragging: true,
      offsetX: (e.clientX - metrics.rect.left) - overlay.left,
      offsetY: (e.clientY - metrics.rect.top) - overlay.top,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (readOnly) return;
    if (!dragRef.current.dragging) return;
    const next = stageToCanon(e.clientX - dragRef.current.offsetX, e.clientY - dragRef.current.offsetY);
    if (next) setPosition(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (readOnly) return;
    dragRef.current.dragging = false;
    try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const onStageClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (dragRef.current.dragging) return;
    const next = stageToCanon(e.clientX, e.clientY, 'center');
    if (next) setPosition(next);
  };

  const overlay = position && ready ? canonToStage(position) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" /> {readOnly ? 'Posição do QR no vídeo' : 'Selecionar localização do QR'}
          </DialogTitle>
          <DialogDescription>
            {readOnly ? 'Visualização da posição definida (somente leitura).' : 'Arraste o QR Code para a posição desejada.'}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={stageRef}
          className="relative mx-auto bg-black rounded-lg select-none"
          style={{ aspectRatio: `${CANON_W} / ${CANON_H}`, width: `min(100%, calc(60vh * ${CANON_W} / ${CANON_H}))` }}
          onClick={onStageClick}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-fill rounded-lg"
            muted
            playsInline
            loop
            autoPlay
            onLoadedMetadata={handleLoaded}
          />
          {overlay && (
            <div
              role={readOnly ? undefined : 'button'}
              aria-label={readOnly ? 'Posição do QR' : 'Arraste para posicionar o QR'}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={(e) => e.stopPropagation()}
              className={`absolute ${readOnly ? 'cursor-default pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
              style={{
                left: overlay.left,
                top: overlay.top,
                width: overlay.width,
                height: overlay.height,
                boxSizing: 'border-box',
                background: 'rgba(0,0,0,0.55)',
                border: '2px dashed rgba(255,255,255,0.95)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.25) inset',
                touchAction: 'none',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white">
                <QrCode className="h-10 w-10 opacity-90" />
              </div>
            </div>
          )}
        </div>


        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? 'Fechar' : 'Cancelar'}</Button>
          {!readOnly && (
            <Button
              disabled={!position}
              onClick={() => {
                if (position && onConfirm) {
                  onConfirm(position);
                  onOpenChange(false);
                }
              }}
            >
              <Crosshair className="h-4 w-4 mr-1" />
              Selecionar localização
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
