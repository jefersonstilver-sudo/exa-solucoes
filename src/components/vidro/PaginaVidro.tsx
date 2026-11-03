import React from 'react';
import { Link } from 'react-router-dom';
import { useCorNavegador } from '@/lib/corNavegador';
import { useFonteSite } from '@/site/comum';

/**
 * Moldura padrão "EXA Vidro" (02/11/2026) para telas de conta: fundo escuro com degradê vermelho preso à tela,
 * logo no topo e conteúdo centralizado. O cartão usa a classe `exa-vidro` (ver src/styles/exa-vidro.css).
 */
export default function PaginaVidro({ children, largura = 'max-w-md' }: { children: React.ReactNode; largura?: string }) {
  useFonteSite();
  useCorNavegador({ topo: '#0B0B0D', fundo: '#0B0B0D' });
  return (
    <div className="exa-vidro-pagina dark flex flex-col">
      <header className="flex justify-center pt-[calc(env(safe-area-inset-top,0px)+28px)] pb-2">
        <Link to="/" aria-label="EXA, início">
          <img src="/site/exa-branco.svg" alt="EXA" width={96} height={42} style={{ height: 42, width: 'auto' }} />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">
        <div className={`w-full ${largura}`}>{children}</div>
      </main>
    </div>
  );
}
