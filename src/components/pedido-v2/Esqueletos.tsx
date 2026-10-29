import React from 'react';
import { CARD } from './ui';

/**
 * Esqueletos da área do anunciante: aparecem na hora (sem atraso), no formato da página que vai abrir.
 * Evita a "tela branca" entre o login / o toque no pedido e os dados chegarem.
 */
const B: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`block animate-pulse rounded-lg bg-[#e9e4e6] ${className}`} />
);

export const EsqueletoListaPedidos: React.FC = () => (
  <div className="mx-auto max-w-6xl space-y-5 px-0.5 pt-1" role="status" aria-label="Carregando pedidos">
    <div className="space-y-2">
      <B className="h-3 w-24" />
      <B className="h-8 w-52" />
      <B className="h-3 w-28" />
    </div>
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${CARD} flex items-center gap-3 p-3`}>
          <B className="h-14 w-[76px] flex-none rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <B className="h-4 w-2/3" />
            <B className="h-3 w-4/5" />
            <B className="h-4 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const EsqueletoPedido: React.FC = () => (
  <div className="mx-auto max-w-6xl space-y-4 pt-1" role="status" aria-label="Carregando pedido">
    <div className="space-y-2">
      <B className="h-7 w-56" />
      <B className="h-3.5 w-64 max-w-full" />
      <div className="flex gap-1.5 pt-1">
        <B className="h-7 w-28 rounded-full" />
        <B className="h-7 w-20 rounded-full" />
      </div>
    </div>
    <B className="h-[54px] w-full rounded-[16px]" />
    <B className="h-5 w-32" />
    <div className={`${CARD} space-y-3 p-4`}>
      <B className="aspect-[16/9] w-full rounded-2xl" />
      <B className="h-4 w-1/2" />
      <B className="h-3 w-3/4" />
    </div>
    <div className={`${CARD} space-y-3 p-4`}>
      <B className="h-4 w-40" />
      <B className="h-14 w-full rounded-xl" />
    </div>
  </div>
);

export const EsqueletoPerfil: React.FC = () => (
  <div className="mx-auto max-w-2xl space-y-4 pt-1" role="status" aria-label="Carregando perfil">
    <div className={`${CARD} flex items-center gap-3 p-4`}>
      <B className="h-14 w-14 flex-none rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <B className="h-3 w-20" />
        <B className="h-5 w-40" />
        <B className="h-3 w-48 max-w-full" />
      </div>
    </div>
    {[4, 3].map((n, k) => (
      <div key={k} className={`${CARD} divide-y divide-[#f1edee]`}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <B className="h-8 w-8 flex-none rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <B className="h-3 w-24" />
              <B className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);
