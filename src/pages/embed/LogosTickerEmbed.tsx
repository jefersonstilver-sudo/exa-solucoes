import React, { useEffect, useMemo } from 'react';
import LogoTicker from '@/components/exa/LogoTicker';

/**
 * Embed público do ticker de logos de clientes.
 * Rota: /embed/logos-ticker
 *
 * Querystring:
 *   ?bg=transparent      → fundo transparente
 *   ?bg=07070c | 7D1818  → hex (3 ou 6 chars, sem #)
 *   default              → #7D1818 (vermelho EXA)
 *
 * Uso:
 *   <iframe
 *     src="https://examidia.com.br/embed/logos-ticker?bg=07070c"
 *     style="width:100%;height:112px;border:0;display:block"
 *     loading="lazy"
 *     title="Clientes EXA Mídia">
 *   </iframe>
 */
const HEX_RE = /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

const resolveBg = (raw: string | null): string => {
  if (!raw) return '#7D1818';
  const v = raw.trim().toLowerCase();
  if (v === 'transparent' || v === 'none') return 'transparent';
  const hex = v.startsWith('#') ? v.slice(1) : v;
  if (HEX_RE.test(hex)) return `#${hex}`;
  return '#7D1818';
};

const LogosTickerEmbed: React.FC = () => {
  const bg = useMemo(() => {
    if (typeof window === 'undefined') return '#7D1818';
    return resolveBg(new URLSearchParams(window.location.search).get('bg'));
  }, []);

  useEffect(() => {
    const prevBodyBg = document.body.style.background;
    const prevBodyMargin = document.body.style.margin;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.background = bg === 'transparent' ? 'transparent' : bg;
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.background = prevBodyBg;
      document.body.style.margin = prevBodyMargin;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [bg]);

  return (
    <div className="w-full overflow-hidden" style={{ background: bg }}>
      <LogoTicker contained pauseOnHover={false} />
    </div>
  );
};

export default LogosTickerEmbed;
