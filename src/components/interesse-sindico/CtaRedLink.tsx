import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface CtaRedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * CTA vermelho com efeito visual de transição (spinner) ao clicar,
 * para dar feedback enquanto a próxima página carrega (lazy import).
 */
const CtaRedLink: React.FC<CtaRedLinkProps> = ({ to, children, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setLoading(true);
    // breve atraso para a animação ser percebida
    setTimeout(() => navigate(to), 220);
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
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
