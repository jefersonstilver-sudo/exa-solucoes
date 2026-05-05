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
  onConfirm: (centerInCanonicalPx: { x: number; y: number }) => void;
  /** Orientação do vídeo. 'vertical' usa canvas 1080x1920, qualquer outro usa 1920x1080. */
  orientation?: 'vertical' | 'horizontal';
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
export const VideoQRLocatorModal: React.FC<Props> = ({ open, onOpenChange, videoUrl, initialPosition, onConfirm, orientation = 'horizontal' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Canvas canônico — SEMPRE 1920x1080 (ou 1080x1920 para vertical)
  const CANON_W = orientation === 'vertical' ? 1080 : 1920;
  const CANON_H = orientation === 'vertical' ? 1920 : 1080;

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  // posição do centro em pixels do CANVAS CANÔNICO (1920x1080)
  const [center, setCenter] = useState<{ x: number; y: number } | null>(initialPosition ?? null);
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({ dragging: false, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (open) {
      setCenter(initialPosition ?? { x: Math.round(CANON_W / 2), y: Math.round(CANON_H / 2) });
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
    if (!center) {
      // centro do canvas canônico
      setCenter({ x: Math.round(CANON_W / 2), y: Math.round(CANON_H / 2) });
    }
  };

  // Escalas independentes em X e Y — evita "perder" a borda direita/inferior caso
  // o stage seja levemente diferente da razão canônica (por maxHeight, arredondamento, etc.)
  const scaleX = stageSize.w ? stageSize.w / CANON_W : 0;
  const scaleY = stageSize.h ? stageSize.h / CANON_H : 0;
  const ready = scaleX > 0 && scaleY > 0;

  const canonToStage = (px: { x: number; y: number }) => {
    const sizeStageX = QR_SIZE * scaleX;
    const sizeStageY = QR_SIZE * scaleY;
    const cxStage = px.x * scaleX;
    const cyStage = px.y * scaleY;
    return { left: cxStage - sizeStageX / 2, top: cyStage - sizeStageY / 2, width: sizeStageX, height: sizeStageY };
  };

  const stageToCanon = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!stageRef.current || !ready) return null;
    const r = stageRef.current.getBoundingClientRect();
    const xStage = clientX - r.left;
    const yStage = clientY - r.top;
    let xCanon = xStage / scaleX;
    let yCanon = yStage / scaleY;
    const half = QR_SIZE / 2;
    xCanon = Math.max(half, Math.min(CANON_W - half, xCanon));
    yCanon = Math.max(half, Math.min(CANON_H - half, yCanon));
    return { x: Math.round(xCanon), y: Math.round(yCanon) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready || !center) return;
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    const overlay = canonToStage(center);
    const r = stageRef.current!.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      offsetX: (e.clientX - r.left) - (overlay.left + overlay.width / 2),
      offsetY: (e.clientY - r.top) - (overlay.top + overlay.height / 2),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const next = stageToCanon(e.clientX - dragRef.current.offsetX, e.clientY - dragRef.current.offsetY);
    if (next) setCenter(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current.dragging = false;
    try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const onStageClick = (e: React.MouseEvent) => {
    if (dragRef.current.dragging) return;
    const next = stageToCanon(e.clientX, e.clientY);
    if (next) setCenter(next);
  };

  const overlay = center && ready ? canonToStage(center) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" /> Selecionar localização do QR
          </DialogTitle>
          <DialogDescription>
            Arraste a área de 200×200px para a posição desejada. As coordenadas são padronizadas no canvas <strong>{CANON_W}×{CANON_H}px</strong> — independente da resolução real do vídeo, o backend usará esse sistema para gerar o QR.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={stageRef}
          className="relative w-full bg-black rounded-lg overflow-hidden select-none"
          style={{ aspectRatio: `${CANON_W} / ${CANON_H}`, maxHeight: '60vh' }}
          onClick={onStageClick}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-contain"
            muted
            playsInline
            loop
            autoPlay
            onLoadedMetadata={handleLoaded}
          />
          {overlay && (
            <div
              role="button"
              aria-label="Arraste para posicionar o QR"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onClick={(e) => e.stopPropagation()}
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                left: overlay.left,
                top: overlay.top,
                width: overlay.width,
                height: overlay.height,
                background: 'rgba(0,0,0,0.55)',
                border: '2px dashed rgba(255,255,255,0.95)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.25) inset',
                touchAction: 'none',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white">
                <QrCode className="h-10 w-10 opacity-90" />
              </div>
              <div className="absolute -top-6 left-0 text-[11px] font-medium text-white bg-black/70 px-2 py-0.5 rounded">
                {center ? `${center.x}, ${center.y} px` : ''}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Canvas padronizado: <strong>{CANON_W}×{CANON_H}px</strong> · Área do QR: <strong>200×200px</strong>
          {natural && <> · Vídeo original: {natural.w}×{natural.h}px</>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!center}
            onClick={() => {
              if (center) {
                onConfirm(center);
                onOpenChange(false);
              }
            }}
          >
            <Crosshair className="h-4 w-4 mr-1" />
            Selecionar localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
