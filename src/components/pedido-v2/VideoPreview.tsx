/**
 * EXA 2.0 — prévias de vídeo leves para a página do pedido.
 *  - LoopVideo: vídeo mudo em loop com fallback (quando o arquivo não carrega, mostra um "pôster").
 *  - HoverPlayVideo: mostra o 1º quadro e só toca enquanto o mouse está em cima (no toque, alterna).
 *  - HoverVideoPreview: popover com o VÍDEO REAL tocando, aberto por hover (desktop) ou toque (mobile).
 *    O <video> só é criado quando o popover abre.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Film } from 'lucide-react';
import { AgendaRule, ruleTypeOf } from '@/lib/agenda/agendaEngine';
import { BADGE } from './ui';

export type TipoJanela = 'principal' | 'semanal' | 'data' | 'sobreposicao' | 'aprovacao';

export const tipoDaJanela = (rule: AgendaRule | null | undefined): TipoJanela => {
  if (!rule) return 'principal';
  if (rule.is_override) return 'sobreposicao';
  return ruleTypeOf(rule) === 'data' ? 'data' : 'semanal';
};

const TIPO_INFO: Record<TipoJanela, { t: string; c: string }> = {
  principal: { t: '★ Principal', c: BADGE.principal },
  semanal: { t: '↻ Toda semana', c: BADGE.agendado },
  data: { t: '📅 Por data', c: BADGE.agendado },
  sobreposicao: { t: '⚑ Sobreposição', c: BADGE.aprovacao },
  aprovacao: { t: '⏳ Em aprovação', c: BADGE.aprovacao },
};

export const TipoBadge: React.FC<{ tipo: TipoJanela; className?: string }> = ({ tipo, className = '' }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold ${TIPO_INFO[tipo].c} ${className}`}>
    {TIPO_INFO[tipo].t}
  </span>
);

/** Pôster de reserva quando não há vídeo ou ele falha. */
export const VideoPoster: React.FC<{ nome?: string; className?: string; small?: boolean }> = ({ nome, className = '', small }) => (
  <div className={`flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#3a1016] via-[#7c1428] to-[#b8324b] text-white ${className}`}>
    <Film className={small ? 'h-4 w-4 opacity-80' : 'h-7 w-7 opacity-80'} />
    {!small && nome && <span className="max-w-[90%] truncate px-2 text-xs font-bold opacity-90">{nome}</span>}
  </div>
);

/** Vídeo mudo em loop (autoPlay) com fallback para pôster. */
export const LoopVideo: React.FC<{ url?: string; nome?: string; className?: string; fit?: 'cover' | 'contain' }> = ({
  url,
  nome,
  className = '',
  fit = 'cover',
}) => {
  const [erro, setErro] = useState(false);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    setErro(false);
    setPronto(false);
  }, [url]);
  if (!url || erro) return <VideoPoster nome={nome} className={`absolute inset-0 ${className}`} />;
  return (
    <>
      {!pronto && <VideoPoster nome={nome} className={`absolute inset-0 animate-pulse ${className}`} />}
      <video
        key={url}
        src={url}
        className={`absolute inset-0 h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setPronto(true)}
        onError={() => setErro(true)}
      />
    </>
  );
};

/** 1º quadro parado; toca enquanto o mouse está em cima. No toque, alterna tocar/pausar. */
export const HoverPlayVideo: React.FC<{ url?: string; nome?: string; className?: string }> = ({ url, nome, className = '' }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState(false);
  const [tocando, setTocando] = useState(false);
  if (!url || erro) return <VideoPoster nome={nome} small className={`absolute inset-0 ${className}`} />;
  const play = () => {
    const v = ref.current;
    if (!v) return;
    v.play().then(() => setTocando(true)).catch(() => undefined);
  };
  const stop = () => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    setTocando(false);
  };
  return (
    <div
      className={`absolute inset-0 ${className}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && play()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && stop()}
      onPointerUp={(e) => {
        if (e.pointerType !== 'mouse') (tocando ? stop() : play());
      }}
    >
      <video
        ref={ref}
        src={`${url}#t=0.5`}
        className="h-full w-full object-cover"
        preload="metadata"
        muted
        loop
        playsInline
        onError={() => setErro(true)}
      />
      {!tocando && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
          <svg width="11" height="13" viewBox="0 0 14 16" fill="#fff" aria-hidden><path d="M0 0l14 8L0 16z" /></svg>
        </span>
      )}
    </div>
  );
};

export interface PreviewInfo {
  url?: string;
  nome?: string;
  faixa?: string;
  tipo?: TipoJanela;
  cor?: string;
  extra?: string;
}

/**
 * Popover com o vídeo real tocando. Desktop: abre no hover (com pequeno atraso para não piscar).
 * Mobile: abre/fecha no toque. O filho precisa aceitar ref e eventos de ponteiro (div/button).
 */
export const HoverVideoPreview: React.FC<{
  info: PreviewInfo;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}> = ({ info, children, side = 'top', disabled }) => {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const ultimoPonteiro = useRef<string>('mouse');
  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const later = useCallback((v: boolean, ms: number) => {
    clear();
    timer.current = window.setTimeout(() => setOpen(v), ms);
  }, []);
  useEffect(() => clear, []);

  if (disabled) return children;

  const child = children as React.ReactElement<any>;
  const trigger = React.cloneElement(child, {
    onPointerDown: (e: React.PointerEvent) => {
      child.props.onPointerDown?.(e);
      ultimoPonteiro.current = e.pointerType;
    },
    onPointerEnter: (e: React.PointerEvent) => {
      child.props.onPointerEnter?.(e);
      if (e.pointerType === 'mouse') later(true, 140);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      child.props.onPointerLeave?.(e);
      if (e.pointerType === 'mouse') later(false, 160);
    },
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      // Toque (ou clique sem hover): alterna. Com mouse o hover já abriu — o clique mantém aberto.
      clear();
      const tipo = (e.nativeEvent as PointerEvent).pointerType || ultimoPonteiro.current;
      setOpen((o) => (tipo === 'mouse' ? true : !o));
    },
    style: { ...(child.props.style || {}), cursor: 'pointer' },
  });

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>{trigger}</PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerEnter={(e) => e.pointerType === 'mouse' && clear()}
          onPointerLeave={(e) => e.pointerType === 'mouse' && later(false, 160)}
          className="z-[var(--z-floating,60)] w-64 overflow-hidden rounded-2xl bg-white shadow-[0_2px_6px_rgba(30,15,18,.08),0_24px_48px_-18px_rgba(30,15,18,.45)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="relative aspect-[1080/890] bg-black">
            <LoopVideo url={info.url} nome={info.nome} fit="contain" />
            {info.cor && <span className="absolute left-2 top-2 h-3 w-3 rounded-full ring-2 ring-white" style={{ background: info.cor }} />}
          </div>
          <div className="space-y-1 p-3">
            <div className="truncate text-sm font-extrabold text-[#1b1719]">{info.nome?.replace(/_/g, ' ') || 'Vídeo'}</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {info.tipo && <TipoBadge tipo={info.tipo} />}
              {info.faixa && <span className="text-xs font-semibold tabular-nums text-[#554e50]">{info.faixa}</span>}
            </div>
            {info.extra && <div className="text-[11px] text-[#8b8285]">{info.extra}</div>}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
