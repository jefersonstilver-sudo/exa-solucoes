import React, { useEffect } from 'react';
import LogoTicker from '@/components/exa/LogoTicker';

/**
 * Embed público do ticker de logos de clientes.
 * Rota: /embed/logos-ticker
 *
 * Renderiza apenas o LogoTicker (mesmo da home), sem layout, header,
 * sidebar ou auth — pronto para ser incorporado em qualquer site via <iframe>.
 *
 * Uso:
 *   <iframe
 *     src="https://examidia.com.br/embed/logos-ticker"
 *     style="width:100%;height:112px;border:0;display:block;background:#7D1818"
 *     loading="lazy"
 *     title="Clientes EXA Mídia">
 *   </iframe>
 */
const LogosTickerEmbed: React.FC = () => {
  useEffect(() => {
    // Reset agressivo de margens/scroll do body para o embed
    const prevBodyBg = document.body.style.background;
    const prevBodyMargin = document.body.style.margin;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.background = 'transparent';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.background = prevBodyBg;
      document.body.style.margin = prevBodyMargin;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div className="w-full overflow-hidden" style={{ background: '#7D1818' }}>
      <LogoTicker contained pauseOnHover={false} />
    </div>
  );
};

export default LogosTickerEmbed;
