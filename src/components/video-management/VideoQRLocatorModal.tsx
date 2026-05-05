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
    if (open) setCenter(initialPosition ?? null);
  }, [open, initialPosition?.x, initialPosition?.y]);

  // Track stage size on resize
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
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

  // O stage tem sempre aspect ratio do CANVAS CANÔNICO. Escala 1 unidade canônica → px de tela.
  const scale = stageSize.w && stageSize.h ? stageSize.w / CANON_W : 0;

  const canonToStage = (px: { x: number; y: number }) => {
    const sizeStage = QR_SIZE * scale;
    const cxStage = px.x * scale;
    const cyStage = px.y * scale;
    return { left: cxStage - sizeStage / 2, top: cyStage - sizeStage / 2, size: sizeStage };
  };

  const stageToCanon = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!stageRef.current || !scale) return null;
    const r = stageRef.current.getBoundingClientRect();
    const xStage = clientX - r.left;
    const yStage = clientY - r.top;
    let xCanon = xStage / scale;
    let yCanon = yStage / scale;
    const half = QR_SIZE / 2;
    xCanon = Math.max(half, Math.min(CANON_W - half, xCanon));
    yCanon = Math.max(half, Math.min(CANON_H - half, yCanon));
    return { x: Math.round(xCanon), y: Math.round(yCanon) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!scale || !center) return;
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    const overlay = canonToStage(center);
    const r = stageRef.current!.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      offsetX: (e.clientX - r.left) - (overlay.left + overlay.size / 2),
      offsetY: (e.clientY - r.top) - (overlay.top + overlay.size / 2),
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

  const overlay = center && scale ? canonToStage(center) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" /> Selecionar localização do QR
          </DialogTitle>
          <DialogDescription>
            Arraste a área de 200x200px (em pixels do vídeo) para a posição desejada. O QR final será gerado neste ponto pelo nosso backend.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={stageRef}
          className="relative w-full bg-black rounded-lg overflow-hidden select-none"
          style={{ aspectRatio: natural ? `${natural.w} / ${natural.h}` : '16 / 9', maxHeight: '60vh' }}
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
                width: overlay.size,
                height: overlay.size,
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
          {natural ? <>Resolução do vídeo: <strong>{natural.w}×{natural.h}px</strong> · Área do QR: <strong>200×200px</strong></> : 'Carregando vídeo...'}
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
