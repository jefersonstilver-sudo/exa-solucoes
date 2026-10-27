import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import LogoSelo from '@/components/exa2/LogoSelo';

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
      <LogoSelo src={logoUrl && !imgError ? logoUrl : null} fallback={initial} className="h-20 w-20 sm:h-24 sm:w-24" pad="p-2.5" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9C1E1E]">Sua empresa</div>
        <h2 className="truncate text-[24px] font-extrabold leading-tight tracking-tight text-[#1b1719] sm:text-[32px]">{companyName || ownerName || 'Minha empresa'}</h2>
        <p className="truncate text-[13px] text-[#8b8285]">
          {[docFmt ? `${docLabel} ${docFmt}` : null, companyName ? ownerName : null].filter(Boolean).join(' · ') || 'Anunciante EXA'}
        </p>
      </div>
    </div>
  );
};
