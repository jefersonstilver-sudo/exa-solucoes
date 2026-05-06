import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export type SeloAirbnbSize = 'sm' | 'md' | 'lg' | 'xl';

interface SeloAirbnbProps {
  size?: SeloAirbnbSize;
  className?: string;
  title?: string;
}

const SIZE_MAP: Record<SeloAirbnbSize, { wrap: string; text: string; px: number }> = {
  sm: { wrap: 'h-6', text: 'text-[9px]', px: 24 },
  md: { wrap: 'h-9', text: 'text-[11px]', px: 36 },
  lg: { wrap: 'h-12', text: 'text-xs', px: 48 },
  xl: { wrap: 'h-16', text: 'text-sm', px: 64 },
};

/**
 * Selo "Airbnb" exibido em prédios com tem_airbnb = true.
 * - Imagem: /selos/airbnb.png
 * - Fallback: badge textual "AIRBNB" em vermelho Airbnb (#FF5A5F)
 */
export const SeloAirbnb: React.FC<SeloAirbnbProps> = ({
  size = 'md',
  className,
  title = 'Este prédio possui hóspedes via Airbnb',
}) => {
  const [errored, setErrored] = useState(false);
  const cfg = SIZE_MAP[size];

  if (errored) {
    return (
      <span
        title={title}
        aria-label="Prédio com Airbnb"
        className={cn(
          'inline-flex items-center justify-center rounded-full px-2 py-0.5 font-bold tracking-wide text-white shadow',
          cfg.text,
          className,
        )}
        style={{ backgroundColor: '#FF5A5F' }}
      >
        AIRBNB
      </span>
    );
  }

  return (
    <img
      src="/selos/airbnb.png"
      alt="Prédio com Airbnb"
      title={title}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn('inline-block w-auto select-none', cfg.wrap, className)}
      draggable={false}
      width={cfg.px * 3}
      height={cfg.px}
    />
  );
};

export default SeloAirbnb;
