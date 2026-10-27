import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * EXA 2.0 — selo vermelho com a logo do cliente adaptada para fundo vermelho.
 * Lê a própria imagem (canvas) e escolhe, como um designer faria:
 *  - 'original': logo já clara (branca/creme) -> mantém como está;
 *  - 'branco'  : logo de uma cor só (ou quase) -> silhueta branca chapada;
 *  - 'tonal'   : logo colorida/detalhada -> monocromática em branco + cinzas claros (preserva os detalhes);
 *  - 'placa'   : logo COM fundo (não transparente) -> fica numa plaquinha branca arredondada dentro do selo.
 */
type Modo = 'original' | 'branco' | 'tonal' | 'placa';
const cache = new Map<string, Modo>();

function analisar(src: string): Promise<Modo> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const N = 64;
        const c = document.createElement('canvas');
        const r = Math.min(N / img.naturalWidth, N / img.naturalHeight, 1) || 1;
        c.width = Math.max(1, Math.round(img.naturalWidth * r));
        c.height = Math.max(1, Math.round(img.naturalHeight * r));
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve('tonal');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        let opacos = 0, transp = 0, somaL = 0, somaS = 0, coloridos = 0;
        const lums: number[] = [];
        const matiz = new Array(12).fill(0); // histograma de matiz (só pixels coloridos)
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] / 255;
          if (a < 0.15) { transp++; continue; }
          opacos++;
          const R = data[i] / 255, G = data[i + 1] / 255, B = data[i + 2] / 255;
          const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
          const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
          const S = mx === 0 ? 0 : (mx - mn) / mx;
          somaL += L; somaS += S; lums.push(L);
          if (S > 0.25 && mx > 0.2) {
            coloridos++;
            const d = mx - mn || 1;
            let h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
            if (h < 0) h += 6;
            matiz[Math.min(11, Math.floor(h * 2))]++;
          }
        }
        const total = opacos + transp;
        if (!opacos) return resolve('branco');
        if (transp / total < 0.06) return resolve('placa'); // tem fundo
        const mediaL = somaL / opacos, mediaS = somaS / opacos;
        const desvio = Math.sqrt(lums.reduce((s, l) => s + (l - mediaL) ** 2, 0) / lums.length);
        if (mediaL > 0.82 && mediaS < 0.25) return resolve('original');
        // quantas famílias de cor relevantes a logo tem
        const familias = coloridos ? matiz.filter((n) => n / coloridos > 0.12).length : 0;
        const monocromatica = coloridos / opacos < 0.15 || familias <= 1;
        // silhueta branca SÓ para logo de uma cor só e sem relevo interno (senão vira um borrão)
        if (monocromatica && desvio < 0.1) return resolve('branco');
        return resolve('tonal');
      } catch {
        resolve('tonal'); // imagem sem CORS: tonal funciona bem na maioria dos casos
      }
    };
    img.onerror = () => resolve('tonal');
    img.src = src;
  });
}

const FILTRO: Record<Modo, string> = {
  original: '',
  branco: 'brightness(0) invert(1)',
  // escuro -> cinza claro (#a7a7a7) e claro -> branco: monocromático sem perder os detalhes
  tonal: 'grayscale(1) contrast(0.85) brightness(1.15)',
  placa: '',
};

interface Props {
  src?: string | null;
  fallback?: string;
  className?: string;
  /** padding interno da logo (classe tailwind) */
  pad?: string;
  rounded?: string;
}

export const LogoSelo: React.FC<Props> = ({ src, fallback = 'E', className, pad = 'p-2', rounded = 'rounded-[22px]' }) => {
  const [modo, setModo] = useState<Modo | null>(src ? cache.get(src) || null : null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setErro(false);
    if (!src) { setModo(null); return; }
    if (cache.has(src)) { setModo(cache.get(src)!); return; }
    let vivo = true;
    analisar(src).then((m) => { cache.set(src, m); if (vivo) setModo(m); });
    return () => { vivo = false; };
  }, [src]);

  const temLogo = !!src && !erro;
  return (
    <div
      className={cn(
        'relative flex flex-shrink-0 items-center justify-center overflow-hidden',
        'bg-[#8a1a1e] bg-[radial-gradient(130%_100%_at_0%_0%,#b8292f_0%,rgba(184,41,47,0)_62%),radial-gradient(120%_90%_at_100%_100%,#6b1216_0%,rgba(107,18,22,0)_70%)]',
        'shadow-[0_14px_30px_-14px_rgba(138,26,30,0.85),inset_0_1px_0_rgba(255,255,255,0.18)]',
        rounded,
        className
      )}
    >
      {temLogo ? (
        modo === 'placa' ? (
          <span className={cn('flex h-[78%] w-[78%] items-center justify-center rounded-[14px] bg-white shadow-sm')}>
            <img src={src!} alt="Logo" className="h-full w-full object-contain p-1.5" onError={() => setErro(true)} />
          </span>
        ) : (
          <img
            src={src!}
            alt="Logo"
            className={cn('h-full w-full object-contain transition-opacity duration-300', pad, modo ? 'opacity-100' : 'opacity-0')}
            style={{ filter: [FILTRO[modo || 'tonal'], 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))'].filter(Boolean).join(' ') }}
            onError={() => setErro(true)}
          />
        )
      ) : (
        <span className="text-[38%] font-extrabold text-white" style={{ fontSize: 'clamp(16px, 2.2vw, 30px)' }}>{fallback}</span>
      )}
    </div>
  );
};

export default LogoSelo;
