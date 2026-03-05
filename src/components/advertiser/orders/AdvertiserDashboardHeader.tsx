import React from 'react';
import { cn } from '@/lib/utils';
import { ImagePlus } from 'lucide-react';

interface AdvertiserDashboardHeaderProps {
  logoUrl?: string;
  companyName?: string;
  cnpj?: string;
  ownerName?: string;
  className?: string;
}

export const AdvertiserDashboardHeader: React.FC<AdvertiserDashboardHeaderProps> = ({
  logoUrl,
  companyName,
  cnpj,
  ownerName,
  className
}) => {
  const initial = (companyName || ownerName || 'E')?.charAt(0).toUpperCase();

  return (
    <div className={cn(
      'bg-card border border-border/40 rounded-2xl p-4 sm:p-6 shadow-sm',
      className
    )}>
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#4a0f0f] via-[#6B1515] to-[#7D1818] flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo da empresa"
              className="w-full h-full object-contain p-2 brightness-0 invert"
            />
          ) : (
            <span className="text-white text-xl sm:text-2xl font-bold">
              {initial}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-foreground truncate leading-tight">
            {companyName || 'Minha Empresa'}
          </h2>
          {cnpj && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              CNPJ: {cnpj}
            </p>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {ownerName || 'Anunciante'}
          </p>
        </div>
      </div>

      {/* No logo placeholder */}
      {!logoUrl && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/30">
          <ImagePlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Adicione a logo da sua empresa para melhorar a identificação da sua conta.
          </p>
        </div>
      )}
    </div>
  );
};
