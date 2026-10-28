import React, { ReactNode, memo } from 'react';
import { CabecalhoSite, RodapeSite, useFonteSite } from '@/site/comum';
import '@/styles/components.css';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Moldura das páginas públicas antigas (login, cadastro, termos, mídia kit…).
 * Usa o mesmo cabeçalho e rodapé do site novo. Sem carrinho e sem "Finalizar compra":
 * por enquanto ninguém compra pelo site, a lista de prédios vai para a Sofia no WhatsApp (/loja).
 */
const Layout: React.FC<LayoutProps> = memo(({ children, className = '' }) => {
  useFonteSite();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F4F3F0' }}>
      <div className="exa-site" style={{ minHeight: 0, background: 'transparent', position: 'sticky', top: 0, zIndex: 40, overflow: 'visible' }}>
        <CabecalhoSite semPromo />
      </div>
      <main className={`flex-1 relative pt-0 ${className}`}>
        {children}
      </main>
      <div className="exa-site" style={{ minHeight: 0 }}>
        <RodapeSite />
      </div>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
