import React, { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface CtaRedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * CTA vermelho com prefetch agressivo do chunk do formulário.
 * - Prefetch dispara em hover/focus/touch (antes do click event).
 * - Ao clicar: aguarda a Promise do import resolver e navega imediato.
 *   Se o chunk já estava em cache, a navegação é instantânea (sem flash de spinner).
 *   Spinner só aparece se demorar > ~80ms.
 */
const CtaRedLink: React.FC<CtaRedLinkProps> = ({ to, children, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const prefetchPromise = useRef<Promise<unknown> | null>(null);

  const triggerPrefetch = useCallback(() => {
    if (prefetchPromise.current) return prefetchPromise.current;
    prefetchPromise.current = Promise.all([
      import('@/pages/InteresseSindicoFormulario').catch(() => {}),
      import('@/utils/googleMapsLoader')
        .then((mod) => mod.loadGoogleMaps?.())
        .catch(() => {}),
    ]);
    return prefetchPromise.current;
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (loading) return;

    const ready = triggerPrefetch();
    let navigated = false;

    const go = () => {
      if (navigated) return;
      navigated = true;
      navigate(to);
    };

    // Spinner só aparece se demorar mais que 80ms
    const spinnerTimer = window.setTimeout(() => {
      if (!navigated) setLoading(true);
    }, 80);

    // Guarda absoluta: navega em no máximo 1500ms aconteça o que acontecer
    const guardTimer = window.setTimeout(go, 1500);

    ready.finally(() => {
      window.clearTimeout(spinnerTimer);
      window.clearTimeout(guardTimer);
      go();
    });
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      onMouseEnter={triggerPrefetch}
      onFocus={triggerPrefetch}
      onTouchStart={triggerPrefetch}
      className={`cta-red ${loading ? 'is-loading' : ''} ${className}`.trim()}
    >
      {loading ? (
        <>
          <span className="cta-spinner" aria-hidden="true" />
          <span>Carregando...</span>
        </>
      ) : (
        children
      )}
    </Link>
  );
};

export default CtaRedLink;
