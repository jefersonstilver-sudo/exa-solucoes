import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImagePlus } from 'lucide-react';

interface AdvertiserDashboardHeaderProps {
  logoUrl?: string;
  companyName?: string;
  cnpj?: string;
  ownerName?: string;
  logoScale?: number;
  className?: string;
}

export const AdvertiserDashboardHeader: React.FC<AdvertiserDashboardHeaderProps> = ({
  logoUrl,
  companyName,
  cnpj,
  ownerName,
  logoScale = 1,
  className
}) => {
  const initial = (companyName || ownerName || 'E')?.charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);

  const doc = String(cnpj || '').replace(/\D/g, '');
  const docFmt = doc.length === 14 ? doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : doc.length === 11 ? doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cnpj;
  const docLabel = doc.length === 11 ? 'CPF' : 'CNPJ';

  return (
    <div className={cn('flex items-center gap-4 sm:gap-5', className)}>
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#8a1a1e] bg-[radial-gradient(120%_90%_at_0%_0%,#b2272d_0%,rgba(178,39,45,0)_65%)] shadow-[0_10px_24px_-12px_rgba(138,26,30,0.8)] sm:h-[72px] sm:w-[72px]">
        {logoUrl && !imgError ? (
          <img
            src={logoUrl}
            alt="Logo da empresa"
            className={cn('h-full w-full object-contain p-3 drop-shadow-sm', !logoUrl.includes('#original') && 'brightness-0 invert')}
            style={{ transform: `scale(${logoScale})` }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl font-extrabold text-white">{initial}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9C1E1E]">Sua empresa</div>
        <h2 className="truncate text-[24px] font-extrabold leading-tight tracking-tight text-[#1b1719] sm:text-[30px]">{companyName || ownerName || 'Minha empresa'}</h2>
        <p className="truncate text-[13px] text-[#8b8285]">
          {[docFmt ? `${docLabel} ${docFmt}` : null, companyName ? ownerName : null].filter(Boolean).join(' · ') || 'Anunciante EXA'}
        </p>
      </div>
    </div>
  );
};
